export function loadConfig(env = process.env) {
  return {
    agentRoom: {
      enabled: parseBoolean(env.AGENT_ROOM_ENABLED, false),
      baseUrl: normalizeUrl(env.AGENT_ROOM_BASE_URL ?? 'http://localhost:3100'),
      target: normalizeTarget(env.AGENT_ROOM_TARGET ?? 'claude')
    },
    whisper: {
      provider: String(env.WHISPER_PROVIDER ?? 'text-file').trim().toLowerCase(),
      apiKey: env.OPENAI_API_KEY ?? '',
      model: env.WHISPER_MODEL ?? 'whisper-1'
    },
    discord: {
      prefix: env.DISCORD_COMMAND_PREFIX ?? '!jh',
      token: env.DISCORD_BOT_TOKEN ?? '',
      naturalChannelIds: parseList(env.DISCORD_NATURAL_CHANNEL_IDS),
      voiceGuildId: String(env.DISCORD_VOICE_GUILD_ID ?? '').trim(),
      voiceChannelId: String(env.DISCORD_VOICE_CHANNEL_ID ?? '').trim()
    },
    todayPlus: {
      inbox: normalizePath(env.TODAY_PLUS_INBOX ?? 'D:\\ai프로젝트\\today-plus-obsidian-archiver\\inbox'),
      source: String(env.TODAY_PLUS_SOURCE ?? '').trim()
    }
  };
}

function parseBoolean(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

function normalizeUrl(value) {
  return String(value).trim().replace(/\/+$/, '');
}

function normalizePath(value) {
  return String(value).trim();
}

function parseList(value) {
  if (!value) {
    return [];
  }

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeTarget(value) {
  const target = String(value).trim().toLowerCase();
  return target || 'claude';
}
