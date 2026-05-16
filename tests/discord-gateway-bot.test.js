import test from 'node:test';
import assert from 'node:assert/strict';

import { createDiscordGatewayBot } from '../src/discord-gateway-bot.js';

test('Discord gateway bot identifies and forwards message events', async () => {
  const sent = [];
  const handled = [];
  class FakeWebSocket {
    constructor(url) {
      this.url = url;
      this.readyState = 1;
      queueMicrotask(() => this.onopen?.());
    }

    send(payload) {
      sent.push(JSON.parse(payload));
    }

    close() {}
  }

  const bot = createDiscordGatewayBot({
    token: 'token',
    WebSocketImpl: FakeWebSocket,
    textBot: {
      handleMessageCreate: async (event) => {
        handled.push(event);
        return { handled: true };
      }
    }
  });

  const socket = await bot.connect();
  socket.onmessage({
    data: JSON.stringify({
      op: 0,
      t: 'MESSAGE_CREATE',
      s: 1,
      d: { content: '!jh 현재 상태 알려줘' }
    })
  });

  assert.equal(sent[0].op, 2);
  assert.equal(handled[0].content, '!jh 현재 상태 알려줘');
});
