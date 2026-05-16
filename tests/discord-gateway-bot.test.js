import test from 'node:test';
import assert from 'node:assert/strict';

import { createDiscordGatewayBot } from '../src/discord-gateway-bot.js';

test('Discord gateway bot identifies after hello and forwards message events', async () => {
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

    close() {
      this.onclose?.();
    }
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
  assert.equal(sent.length, 0);

  socket.onmessage({
    data: JSON.stringify({
      op: 10,
      d: { heartbeat_interval: 1000 }
    })
  });

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
  socket.close();
});

test('Discord gateway heartbeat keeps live process referenced', async () => {
  const originalSetInterval = globalThis.setInterval;
  const originalClearInterval = globalThis.clearInterval;
  let unrefCalled = false;

  globalThis.setInterval = (callback, interval) => {
    assert.equal(typeof callback, 'function');
    assert.equal(interval, 100);
    return {
      unref() {
        unrefCalled = true;
      }
    };
  };
  globalThis.clearInterval = () => {};

  try {
    class FakeWebSocket {
      constructor() {
        this.readyState = 1;
        queueMicrotask(() => this.onopen?.());
      }

      send() {}

      close() {
        this.onclose?.();
      }
    }

    const bot = createDiscordGatewayBot({
      token: 'token',
      WebSocketImpl: FakeWebSocket,
      textBot: {
        handleMessageCreate: async () => ({ handled: true })
      }
    });

    const socket = await bot.connect();
    socket.onmessage({
      data: JSON.stringify({
        op: 10,
        d: { heartbeat_interval: 100 }
      })
    });

    assert.equal(unrefCalled, false);
    socket.close();
  } finally {
    globalThis.setInterval = originalSetInterval;
    globalThis.clearInterval = originalClearInterval;
  }
});

test('Discord gateway can keep the live socket process open before hello', async () => {
  const originalSetInterval = globalThis.setInterval;
  const originalClearInterval = globalThis.clearInterval;
  const timers = [];
  const cleared = [];

  globalThis.setInterval = (callback, interval) => {
    const timer = { callback, interval };
    timers.push(timer);
    return timer;
  };
  globalThis.clearInterval = (timer) => {
    cleared.push(timer);
  };

  try {
    class FakeWebSocket {
      constructor() {
        this.readyState = 1;
        queueMicrotask(() => this.onopen?.());
      }

      send() {}

      close() {
        this.onclose?.();
      }
    }

    const bot = createDiscordGatewayBot({
      token: 'token',
      WebSocketImpl: FakeWebSocket,
      keepAlive: true,
      textBot: {
        handleMessageCreate: async () => ({ handled: true })
      }
    });

    const socket = await bot.connect();

    assert.equal(timers.length, 1);
    assert.equal(timers[0].interval, 2147483647);

    socket.close();
    assert.equal(cleared[0], timers[0]);
  } finally {
    globalThis.setInterval = originalSetInterval;
    globalThis.clearInterval = originalClearInterval;
  }
});
