import test from 'node:test';
import assert from 'node:assert/strict';

import { loadConfig } from '../src/config.js';

test('loads defaults for local dry-run operation', () => {
  const config = loadConfig({});

  assert.equal(config.agentRoom.enabled, false);
  assert.equal(config.agentRoom.baseUrl, 'http://127.0.0.1:3100');
  assert.equal(config.agentRoom.target, 'claude');
});

test('enables Agent Room when env flag is true', () => {
  const config = loadConfig({
    AGENT_ROOM_ENABLED: 'true',
    AGENT_ROOM_BASE_URL: 'http://127.0.0.1:4000',
    AGENT_ROOM_TARGET: 'codex'
  });

  assert.equal(config.agentRoom.enabled, true);
  assert.equal(config.agentRoom.baseUrl, 'http://127.0.0.1:4000');
  assert.equal(config.agentRoom.target, 'codex');
});
