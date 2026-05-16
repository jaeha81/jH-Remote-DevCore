import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

import { createMockTranscriber, createWhisperAgent, transcribeTextFile } from '../src/whisper-agent.js';

test('mock transcriber returns trimmed transcript text', async () => {
  const transcriber = createMockTranscriber('  현재 상태 알려줘  ');

  const transcript = await transcriber.transcribe();

  assert.equal(transcript, '현재 상태 알려줘');
});

test('whisper agent delegates transcription to provider', async () => {
  const agent = createWhisperAgent({
    transcriber: createMockTranscriber('검증해')
  });

  const result = await agent.transcribe({ source: 'mock' });

  assert.deepEqual(result, {
    source: 'mock',
    transcript: '검증해'
  });
});

test('text file transcriber reads UTF-8 transcript file', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'jh-voice-'));
  const filePath = join(dir, 'voice.txt');
  await writeFile(filePath, '작업 시작\n', 'utf8');

  try {
    const transcript = await transcribeTextFile(filePath);

    assert.equal(transcript, '작업 시작');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
