export function createDiscordIngress({ prefix = '!jh', naturalChannelIds = [] } = {}) {
  const normalizedPrefix = String(prefix).trim();
  const naturalChannels = new Set(naturalChannelIds.map((id) => String(id).trim()).filter(Boolean));

  return {
    parseMessageCreate(event) {
      if (event?.author?.bot) {
        return ignored('bot_message');
      }

      const content = String(event?.content ?? '').trim();
      const commandPrefix = `${normalizedPrefix} `;

      if (!content.startsWith(commandPrefix)) {
        if (!naturalChannels.has(String(event?.channel_id ?? ''))) {
          return ignored('prefix_not_matched');
        }

        return acceptedNatural(event, content);
      }

      const transcript = content.slice(commandPrefix.length).trim();

      if (!transcript) {
        return ignored('empty_command');
      }

      return acceptedPrefixed(event, transcript);
    }
  };
}

function acceptedPrefixed(event, transcript) {
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

function acceptedNatural(event, transcript) {
  if (!transcript) {
    return ignored('empty_command');
  }

  return {
    accepted: true,
    source: 'discord:natural',
    transcript,
    discord: {
      messageId: event.id ?? null,
      channelId: event.channel_id ?? null,
      authorId: event.author?.id ?? null
    }
  };
}

function ignored(reason) {
  return {
    accepted: false,
    reason
  };
}
