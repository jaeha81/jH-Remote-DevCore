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
