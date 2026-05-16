import test from 'node:test';
import assert from 'node:assert/strict';

import { createAgentRoomClient } from '../src/agent-room-client.js';

test('disabled Agent Room client returns dry-run result', async () => {
  const client = createAgentRoomClient({
    enabled: false,
    baseUrl: 'http://127.0.0.1:3100',
    target: 'claude'
  });

  const result = await client.send({
    intent: 'status',
    risk: 'safe',
    transcript: '현재 상태 알려줘'
  });

  assert.equal(result.sent, false);
  assert.equal(result.reason, 'agent_room_disabled');
  assert.equal(result.target, 'claude');
});

test('enabled Agent Room client posts JSON payload', async () => {
  const calls = [];
  const client = createAgentRoomClient({
    enabled: true,
    baseUrl: 'http://agent-room.local',
    target: 'claude',
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        status: 200,
        async json() {
          return { ok: true };
        }
      };
    }
  });

  const result = await client.send({
    intent: 'status',
    risk: 'safe',
    transcript: '현재 상태 알려줘'
  });

  assert.equal(result.sent, true);
  assert.equal(calls[0].url, 'http://agent-room.local/api/messages');
  const body = JSON.parse(calls[0].options.body);
  assert.equal(body.speaker, 'user');
  assert.equal(body.kind, 'direction');
  assert.equal(body.target, 'claude');
  assert.equal(body.taskType, 'implementation');
  assert.match(body.body, /현재 상태 알려줘/);
});
