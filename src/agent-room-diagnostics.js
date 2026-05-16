export function createAgentRoomDiagnostics({
  baseUrl,
  fetchImpl = globalThis.fetch
}) {
  return {
    async status() {
      try {
        const response = await fetchImpl(`${baseUrl}/api/status`, {
          method: 'GET'
        });
        const body = await readJson(response);

        if (!body || typeof body !== 'object') {
          return {
            ok: false,
            status: response.status,
            reason: 'agent_room_unexpected_response',
            body
          };
        }

        return {
          ok: response.ok,
          status: response.status,
          body
        };
      } catch (error) {
        return {
          ok: false,
          reason: 'agent_room_unreachable',
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }
  };
}

async function readJson(response) {
  if (typeof response.json !== 'function') return null;

  try {
    return await response.json();
  } catch {
    return null;
  }
}
