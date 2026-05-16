import { createAgentRoomClient } from './agent-room-client.js';
import { createLocalConnectorAgent } from './local-connector-agent.js';
import { loadConfig } from './config.js';
import { createDiscordResponder } from './discord-responder.js';

export function createDiscordVoiceController({
  runtime,
  runtimeConfigured = false,
  config = loadConfig(),
  connector = createLocalConnectorAgent(),
  agentRoomClient = createAgentRoomClient(config.agentRoom ?? {}),
  responder = createDiscordResponder(config.discord ?? {}),
  transcribeAudio,
  logger = console
} = {}) {
  const voiceRuntime = runtime ?? {
    configured: runtimeConfigured,
    start: async () => ({})
  };

  return {
    async startCapture() {
      if (!voiceRuntime.configured) {
        return {
          started: false,
          reason: 'voice_runtime_not_configured',
          nextStep: 'Install and wire discord.js, @discordjs/voice, prism-media, and an Opus runtime before live voice capture.'
        };
      }

      const voiceConfig = normalizeVoiceConfig(config);
      if (!voiceConfig.guildId || !voiceConfig.channelId) {
        return {
          started: false,
          reason: 'voice_channel_not_configured',
          nextStep: 'Set DISCORD_VOICE_GUILD_ID and DISCORD_VOICE_CHANNEL_ID before starting live voice capture.'
        };
      }

      if (typeof transcribeAudio !== 'function') {
        return {
          started: false,
          reason: 'voice_transcriber_not_configured',
          nextStep: 'Configure WHISPER_PROVIDER=openai and OPENAI_API_KEY for live voice transcription.'
        };
      }

      const session = await voiceRuntime.start({
        token: config.discord?.token,
        guildId: voiceConfig.guildId,
        channelId: voiceConfig.channelId,
        onAudio: async (input) => handleAudio(input)
      });

      return {
        started: true,
        mode: 'discord-voice-live',
        guildId: voiceConfig.guildId,
        channelId: voiceConfig.channelId,
        session
      };
    }
  };

  async function handleAudio(input) {
    let transcript;
    try {
      transcript = await transcribeAudio(input);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logEvent(logger, {
        event: 'voice_transcription_failed',
        userId: input.userId,
        error: message
      });
      await maybeSendFailureFeedback(responder, config, message);
      throw error;
    }

    logEvent(logger, {
      event: 'voice_transcribed',
      userId: input.userId,
      transcriptLength: transcript.length
    });
    const routing = await connector.handleTranscript(transcript);
    const message = {
      ...routing.agentRoomMessage,
      source: 'discord:voice'
    };
    const delivery = await maybeDeliver(agentRoomClient, routing, message);
    logEvent(logger, {
      event: 'voice_agent_room_delivery',
      userId: input.userId,
      intent: routing.agentRoomMessage.intent,
      sent: Boolean(delivery.sent),
      reason: delivery.reason
    });

    return {
      ...routing,
      delivery
    };
  }
}

async function maybeSendFailureFeedback(responder, config, errorMessage) {
  const channelId = String(config.discord?.voiceFeedbackChannelId ?? '').trim();
  if (!channelId) {
    return {
      sent: false,
      reason: 'voice_feedback_channel_not_configured'
    };
  }

  const shortError = errorMessage.length > 240 ? `${errorMessage.slice(0, 237)}...` : errorMessage;
  return responder.sendMessage(channelId, `[voice transcription failed] ${shortError}`);
}

async function maybeDeliver(agentRoomClient, routing, message) {
  if (routing.action.route.channel !== 'agent_room') {
    return {
      sent: false,
      reason: 'route_not_agent_room',
      target: routing.action.route.target
    };
  }

  return agentRoomClient.send(message);
}

function normalizeVoiceConfig(config) {
  return {
    guildId: String(config.discord?.voiceGuildId ?? '').trim(),
    channelId: String(config.discord?.voiceChannelId ?? '').trim()
  };
}

function logEvent(logger, event) {
  if (typeof logger?.log !== 'function') return;
  logger.log(event);
}
