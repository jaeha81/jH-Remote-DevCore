import test from 'node:test';
import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';

import { handleSpeech } from '../src/discord-voice-runtime.js';

test('voice speech handler rejects stream decrypt errors without an unhandled crash', async () => {
  const opusStream = new PassThrough();
  const decoder = new PassThrough();
  const prism = {
    opus: {
      Decoder: class extends PassThrough {
        constructor() {
          super();
          return decoder;
        }
      }
    }
  };

  const handled = handleSpeech({
    userId: 'user-1',
    opusStream,
    prism,
    onAudio: async () => {
      throw new Error('onAudio should not run');
    }
  });

  queueMicrotask(() => {
    opusStream.emit('error', new Error('decrypt failed'));
  });

  await assert.rejects(handled, /decrypt failed/);
});
