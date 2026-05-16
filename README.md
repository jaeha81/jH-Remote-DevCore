# JH Remote DevCore

Local MVP for voice-driven development command routing.

## Scope

- Keeps existing JH local system roles.
- Adds Whisper Agent interface for transcript input.
- Adds Local Connector Agent Bot for command classification and safety routing.
- Adds Local Adapter Layer that returns action plans without destructive execution.
- Uses no external dependencies.

## Run

```powershell
node src/cli.js --text "현재 상태 알려줘"
node src/cli.js --text "git push 해줘"
node src/cli.js --text "파일 전부 삭제해"
```

Transcript file input:

```powershell
node src/cli.js --file .\voice-command.txt
```

Audio file input through Whisper provider:

```powershell
$env:WHISPER_PROVIDER="openai"
$env:OPENAI_API_KEY="sk-..."
node src/cli.js --voice-file .\voice.webm
```

Discord `MESSAGE_CREATE` JSON dry-run:

```json
{
  "id": "message-id",
  "channel_id": "channel-id",
  "author": { "id": "user-id", "bot": false },
  "content": "!jh 현재 상태 알려줘"
}
```

```powershell
node src/cli.js --discord-message .\discord-message.json
```

Discord live text bot:

```powershell
$env:DISCORD_BOT_TOKEN="..."
$env:DISCORD_COMMAND_PREFIX="!jh"
$env:AGENT_ROOM_ENABLED="true"
$env:AGENT_ROOM_BASE_URL="http://127.0.0.1:3100"
node src/cli.js --discord-live
```

Current live bot behavior:

- ignores bot messages
- accepts only prefixed text commands, default `!jh`
- routes safe commands to Agent Room
- creates Discord approval prompts for risky commands
- blocks destructive commands before Agent Room delivery

## Agent Room Bridge

Default mode is dry-run. It builds the Agent Room payload but does not send it.

```powershell
$env:AGENT_ROOM_ENABLED="false"
node src/cli.js --text "현재 상태 알려줘"
```

To send safe commands to Agent Room:

```powershell
$env:AGENT_ROOM_ENABLED="true"
$env:AGENT_ROOM_BASE_URL="http://127.0.0.1:3100"
$env:AGENT_ROOM_TARGET="claude"
node src/cli.js --text "현재 상태 알려줘"
```

Risky commands still return `approval_required` and are not sent as executable work.

## Test

```powershell
node --test
```

## Agent Flow

```text
Discord/Voice -> Whisper Agent -> Local Connector Agent -> Local Adapter -> Existing JH system
```

## Current MVP Limits

- Discord text Gateway bot is implemented with Node built-in `WebSocket`.
- OpenAI Whisper transcription is available through `WHISPER_PROVIDER=openai`, but live use requires `OPENAI_API_KEY`.
- Discord voice capture is gated. Live voice capture needs `@discordjs/voice`, `prism-media`, and an Opus runtime.
- Local Adapter does not run shell commands.
- Risky commands return approval requests only.
- Agent Room bridge assumes `POST /messages` JSON endpoint.
