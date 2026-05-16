import test from 'node:test';
import assert from 'node:assert/strict';

import { createDiscordVoiceController } from '../src/discord-voice-controller.js';

test('voice controller reports dependency gate before live voice capture', async () => {
  const controller = createDiscordVoiceController();

  const result = await controller.startCapture();

  assert.equal(result.started, false);
  assert.equal(result.reason, 'voice_runtime_not_configured');
  assert.match(result.nextStep, /@discordjs\/voice/);
});

test('voice controller requires configured guild and voice channel', async () => {
  const controller = createDiscordVoiceController({
    runtime: { configured: true, start: async () => ({}) },
    config: { discord: { token: 'token' } }
  });

  const result = await controller.startCapture();

  assert.equal(result.started, false);
  assert.equal(result.reason, 'voice_channel_not_configured');
});

test('voice controller transcribes speech and sends safe routing to Agent Room', async () => {
  const sent = [];
  const logs = [];
  let capturedOnAudio;
  const controller = createDiscordVoiceController({
    runtime: {
      configured: true,
      start: async ({ onAudio }) => {
        capturedOnAudio = onAudio;
        return { guildId: 'guild-1', channelId: 'voice-1' };
      }
    },
    config: {
      discord: {
        token: 'token',
        voiceGuildId: 'guild-1',
        voiceChannelId: 'voice-1'
      }
    },
    transcribeAudio: async (input) => {
      assert.equal(input.userId, 'user-1');
      assert.equal(input.audioPath, 'voice.wav');
      return 'status';
    },
    agentRoomClient: {
      send: async (message) => {
        sent.push(message);
        return { sent: true };
      }
    },
    logger: {
      log: (entry) => logs.push(entry)
    }
  });

  const started = await controller.startCapture();
  assert.equal(started.started, true);
  assert.equal(started.mode, 'discord-voice-live');

  const handled = await capturedOnAudio({ userId: 'user-1', audioPath: 'voice.wav' });

  assert.equal(handled.transcript, 'status');
  assert.equal(handled.delivery.sent, true);
  assert.equal(sent[0].source, 'discord:voice');
  assert.equal(sent[0].intent, 'status');
  assert.equal(logs[0].event, 'voice_transcribed');
  assert.equal(logs[0].transcriptLength, 6);
  assert.equal(logs[1].event, 'voice_agent_room_delivery');
  assert.equal(logs[1].sent, true);
});
