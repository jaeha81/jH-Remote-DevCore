# Voice Channel Roadmap

Current status: text command path is implemented. Voice channel capture is intentionally gated until Discord voice runtime dependencies are installed and tested.

## Remaining Voice Work

1. Install voice runtime dependencies:
   - `@discordjs/voice`
   - `prism-media`
   - Opus runtime such as `@discordjs/opus` or `opusscript`
2. Join configured Discord voice channel.
3. Receive user audio stream.
4. Segment audio into files or buffers.
5. Send segment to Whisper provider.
6. Route transcript through Local Connector Agent.
7. Reply in Discord text channel with safe / approval / blocked result.

## Safety Rules

- Never execute transcript directly.
- Always classify transcript first.
- Send risky commands to approval flow.
- Block destructive commands.
- Keep audio files out of git.
