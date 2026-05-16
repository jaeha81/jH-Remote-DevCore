import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { loadConfig } from './config.js';

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
  port = DEFAULT_PORT,
  cwd = process.cwd(),
  env = process.env,
  fetchImpl = globalThis.fetch
} = {}) {
  const server = createServer(async (request, response) => {
    try {
      if (request.url === '/api/status') {
        const state = await buildVoicePreviewState({ cwd, env, fetchImpl });
        sendJson(response, 200, state);
        return;
      }

      if (request.url === '/' || request.url === '/index.html') {
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
    async start() {
      await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, '127.0.0.1', () => {
          server.off('error', reject);
          resolve();
        });
      });

      return {
        started: true,
        mode: 'voice-preview',
        url: `http://127.0.0.1:${port}`
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
