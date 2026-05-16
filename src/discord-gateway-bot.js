export function createDiscordGatewayBot({
  token,
  textBot,
  WebSocketImpl = globalThis.WebSocket,
  gatewayUrl = 'wss://gateway.discord.gg/?v=10&encoding=json',
  intents = 1 << 9,
  keepAlive = false
}) {
  if (!token) {
    throw new Error('DISCORD_BOT_TOKEN is required');
  }

  if (typeof WebSocketImpl !== 'function') {
    throw new TypeError('WebSocket implementation is required');
  }

  return {
    async connect() {
      const socket = new WebSocketImpl(gatewayUrl);
      const keepAliveTimer = keepAlive ? setInterval(() => {}, 2147483647) : null;
      let heartbeatTimer = null;

      const cleanup = () => {
        if (keepAliveTimer) {
          clearInterval(keepAliveTimer);
        }
        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
        }
      };
      socket.onclose = cleanup;
      socket.onerror = cleanup;

      const identify = () => {
        socket.send(JSON.stringify({
          op: 2,
          d: {
            token,
            intents,
            properties: {
              os: process.platform,
              browser: 'jh-remote-devcore',
              device: 'jh-remote-devcore'
            }
          }
        }));
      };

      socket.onmessage = async (event) => {
        const packet = JSON.parse(event.data);

        if (packet.op === 10) {
          heartbeatTimer = startHeartbeat(socket, packet.d?.heartbeat_interval);
          identify();
          return;
        }

        if (packet.t === 'MESSAGE_CREATE') {
          await textBot.handleMessageCreate(packet.d);
        }
      };

      return socket;
    }
  };
}

function startHeartbeat(socket, interval) {
  if (!interval || interval <= 0) {
    return;
  }

  const timer = setInterval(() => {
    if (socket.readyState === 1) {
      socket.send(JSON.stringify({ op: 1, d: null }));
    } else {
      clearInterval(timer);
    }
  }, interval);

  return timer;
}
