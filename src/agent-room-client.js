export function createAgentRoomClient({
  enabled,
  baseUrl,
  target,
  fetchImpl = globalThis.fetch
}) {
  return {
    async send(message) {
      const payload = buildAgentRoomPayload(target, message);

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

      const response = await fetchImpl(`${baseUrl}/api/messages`, {
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

function buildAgentRoomPayload(target, message) {
  return {
    speaker: 'user',
    kind: message.risk === 'safe' ? 'request' : 'review',
    target,
    taskType: taskTypeFor(message),
    body: formatBody(message),
    source: message.source ?? 'voice-local-connector'
  };
}

function taskTypeFor(message) {
  if (targetForReview(message)) return 'review';
  if (message.intent === 'claude_analysis_request') return 'analysis';
  if (message.intent === 'review_request') return 'review';
  return 'implementation';
}

function targetForReview(message) {
  return message.actionType === 'codex_review' || message.intent === 'review_request';
}

function formatBody(message) {
  return [
    '[Voice DevCore]',
    `intent=${message.intent}`,
    `risk=${message.risk}`,
    `action=${message.actionType}`,
    '',
    message.transcript
  ].join('\n');
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
