# Handoff Prompt

Continue work on `D:\ai프로젝트\jH Remote DevCore`.

Repository:

- `https://github.com/jaeha81/jH-Remote-DevCore.git`

Current implementation:

- Text command path exists.
- Discord text Gateway bot exists.
- Agent Room client uses `/api/messages`.
- Agent Room diagnostics uses `/api/status`.
- Approval flow exists.
- OpenAI Whisper provider exists.
- Discord voice capture remains gated.

Start steps:

1. Run `git status --short`.
2. Run `node --test`.
3. Run `node src/cli.js --check-agent-room`.
4. If Agent Room returns `agent_room_unexpected_response`, fix the local port conflict before live routing.
5. Continue with real Discord token test:
   - set `DISCORD_BOT_TOKEN`
   - set `AGENT_ROOM_BASE_URL`
   - set `AGENT_ROOM_ENABLED=true`
   - run `node src/cli.js --discord-live`

Do not directly execute user voice transcripts. Always classify first.
