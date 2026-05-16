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

- Real Discord bot is not connected yet.
- Real Whisper API/local model is not connected yet.
- Local Adapter does not run shell commands.
- Risky commands return approval requests only.
- Agent Room bridge assumes `POST /messages` JSON endpoint.
