import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

import { createTranscriberFromConfig } from '../src/whisper-provider.js';

test('creates text-file transcriber from config', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'jh-whisper-provider-'));
  const filePath = join(dir, 'voice.txt');
  await writeFile(filePath, '검증해\n', 'utf8');

  try {
    const transcriber = createTranscriberFromConfig({
      provider: 'text-file',
      filePath
    });

    assert.equal(await transcriber.transcribe(), '검증해');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('OpenAI transcriber posts audio file and returns text', async () => {
  const calls = [];
  const dir = await mkdtemp(join(tmpdir(), 'jh-openai-whisper-'));
  const filePath = join(dir, 'voice.webm');
  await writeFile(filePath, 'audio-bytes', 'utf8');

  try {
    const transcriber = createTranscriberFromConfig({
      provider: 'openai',
      apiKey: 'test-key',
      filePath,
      fetchImpl: async (url, options) => {
        calls.push({ url, options });
        return {
          ok: true,
          status: 200,
          async json() {
            return { text: '현재 상태 알려줘' };
          }
        };
      }
    });

    const transcript = await transcriber.transcribe();

    assert.equal(transcript, '현재 상태 알려줘');
    assert.equal(calls[0].url, 'https://api.openai.com/v1/audio/transcriptions');
    assert.equal(calls[0].options.headers.authorization, 'Bearer test-key');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
