import test from 'node:test';
import assert from 'node:assert/strict';

import { buildPcm16Wav } from '../src/wav-file.js';

test('builds wav header around pcm16 audio', () => {
  const wav = buildPcm16Wav({
    pcm: Buffer.from([1, 0, 2, 0]),
    sampleRate: 48000,
    channels: 2
  });

  assert.equal(wav.subarray(0, 4).toString('ascii'), 'RIFF');
  assert.equal(wav.subarray(8, 12).toString('ascii'), 'WAVE');
  assert.equal(wav.subarray(36, 40).toString('ascii'), 'data');
  assert.equal(wav.readUInt32LE(40), 4);
  assert.deepEqual([...wav.subarray(44)], [1, 0, 2, 0]);
});
