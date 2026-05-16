import test from 'node:test';
import assert from 'node:assert/strict';

import { createDiscordIngress } from '../src/discord-ingress.js';

test('accepts prefixed Discord text command', () => {
  const ingress = createDiscordIngress({ prefix: '!jh' });

  const result = ingress.parseMessageCreate({
    id: 'm1',
    channel_id: 'c1',
    author: { id: 'u1', bot: false },
    content: '!jh 현재 상태 알려줘'
  });

  assert.equal(result.accepted, true);
  assert.equal(result.transcript, '현재 상태 알려줘');
  assert.equal(result.source, 'discord:text');
});

test('ignores bot messages and unprefixed messages', () => {
  const ingress = createDiscordIngress({ prefix: '!jh' });

  assert.equal(ingress.parseMessageCreate({
    author: { bot: true },
    content: '!jh 현재 상태 알려줘'
  }).accepted, false);

  assert.equal(ingress.parseMessageCreate({
    author: { bot: false },
    content: '현재 상태 알려줘'
  }).accepted, false);
});
