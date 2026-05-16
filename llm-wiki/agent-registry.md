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
- Safe commands route to Agent Room unless the action is `today_plus_drop`.
- Today Plus captures write Markdown files to the configured archiver inbox.

## Local Connector Agent

- Input: normalized transcript text.
- Output: intent, risk, action, Agent Room message.
- Depends on command policy and local adapter.

## Local Adapter

- Input: classified command.
- Output: safe action plan, approval request, or blocked result.
- Does not run shell commands.
- `today_plus_capture` maps to `today_plus_drop` and route channel `local_file`.

## Today Plus File Drop

- Input: transcript classified as `today_plus_capture`.
- Output: `today-plus-YYYYMMDD-HHMMSS.md` in `TODAY_PLUS_INBOX`.
- Default inbox: `D:\ai프로젝트\today-plus-obsidian-archiver\inbox`.
- The archiver `config.yaml` `input_folder` must point to the same folder.

## Agent Room Client

- Endpoint: `POST /api/messages`.
- Payload: `speaker`, `kind`, `target`, `taskType`, `body`, `source`.
- Diagnostics endpoint: `GET /api/status?format=json`.

## Approval Manager

- Creates pending approval records for approval-required commands.
- Resolves approval once.
