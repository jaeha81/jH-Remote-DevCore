# Context Handoff Protocol

Use this protocol when the session is likely to exceed safe context capacity or the user asks to avoid context compression.

## Trigger

Start handoff when any condition is true:

- The user says context is getting large or asks to avoid compression.
- Work has reached a natural checkpoint after a commit.
- The assistant believes continued work risks losing important state.
- A new major phase is about to start after long implementation.

## Required Actions

1. Stop starting new implementation work.
2. Tell the user that context handoff is starting.
3. Update `llm-wiki/current-state.md`.
4. Update `llm-wiki/validation-log.md`.
5. Update `llm-wiki/handoff-prompt.md`.
6. Run `node --test`.
7. Run `git status --short`.
8. Commit and push the handoff updates.
9. Give the user the exact new-session command prompt.
10. End the current session.

## New Session Prompt Template

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

## Rule

Do not silently continue into context compression. Preserve state first, then restart from `llm-wiki/handoff-prompt.md`.
