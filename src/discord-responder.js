export function createDiscordResponder({
  token,
  apiBaseUrl = 'https://discord.com/api/v10',
  fetchImpl = globalThis.fetch
}) {
  if (!token) {
    return createDryRunResponder();
  }

  if (typeof fetchImpl !== 'function') {
    throw new TypeError('fetch implementation is required for Discord responder');
  }

  return {
    async sendMessage(channelId, content) {
      const response = await fetchImpl(`${apiBaseUrl}/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          authorization: `Bot ${token}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify({ content })
      });

      const body = await readJson(response);

      if (!response.ok) {
        return {
          sent: false,
          status: response.status,
          body
        };
      }

      return {
        sent: true,
        status: response.status,
        body
      };
    }
  };
}

function createDryRunResponder() {
  return {
    async sendMessage(channelId, content) {
      return {
        sent: false,
        reason: 'discord_token_missing',
        channelId,
        content
      };
    }
  };
}

async function readJson(response) {
  if (typeof response.json !== 'function') {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}
