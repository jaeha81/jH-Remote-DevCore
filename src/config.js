export function loadConfig(env = process.env) {
  return {
    agentRoom: {
      enabled: parseBoolean(env.AGENT_ROOM_ENABLED, false),
      baseUrl: normalizeUrl(env.AGENT_ROOM_BASE_URL ?? 'http://127.0.0.1:3100'),
      target: normalizeTarget(env.AGENT_ROOM_TARGET ?? 'claude')
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

function normalizeTarget(value) {
  const target = String(value).trim().toLowerCase();
  return target || 'claude';
}
