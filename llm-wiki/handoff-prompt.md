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
작업 이어서 재개.

프로젝트: D:\ai프로젝트\jH Remote DevCore
레포: https://github.com/jaeha81/jH-Remote-DevCore.git

먼저 다음을 실행:
1. git pull
2. git status --short
3. node --test
4. node src/cli.js --check-agent-room

그 다음 llm-wiki/handoff-prompt.md를 읽고 이어서 진행.
컨텍스트 압축 위험이 생기면 사용자에게 먼저 고지하고, llm-wiki를 갱신한 뒤 새 세션 시작 명령문을 출력하고 종료.
```
