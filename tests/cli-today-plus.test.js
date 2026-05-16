import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

test('cli writes today plus content to configured inbox', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'today-plus-cli-'));

  try {
    const { stdout } = await execFileAsync('node', [
      'src/cli.js',
      '--text',
      'today plus\n\nOriginal content'
    ], {
      env: {
        ...process.env,
        TODAY_PLUS_INBOX: dir,
        TODAY_PLUS_SOURCE: 'cli'
      }
    });

    const result = JSON.parse(stdout);
    assert.equal(result.delivery.written, true);

    const files = await readdir(dir);
    assert.equal(files.length, 1);

    const content = await readFile(join(dir, files[0]), 'utf8');
    assert.match(content, /source: cli/);
    assert.match(content, /Original content/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
