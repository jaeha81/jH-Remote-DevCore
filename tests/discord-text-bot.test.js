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
