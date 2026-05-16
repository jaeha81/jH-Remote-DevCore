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
- Local Adapter does not run shell commands yet.
- Risky commands return approval requests only.
