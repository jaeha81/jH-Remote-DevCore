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
$env:AGENT_ROOM_BASE_URL="http://localhost:3100"
node src/cli.js --discord-live
```

Current live bot behavior:

- ignores bot messages
- accepts only prefixed text commands, default `!jh`
- routes safe commands to Agent Room
- writes Today Plus captures to the configured archiver inbox
- creates Discord approval prompts for risky commands
- blocks destructive commands before Agent Room delivery

## Agent Room Bridge

Default mode is dry-run. It builds the Agent Room payload but does not send it.

```powershell
$env:AGENT_ROOM_ENABLED="false"
node src/cli.js --text "현재 상태 알려줘"
```

Check Agent Room connectivity:

```powershell
$env:AGENT_ROOM_BASE_URL="http://localhost:3100"
node src/cli.js --check-agent-room
```

To send safe commands to Agent Room:

```powershell
$env:AGENT_ROOM_ENABLED="true"
$env:AGENT_ROOM_BASE_URL="http://localhost:3100"
$env:AGENT_ROOM_TARGET="claude"
node src/cli.js --text "현재 상태 알려줘"
```

Risky commands still return `approval_required` and are not sent as executable work.

## Today Plus File Drop

Remote DevCore can write Today Plus content into the local archiver inbox. The archiver should watch the same folder through its `config.yaml` `input_folder`.

```powershell
$env:TODAY_PLUS_INBOX="D:\ai프로젝트\today-plus-obsidian-archiver\inbox"
node src/cli.js --text "today plus`n`nOriginal Today Plus content"
```

Run the archiver watcher separately:

```powershell
cd "D:\ai프로젝트\today-plus-obsidian-archiver"
python main.py --watch
```

Discord usage:

```text
!jh today plus

Original Today Plus content
```

## Test

```powershell
node --test
```

## Context Handoff

If context compression risk appears, do not continue silently.

1. Update `llm-wiki/current-state.md`.
2. Update `llm-wiki/validation-log.md`.
3. Update `llm-wiki/handoff-prompt.md`.
4. Run `node --test`.
5. Commit and push.
6. Start a new session with the prompt in `llm-wiki/handoff-prompt.md`.

Full protocol: `docs/context-handoff-protocol.md`.

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
- Agent Room bridge uses `POST /api/messages` and `GET /api/status?format=json`.
