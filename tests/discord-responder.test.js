import test from 'node:test';
import assert from 'node:assert/strict';

import { createDiscordResponder } from '../src/discord-responder.js';

test('Discord responder posts channel message through REST API', async () => {
  const calls = [];
  const responder = createDiscordResponder({
    token: 'discord-token',
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        status: 200,
        async json() {
          return { id: 'reply-1' };
        }
      };
    }
  });

  const result = await responder.sendMessage('channel-1', '처리 완료');

  assert.equal(result.sent, true);
  assert.equal(calls[0].url, 'https://discord.com/api/v10/channels/channel-1/messages');
  assert.equal(calls[0].options.headers.authorization, 'Bot discord-token');
  assert.equal(JSON.parse(calls[0].options.body).content, '처리 완료');
});
