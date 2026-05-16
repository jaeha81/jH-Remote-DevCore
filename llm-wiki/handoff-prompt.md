# Handoff Prompt

Continue work on this local project:

`D:\ai프로젝트\jH Remote DevCore`

Repository:

- `https://github.com/jaeha81/jH-Remote-DevCore.git`

## Current Implementation

- Text command path exists.
- Discord text Gateway bot exists.
- Agent Room client uses `/api/messages`.
- Agent Room diagnostics uses `/api/status`.
- Approval flow exists.
- OpenAI Whisper provider exists.
- Discord voice capture remains gated.

## Start Steps

1. Run `git pull`.
2. Run `git status --short`.
3. Run `node --test`.
4. Run `node src/cli.js --check-agent-room`.
5. If Agent Room returns `agent_room_unexpected_response`, fix the local port/API mismatch before live routing.
6. Continue with real Discord token test:
   - set `DISCORD_BOT_TOKEN`
   - set `AGENT_ROOM_BASE_URL`
   - set `AGENT_ROOM_ENABLED=true`
   - run `node src/cli.js --discord-live`

Do not directly execute user voice transcripts. Always classify first.

## Context Handoff Rule

If context compression risk appears:

1. Notify the user before compression.
2. Update `llm-wiki/current-state.md`.
3. Update `llm-wiki/validation-log.md`.
4. Update this `llm-wiki/handoff-prompt.md`.
5. Run `node --test`.
6. Commit and push.
7. Give this new-session command:

```text
Resume work.

Project: D:\ai프로젝트\jH Remote DevCore
Repo: https://github.com/jaeha81/jH-Remote-DevCore.git

First run:
1. git pull
2. git status --short
3. node --test
4. node src/cli.js --check-agent-room

Then read llm-wiki/handoff-prompt.md and continue.
If context compression risk appears, notify user first, update llm-wiki, print new-session prompt, and end current session.
```

## Immediate Next Work

1. Fix Agent Room port/API mismatch.
2. Confirm `node src/cli.js --check-agent-room` returns JSON status.
3. Run one safe text command with `AGENT_ROOM_ENABLED=true`.
4. If Agent Room works, proceed to Discord live token test.
