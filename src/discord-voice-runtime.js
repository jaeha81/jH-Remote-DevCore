import { once } from 'node:events';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { buildPcm16Wav } from './wav-file.js';

export async function createDiscordVoiceRuntime() {
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

      connection.receiver.speaking.on('start', (userId) => {
        const opusStream = connection.receiver.subscribe(userId, {
          end: {
            behavior: voice.EndBehaviorType.AfterSilence,
            duration: 1200
          }
        });
        void handleSpeech({ userId, opusStream, prism, onAudio }).catch((error) => {
          console.error(error instanceof Error ? error.message : String(error));
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

async function handleSpeech({ userId, opusStream, prism, onAudio }) {
  const decoder = new prism.opus.Decoder({
    rate: 48000,
    channels: 2,
    frameSize: 960
  });
  const decoded = opusStream.pipe(decoder);
  const chunks = [];

  for await (const chunk of decoded) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return;
  }

  const dir = await mkdtemp(join(tmpdir(), 'jh-discord-voice-'));
  const audioPath = join(dir, `${randomUUID()}.wav`);

  try {
    const wav = buildPcm16Wav({ pcm: Buffer.concat(chunks) });
    await writeFile(audioPath, wav);
    await onAudio({ userId, audioPath });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
