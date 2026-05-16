export function createAgentRoomClient({
  enabled,
  baseUrl,
  target,
  fetchImpl = globalThis.fetch
}) {
  return {
    async send(message) {
      const payload = {
        target,
        message
      };

      if (!enabled) {
        return {
          sent: false,
          reason: 'agent_room_disabled',
          target,
          payload
        };
      }

      if (typeof fetchImpl !== 'function') {
        throw new TypeError('fetch implementation is required when Agent Room is enabled');
      }

      const response = await fetchImpl(`${baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const body = await readResponseBody(response);

      if (!response.ok) {
        return {
          sent: false,
          reason: 'agent_room_http_error',
          status: response.status,
          target,
          body
        };
      }

      return {
        sent: true,
        target,
        status: response.status,
        body
      };
    }
  };
}

async function readResponseBody(response) {
  if (typeof response.json !== 'function') {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}
