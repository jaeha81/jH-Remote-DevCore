import test from 'node:test';
import assert from 'node:assert/strict';

import { createDiscordTextBot } from '../src/discord-text-bot.js';

test('Discord text bot routes safe command and replies with dry-run delivery', async () => {
  const replies = [];
  const bot = createDiscordTextBot({
    responder: {
      sendMessage: async (channelId, content) => {
        replies.push({ channelId, content });
        return { sent: true };
      }
    },
    agentRoomClient: {
      send: async () => ({ sent: false, reason: 'agent_room_disabled' })
    }
  });

  const result = await bot.handleMessageCreate({
    id: 'm1',
    channel_id: 'c1',
    author: { id: 'u1', bot: false },
    content: '!jh 현재 상태 알려줘'
  });

  assert.equal(result.handled, true);
  assert.equal(result.routing.risk, 'safe');
  assert.equal(replies[0].channelId, 'c1');
  assert.match(replies[0].content, /safe/);
});

test('Discord text bot routes natural text in allowed channel', async () => {
  const replies = [];
  const bot = createDiscordTextBot({
    config: {
      discord: { prefix: '!jh', token: 'discord-token', naturalChannelIds: ['c1'] },
      agentRoom: { enabled: false, baseUrl: 'http://agent-room.local', target: 'claude' },
      todayPlus: { inbox: 'C:\\TodayPlus', source: '' }
    },
    responder: {
      sendMessage: async (channelId, content) => {
        replies.push({ channelId, content });
        return { sent: true };
      }
    },
    agentRoomClient: {
      send: async () => ({ sent: false, reason: 'agent_room_disabled' })
    }
  });

  const result = await bot.handleMessageCreate({
    id: 'm1',
    channel_id: 'c1',
    author: { id: 'u1', bot: false },
    content: 'status'
  });

  assert.equal(result.handled, true);
  assert.equal(result.routing.intent, 'status');
  assert.match(replies[0].content, /safe/);
});

test('Discord text bot ignores natural text outside allowed channels', async () => {
  const bot = createDiscordTextBot({
    config: {
      discord: { prefix: '!jh', token: 'discord-token', naturalChannelIds: ['c1'] },
      agentRoom: { enabled: false, baseUrl: 'http://agent-room.local', target: 'claude' },
      todayPlus: { inbox: 'C:\\TodayPlus', source: '' }
    }
  });

  const result = await bot.handleMessageCreate({
    id: 'm1',
    channel_id: 'c2',
    author: { id: 'u1', bot: false },
    content: 'status'
  });

  assert.equal(result.handled, false);
  assert.equal(result.reason, 'prefix_not_matched');
});

test('Discord text bot writes today plus content through injected drop writer', async () => {
  const writes = [];
  const bot = createDiscordTextBot({
    config: {
      discord: { prefix: '!jh', token: 'discord-token' },
      agentRoom: { enabled: false, baseUrl: 'http://agent-room.local', target: 'claude' },
      todayPlus: { inbox: 'C:\\TodayPlus', source: '' }
    },
    responder: {
      sendMessage: async () => ({ sent: true })
    },
    todayPlusDrop: async (input) => {
      writes.push(input);
      return { written: true, path: 'C:\\TodayPlus\\today-plus-20260516-123000.md' };
    }
  });

  const result = await bot.handleMessageCreate({
    author: { bot: false, username: 'mobile-user' },
    channel_id: 'channel-1',
    content: '!jh today plus\n\nOriginal content'
  });

  assert.equal(result.handled, true);
  assert.equal(result.delivery.written, true);
  assert.equal(writes[0].source, 'discord');
  assert.equal(writes[0].sender, 'mobile-user');
});

test('Discord text bot creates approval request for risky command', async () => {
  const replies = [];
  const bot = createDiscordTextBot({
    approvalIdFactory: () => 'approval-1',
    responder: {
      sendMessage: async (channelId, content) => {
        replies.push({ channelId, content });
        return { sent: true };
      }
    }
  });

  const result = await bot.handleMessageCreate({
    id: 'm1',
    channel_id: 'c1',
    author: { id: 'u1', bot: false },
    content: '!jh git push 해줘'
  });

  assert.equal(result.handled, true);
  assert.equal(result.routing.risk, 'approval_required');
  assert.equal(result.approval.id, 'approval-1');
  assert.match(replies[0].content, /승인 필요/);
});
