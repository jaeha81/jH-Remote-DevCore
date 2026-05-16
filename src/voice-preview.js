import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { loadConfig } from './config.js';
import { createAgentRoomClient } from './agent-room-client.js';
import { createLocalConnectorAgent } from './local-connector-agent.js';

const DEFAULT_PORT = 3210;
const MAX_TAIL_LINES = 80;

export async function buildVoicePreviewState({
  cwd = process.cwd(),
  env = process.env,
  readTextFile = readFileUtf8,
  fetchImpl = globalThis.fetch
} = {}) {
  const config = loadConfig(env);
  const [outLog, errLog, agentRoom] = await Promise.all([
    readLogTail(join(cwd, '.discord-voice.out.log'), readTextFile),
    readLogTail(join(cwd, '.discord-voice.err.log'), readTextFile),
    readAgentRoomStatus(config.agentRoom, fetchImpl)
  ]);

  return {
    generatedAt: new Date().toISOString(),
    config: {
      discordToken: Boolean(config.discord.token),
      voiceGuildId: config.discord.voiceGuildId || '',
      voiceChannelId: config.discord.voiceChannelId || '',
      whisperProvider: config.whisper.provider,
      whisperReady: config.whisper.provider === 'openai' && Boolean(config.whisper.apiKey),
      agentRoomEnabled: config.agentRoom.enabled,
      agentRoomBaseUrl: config.agentRoom.baseUrl,
      agentRoomTarget: config.agentRoom.target
    },
    logs: {
      out: outLog,
      err: errLog
    },
    agentRoom
  };
}

export function createVoicePreviewServer({
  host = '127.0.0.1',
  port = DEFAULT_PORT,
  cwd = process.cwd(),
  env = process.env,
  fetchImpl = globalThis.fetch,
  connector = createLocalConnectorAgent(),
  agentRoomClient = createAgentRoomClient(loadConfig(env).agentRoom)
} = {}) {
  const server = createServer(async (request, response) => {
    try {
      if (request.method === 'GET' && request.url === '/api/status') {
        const state = await buildVoicePreviewState({ cwd, env, fetchImpl });
        sendJson(response, 200, state);
        return;
      }

      if (request.method === 'POST' && request.url === '/api/transcript') {
        const payload = await readJsonRequest(request);
        const result = await submitPreviewTranscript({
          transcript: payload?.transcript,
          connector,
          agentRoomClient
        });
        sendJson(response, 200, result);
        return;
      }

      if (request.method === 'GET' && (request.url === '/' || request.url === '/index.html')) {
        sendHtml(response, 200, renderPreviewHtml());
        return;
      }

      sendJson(response, 404, { error: 'not_found' });
    } catch (error) {
      sendJson(response, 500, {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  return {
    port,
    server,
    renderHtml: renderPreviewHtml,
    async start() {
      await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, host, () => {
          server.off('error', reject);
          resolve();
        });
      });
      const address = server.address();
      const boundPort = typeof address === 'object' && address ? address.port : port;
      const urlHost = host === '0.0.0.0' ? '127.0.0.1' : host;

      return {
        started: true,
        mode: 'voice-preview',
        host,
        port: boundPort,
        url: `http://${urlHost}:${boundPort}`
      };
    },
    async stop() {
      if (!server.listening) return;
      await new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
      });
    }
  };
}

export async function submitPreviewTranscript({
  transcript,
  connector = createLocalConnectorAgent(),
  agentRoomClient = createAgentRoomClient(loadConfig().agentRoom)
} = {}) {
  const normalized = String(transcript ?? '').trim();
  if (!normalized) {
    throw new Error('transcript is required');
  }

  const routing = await connector.handleTranscript(normalized);
  const message = {
    ...routing.agentRoomMessage,
    source: 'browser:speech'
  };
  const delivery = normalizeDelivery(await maybeDeliverTranscript(agentRoomClient, routing, message));

  return {
    ok: true,
    routing: {
      transcript: routing.transcript,
      intent: routing.intent,
      risk: routing.risk,
      action: routing.action
    },
    delivery
  };
}

async function readFileUtf8(path) {
  return readFile(path, 'utf8');
}

async function readLogTail(path, readTextFile) {
  try {
    const content = await readTextFile(path);
    const lines = String(content)
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-MAX_TAIL_LINES)
      .map(redactSecrets);

    return {
      exists: true,
      path,
      lineCount: lines.length,
      tail: lines
    };
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return {
        exists: false,
        path,
        lineCount: 0,
        tail: []
      };
    }

    return {
      exists: false,
      path,
      error: error instanceof Error ? error.message : String(error),
      lineCount: 0,
      tail: []
    };
  }
}

async function readAgentRoomStatus(agentRoomConfig, fetchImpl) {
  try {
    const response = await fetchImpl(`${agentRoomConfig.baseUrl}/api/status?format=json`, {
      method: 'GET'
    });
    const body = typeof response.json === 'function' ? await response.json() : null;
    const messages = extractMessages(body);

    return {
      ok: response.ok,
      status: response.status,
      recentVoiceMessages: messages
        .filter(isVoiceMessage)
        .slice(-20)
        .map(redactMessage)
    };
  } catch (error) {
    return {
      ok: false,
      reason: 'agent_room_unreachable',
      error: error instanceof Error ? error.message : String(error),
      recentVoiceMessages: []
    };
  }
}

function extractMessages(body) {
  if (!body || typeof body !== 'object') return [];
  if (Array.isArray(body.messages)) return body.messages;
  if (Array.isArray(body.body?.messages)) return body.body.messages;
  if (Array.isArray(body.recentMessages)) return body.recentMessages;
  if (Array.isArray(body.body?.recentMessages)) return body.body.recentMessages;
  return [];
}

function isVoiceMessage(message) {
  const serialized = JSON.stringify(message ?? {}).toLowerCase();
  return serialized.includes('discord:voice') || serialized.includes('voice devcore');
}

function redactMessage(message) {
  return JSON.parse(redactSecrets(JSON.stringify(message ?? {})));
}

function redactSecrets(value) {
  return String(value)
    .replace(/sk-[A-Za-z0-9_-]{8,}/g, 'sk-REDACTED')
    .replace(/[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{20,}/g, 'DISCORD_TOKEN_REDACTED');
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  response.end(JSON.stringify(body, null, 2));
}

function sendHtml(response, status, html) {
  response.writeHead(status, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store'
  });
  response.end(html);
}

async function maybeDeliverTranscript(agentRoomClient, routing, message) {
  if (routing.action.route.channel !== 'agent_room') {
    return {
      sent: false,
      reason: 'route_not_agent_room',
      target: routing.action.route.target
    };
  }

  return agentRoomClient.send(message);
}

function normalizeDelivery(delivery) {
  return {
    sent: Boolean(delivery?.sent),
    target: delivery?.target,
    status: delivery?.status,
    reason: delivery?.reason
  };
}

async function readJsonRequest(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function renderPreviewHtml() {
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>JH Voice Preview</title>
  <style>
    :root {
      color-scheme: light;
      font-family: Arial, "Malgun Gothic", sans-serif;
      background: #f5f7f9;
      color: #17202a;
    }
    body { margin: 0; }
    main { max-width: 1180px; margin: 0 auto; padding: 24px; }
    h1 { font-size: 24px; margin: 0 0 4px; }
    h2 { font-size: 16px; margin: 0 0 12px; }
    .subtle { color: #5d6d7e; font-size: 13px; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-top: 18px; }
    .panel { background: #ffffff; border: 1px solid #d9e2ec; border-radius: 8px; padding: 16px; min-width: 0; }
    .span { grid-column: 1 / -1; }
    .actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
    button { border: 1px solid #98a6b3; background: #17202a; color: #fff; border-radius: 6px; padding: 8px 12px; font-weight: 700; cursor: pointer; }
    button.secondary { background: #fff; color: #17202a; }
    button:disabled { opacity: .55; cursor: not-allowed; }
    input { border: 1px solid #b8c4d0; border-radius: 6px; padding: 9px 10px; min-width: 260px; flex: 1; font-size: 14px; }
    .row { display: flex; justify-content: space-between; gap: 12px; border-bottom: 1px solid #eef2f6; padding: 8px 0; font-size: 14px; }
    .row:last-child { border-bottom: 0; }
    .key { color: #5d6d7e; }
    .value { font-weight: 700; text-align: right; overflow-wrap: anywhere; }
    .ok { color: #147d3f; }
    .bad { color: #b42318; }
    pre { margin: 0; max-height: 280px; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 12px; line-height: 1.45; }
    @media (max-width: 760px) {
      main { padding: 16px; }
      .grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main>
    <h1>JH Voice Preview</h1>
    <div class="subtle" id="generatedAt">loading</div>
    <section class="grid">
      <div class="panel">
        <h2>Runtime</h2>
        <div id="runtime"></div>
      </div>
      <div class="panel">
        <h2>Agent Room</h2>
        <div id="agentRoom"></div>
      </div>
      <div class="panel span">
        <h2>Browser Speech</h2>
        <div class="subtle" id="speechStatus">ready</div>
        <div class="actions">
          <button id="startSpeech">Start mic</button>
          <button class="secondary" id="stopSpeech">Stop</button>
        </div>
        <div class="actions">
          <input id="manualTranscript" type="text" placeholder="모바일에서 음성이 안 되면 여기에 입력">
          <button id="sendManualTranscript">Send</button>
        </div>
        <pre id="speechLog"></pre>
      </div>
      <div class="panel">
        <h2>Voice stdout</h2>
        <pre id="outLog"></pre>
      </div>
      <div class="panel">
        <h2>Voice stderr</h2>
        <pre id="errLog"></pre>
      </div>
      <div class="panel span">
        <h2>Recent Voice Messages</h2>
        <pre id="voiceMessages"></pre>
      </div>
    </section>
  </main>
  <script>
    const bool = (value) => value ? '<span class="ok">ready</span>' : '<span class="bad">missing</span>';
    const row = (key, value) => '<div class="row"><span class="key">' + key + '</span><span class="value">' + value + '</span></div>';
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const speechStatus = document.getElementById('speechStatus');
    const speechLog = document.getElementById('speechLog');
    const startSpeech = document.getElementById('startSpeech');
    const stopSpeech = document.getElementById('stopSpeech');
    const manualTranscript = document.getElementById('manualTranscript');
    const sendManualTranscript = document.getElementById('sendManualTranscript');
    let recognition;

    function appendSpeech(message) {
      speechLog.textContent = [new Date().toLocaleTimeString() + ' ' + message, speechLog.textContent]
        .filter(Boolean)
        .join('\\n');
    }

    async function sendTranscript(transcript) {
      if (!transcript.trim()) return;
      const response = await fetch('/api/transcript', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ transcript })
      });
      const result = await response.json();
      appendSpeech('sent: ' + transcript + ' -> ' + JSON.stringify(result.delivery));
      await refresh();
    }

    sendManualTranscript.onclick = () => {
      const transcript = manualTranscript.value.trim();
      manualTranscript.value = '';
      sendTranscript(transcript).catch((error) => appendSpeech('send failed: ' + error.message));
    };
    manualTranscript.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        sendManualTranscript.click();
      }
    });

    if (!SpeechRecognition) {
      speechStatus.innerHTML = '<span class="bad">browser speech recognition unsupported</span>';
      startSpeech.disabled = true;
      stopSpeech.disabled = true;
    } else {
      recognition = new SpeechRecognition();
      recognition.lang = 'ko-KR';
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.onstart = () => {
        speechStatus.innerHTML = '<span class="ok">listening</span>';
        appendSpeech('listening started');
      };
      recognition.onerror = (event) => {
        speechStatus.innerHTML = '<span class="bad">' + event.error + '</span>';
        appendSpeech('error: ' + event.error);
      };
      recognition.onend = () => {
        speechStatus.textContent = 'stopped';
      };
      recognition.onresult = (event) => {
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          if (!result.isFinal) continue;
          const transcript = result[0].transcript.trim();
          if (!transcript) continue;
          appendSpeech('heard: ' + transcript);
          sendTranscript(transcript).catch((error) => appendSpeech('send failed: ' + error.message));
        }
      };
      startSpeech.onclick = () => recognition.start();
      stopSpeech.onclick = () => recognition.stop();
    }

    async function refresh() {
      const response = await fetch('/api/status', { cache: 'no-store' });
      const state = await response.json();
      document.getElementById('generatedAt').textContent = 'updated ' + state.generatedAt;
      document.getElementById('runtime').innerHTML = [
        row('Discord token', bool(state.config.discordToken)),
        row('Voice guild', state.config.voiceGuildId || '<span class="bad">missing</span>'),
        row('Voice channel', state.config.voiceChannelId || '<span class="bad">missing</span>'),
        row('Whisper', bool(state.config.whisperReady)),
        row('Provider', state.config.whisperProvider)
      ].join('');
      document.getElementById('agentRoom').innerHTML = [
        row('Enabled', String(state.config.agentRoomEnabled)),
        row('Reachable', state.agentRoom.ok ? '<span class="ok">yes</span>' : '<span class="bad">no</span>'),
        row('Target', state.config.agentRoomTarget),
        row('URL', state.config.agentRoomBaseUrl)
      ].join('');
      document.getElementById('outLog').textContent = state.logs.out.tail.join('\\n') || '(no stdout log)';
      document.getElementById('errLog').textContent = state.logs.err.tail.join('\\n') || '(no stderr log)';
      document.getElementById('voiceMessages').textContent = JSON.stringify(state.agentRoom.recentVoiceMessages, null, 2);
    }
    refresh();
    setInterval(refresh, 2000);
  </script>
</body>
</html>`;
}
