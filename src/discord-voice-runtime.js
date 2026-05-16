import { once } from 'node:events';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { buildPcm16Wav } from './wav-file.js';

export async function createDiscordVoiceRuntime({ logger = console } = {}) {
  const [{ Client, GatewayIntentBits }, voice, prism] = await Promise.all([
    import('discord.js'),
    import('@discordjs/voice'),
    import('prism-media')
  ]);

  return {
    configured: true,
    async start({ token, guildId, channelId, onAudio }) {
      if (!token) {
        throw new Error('DISCORD_BOT_TOKEN is required');
      }

      const client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildVoiceStates
        ]
      });

      await client.login(token);
      if (!client.isReady()) {
        await once(client, 'ready');
      }

      const channel = await client.channels.fetch(channelId);
      if (!channel || channel.guildId !== guildId) {
        throw new Error('configured Discord voice channel was not found in guild');
      }

      const connection = voice.joinVoiceChannel({
        channelId,
        guildId,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: true
      });

      await voice.entersState(connection, voice.VoiceConnectionStatus.Ready, 30_000);
      logEvent(logger, {
        event: 'voice_session_ready',
        guildId,
        channelId
      });

      connection.receiver.speaking.on('start', (userId) => {
        logEvent(logger, {
          event: 'voice_speaking_start',
          userId
        });
        const opusStream = connection.receiver.subscribe(userId, {
          end: {
            behavior: voice.EndBehaviorType.AfterSilence,
            duration: 1200
          }
        });
        void handleSpeech({ userId, opusStream, prism, onAudio, logger }).catch((error) => {
          logEvent(logger, {
            event: 'voice_audio_error',
            userId,
            error: error instanceof Error ? error.message : String(error)
          });
        });
      });

      return {
        guildId,
        channelId,
        stop() {
          connection.destroy();
          client.destroy();
        }
      };
    }
  };
}

export async function handleSpeech({ userId, opusStream, prism, onAudio, logger }) {
  const decoder = new prism.opus.Decoder({
    rate: 48000,
    channels: 2,
    frameSize: 960
  });
  const decoded = opusStream.pipe(decoder);
  const chunks = [];
  let streamError;

  opusStream.on('error', (error) => {
    streamError = error;
    decoder.destroy(error);
  });

  decoder.on('error', (error) => {
    streamError = error;
  });

  try {
    for await (const chunk of decoded) {
      chunks.push(chunk);
    }
  } catch (error) {
    throw streamError ?? error;
  }

  if (chunks.length === 0) {
    logEvent(logger, {
      event: 'voice_audio_empty',
      userId
    });
    return;
  }

  const dir = await mkdtemp(join(tmpdir(), 'jh-discord-voice-'));
  const audioPath = join(dir, `${randomUUID()}.wav`);

  try {
    const wav = buildPcm16Wav({ pcm: Buffer.concat(chunks) });
    await writeFile(audioPath, wav);
    logEvent(logger, {
      event: 'voice_audio_captured',
      userId,
      chunkCount: chunks.length,
      bytes: wav.length
    });
    await onAudio({ userId, audioPath });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function logEvent(logger, event) {
  if (typeof logger?.log !== 'function') return;
  logger.log(JSON.stringify({
    ...event,
    at: new Date().toISOString()
  }));
}
