import test from 'node:test';
import assert from 'node:assert/strict';

import { loadConfig } from '../src/config.js';

test('loads defaults for local dry-run operation', () => {
  const config = loadConfig({});

  assert.equal(config.agentRoom.enabled, false);
  assert.equal(config.agentRoom.baseUrl, 'http://localhost:3100');
  assert.equal(config.agentRoom.target, 'claude');
  assert.equal(config.whisper.provider, 'text-file');
  assert.equal(config.discord.prefix, '!jh');
  assert.deepEqual(config.discord.naturalChannelIds, []);
  assert.equal(config.todayPlus.inbox, 'D:\\ai프로젝트\\today-plus-obsidian-archiver\\inbox');
  assert.equal(config.todayPlus.source, '');
});

test('loads natural Discord channel allowlist from env', () => {
  const config = loadConfig({
    DISCORD_NATURAL_CHANNEL_IDS: 'channel-1, channel-2,,channel-3'
  });

  assert.deepEqual(config.discord.naturalChannelIds, ['channel-1', 'channel-2', 'channel-3']);
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

test('loads Today Plus file drop settings from env', () => {
  const config = loadConfig({
    TODAY_PLUS_INBOX: 'C:\\Users\\user1\\TodayPlus_Input',
    TODAY_PLUS_SOURCE: 'discord'
  });

  assert.equal(config.todayPlus.inbox, 'C:\\Users\\user1\\TodayPlus_Input');
  assert.equal(config.todayPlus.source, 'discord');
});
