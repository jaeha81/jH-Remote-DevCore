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

test('accepts unprefixed natural text only in allowed channels', () => {
  const ingress = createDiscordIngress({
    prefix: '!jh',
    naturalChannelIds: ['natural-channel']
  });

  const accepted = ingress.parseMessageCreate({
    id: 'm2',
    channel_id: 'natural-channel',
    author: { id: 'u1', bot: false },
    content: 'status'
  });

  assert.equal(accepted.accepted, true);
  assert.equal(accepted.transcript, 'status');
  assert.equal(accepted.source, 'discord:natural');

  assert.equal(ingress.parseMessageCreate({
    channel_id: 'other-channel',
    author: { id: 'u1', bot: false },
    content: 'status'
  }).accepted, false);
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
