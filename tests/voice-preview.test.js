import test from 'node:test';
import assert from 'node:assert/strict';

import { buildVoicePreviewState, createVoicePreviewServer, submitPreviewTranscript } from '../src/voice-preview.js';

test('voice preview reports runtime logs, config readiness, and recent voice messages', async () => {
  const state = await buildVoicePreviewState({
    cwd: 'D:\\project',
    env: {
      DISCORD_BOT_TOKEN: 'discord-token',
      DISCORD_VOICE_GUILD_ID: 'guild-1',
      DISCORD_VOICE_CHANNEL_ID: 'voice-1',
      WHISPER_PROVIDER: 'openai',
      OPENAI_API_KEY: 'sk-test',
      AGENT_ROOM_ENABLED: 'true',
      AGENT_ROOM_BASE_URL: 'http://agent-room.local',
      AGENT_ROOM_TARGET: 'claude'
    },
    readTextFile: async (path) => {
      if (path.endsWith('.discord-voice.out.log')) {
        return '{"started":true,"mode":"discord-voice-live"}\n';
      }
      if (path.endsWith('.discord-voice.err.log')) {
        return 'ready\n';
      }
      throw Object.assign(new Error('missing'), { code: 'ENOENT' });
    },
    fetchImpl: async (url) => {
      assert.equal(url, 'http://agent-room.local/api/status?format=json');
      return {
        ok: true,
        status: 200,
        json: async () => ({
          messages: [
            { source: 'discord:voice', text: '[Voice DevCore] status', status: 'working' },
            { source: 'discord:text', text: 'status', status: 'done' }
          ]
        })
      };
    }
  });

  assert.equal(state.config.discordToken, true);
  assert.equal(state.config.voiceGuildId, 'guild-1');
  assert.equal(state.config.voiceChannelId, 'voice-1');
  assert.equal(state.config.whisperReady, true);
  assert.equal(state.config.agentRoomEnabled, true);
  assert.equal(state.logs.out.tail[0], '{"started":true,"mode":"discord-voice-live"}');
  assert.equal(state.logs.err.tail[0], 'ready');
  assert.equal(state.agentRoom.ok, true);
  assert.equal(state.agentRoom.recentVoiceMessages.length, 1);
  assert.equal(JSON.stringify(state).includes('discord-token'), false);
  assert.equal(JSON.stringify(state).includes('sk-test'), false);
});

test('voice preview survives missing logs and unreachable Agent Room', async () => {
  const state = await buildVoicePreviewState({
    cwd: 'D:\\project',
    env: {},
    readTextFile: async () => {
      throw Object.assign(new Error('missing'), { code: 'ENOENT' });
    },
    fetchImpl: async () => {
      throw new Error('connection refused');
    }
  });

  assert.equal(state.config.discordToken, false);
  assert.equal(state.config.whisperReady, false);
  assert.equal(state.logs.out.exists, false);
  assert.equal(state.logs.err.exists, false);
  assert.equal(state.agentRoom.ok, false);
  assert.equal(state.agentRoom.reason, 'agent_room_unreachable');
});

test('preview transcript submission routes browser speech to Agent Room', async () => {
  const sent = [];
  const result = await submitPreviewTranscript({
    transcript: 'status',
    connector: {
      handleTranscript: async (transcript) => ({
        transcript,
        intent: 'status',
        action: {
          type: 'local_status',
          route: { channel: 'agent_room', target: 'claude' }
        },
        agentRoomMessage: {
          source: 'browser:speech',
          intent: 'status',
          body: transcript
        }
      })
    },
    agentRoomClient: {
      send: async (message) => {
        sent.push(message);
        return { sent: true };
      }
    }
  });

  assert.equal(result.ok, true);
  assert.equal(result.routing.intent, 'status');
  assert.equal(result.delivery.sent, true);
  assert.equal(sent[0].source, 'browser:speech');
});

test('preview transcript submission delivers safe unknown manual input to Agent Room', async () => {
  const sent = [];
  const result = await submitPreviewTranscript({
    transcript: '모바일에서 이어서 작업해',
    connector: {
      handleTranscript: async (transcript) => ({
        transcript,
        intent: 'unknown',
        risk: 'safe',
        action: {
          type: 'needs_clarification',
          route: { channel: 'user', target: 'claude' }
        },
        agentRoomMessage: {
          source: 'browser:speech',
          intent: 'unknown',
          risk: 'safe',
          actionType: 'needs_clarification',
          transcript
        }
      })
    },
    agentRoomClient: {
      send: async (message) => {
        sent.push(message);
        return { sent: true };
      }
    }
  });

  assert.equal(result.delivery.sent, true);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].transcript, '모바일에서 이어서 작업해');
});

test('preview transcript submission rejects empty speech', async () => {
  await assert.rejects(
    submitPreviewTranscript({ transcript: '   ' }),
    /transcript is required/
  );
});

test('preview page includes manual mobile fallback controls', () => {
  const preview = createVoicePreviewServer();

  assert.match(preview.renderHtml(), /id="manualTranscript"/);
  assert.match(preview.renderHtml(), /id="sendManualTranscript"/);
});

test('preview page shows a readable multiline mobile manual input', () => {
  const preview = createVoicePreviewServer();
  const html = preview.renderHtml();

  assert.match(html, /<textarea id="manualTranscript"/);
  assert.match(html, /placeholder="모바일에서 음성이 안 되면 여기에 입력"/);
});

test('voice preview server can bind to a requested host for LAN access', async () => {
  const preview = createVoicePreviewServer({
    host: '127.0.0.1',
    port: 0,
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      json: async () => ({ messages: [] })
    })
  });

  const started = await preview.start();
  await preview.stop();

  assert.equal(started.started, true);
  assert.equal(started.host, '127.0.0.1');
  assert.match(started.url, /^http:\/\/127\.0\.0\.1:\d+$/);
});
