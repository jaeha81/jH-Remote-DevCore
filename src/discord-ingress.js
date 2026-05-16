export function createDiscordIngress({ prefix = '!jh' } = {}) {
  const normalizedPrefix = String(prefix).trim();

  return {
    parseMessageCreate(event) {
      if (event?.author?.bot) {
        return ignored('bot_message');
      }

      const content = String(event?.content ?? '').trim();
      const commandPrefix = `${normalizedPrefix} `;

      if (!content.startsWith(commandPrefix)) {
        return ignored('prefix_not_matched');
      }

      const transcript = content.slice(commandPrefix.length).trim();

      if (!transcript) {
        return ignored('empty_command');
      }

      return {
        accepted: true,
        source: 'discord:text',
        transcript,
        discord: {
          messageId: event.id ?? null,
          channelId: event.channel_id ?? null,
          authorId: event.author?.id ?? null
        }
      };
    }
  };
}

function ignored(reason) {
  return {
    accepted: false,
    reason
  };
}
