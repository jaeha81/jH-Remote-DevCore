import test from 'node:test';
import assert from 'node:assert/strict';

import { createAgentRoomDiagnostics } from '../src/agent-room-diagnostics.js';

test('diagnostics checks status endpoint', async () => {
  const calls = [];
  const diagnostics = createAgentRoomDiagnostics({
    baseUrl: 'http://agent-room.local',
    fetchImpl: async (url) => {
      calls.push(url);
      return {
        ok: true,
        status: 200,
        async json() {
          return { ok: true };
        }
      };
    }
  });

  const result = await diagnostics.status();

  assert.equal(result.ok, true);
  assert.equal(calls[0], 'http://agent-room.local/api/status');
});

test('diagnostics reports unreachable Agent Room', async () => {
  const diagnostics = createAgentRoomDiagnostics({
    baseUrl: 'http://agent-room.local',
    fetchImpl: async () => {
      throw new Error('connect ECONNREFUSED');
    }
  });

  const result = await diagnostics.status();

  assert.equal(result.ok, false);
  assert.equal(result.reason, 'agent_room_unreachable');
});

test('diagnostics rejects non-json status response', async () => {
  const diagnostics = createAgentRoomDiagnostics({
    baseUrl: 'http://agent-room.local',
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      headers: new Map([['content-type', 'text/html']]),
      async json() {
        throw new Error('not json');
      }
    })
  });

  const result = await diagnostics.status();

  assert.equal(result.ok, false);
  assert.equal(result.reason, 'agent_room_unexpected_response');
});
