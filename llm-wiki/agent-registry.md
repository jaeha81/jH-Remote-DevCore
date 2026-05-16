# Agent Registry

## Whisper Agent

- Input: audio file or transcript file.
- Output: normalized transcript text.
- Providers: `text-file`, `openai`.
- Live OpenAI use requires `OPENAI_API_KEY`.

## Discord Text Bot

- Input: Discord Gateway `MESSAGE_CREATE`.
- Prefix: `!jh` by default.
- Output: route result and Discord reply.
- Safe commands route to Agent Room.

## Local Connector Agent

- Input: normalized transcript text.
- Output: intent, risk, action, Agent Room message.
- Depends on command policy and local adapter.

## Local Adapter

- Input: classified command.
- Output: safe action plan, approval request, or blocked result.
- Does not run shell commands.

## Agent Room Client

- Endpoint: `POST /api/messages`.
- Payload: `speaker`, `kind`, `target`, `taskType`, `body`, `source`.
- Diagnostics endpoint: `GET /api/status`.

## Approval Manager

- Creates pending approval records for approval-required commands.
- Resolves approval once.
