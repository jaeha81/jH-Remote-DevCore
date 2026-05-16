import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { writeTodayPlusDrop } from '../src/today-plus-drop.js';

test('writes today plus markdown file to inbox', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'today-plus-'));

  try {
    const result = await writeTodayPlusDrop({
      inbox: dir,
      transcript: 'today plus\n\nOriginal content',
      source: 'discord',
      sender: 'user',
      now: new Date('2026-05-16T12:30:45+09:00')
    });

    assert.equal(result.written, true);
    assert.match(result.fileName, /^today-plus-20260516-123045\.md$/);

    const content = await readFile(result.path, 'utf8');
    assert.match(content, /^# Today Plus/);
    assert.match(content, /source: discord/);
    assert.match(content, /sender: user/);
    assert.match(content, /Original content/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
