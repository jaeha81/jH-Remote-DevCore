# Voice Local Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local Whisper Agent and Local Connector Agent MVP that safely routes voice-derived commands into existing JH workflows.

**Architecture:** Use small Node ES modules with no external dependencies. Whisper Agent returns transcripts from text/file/mock providers. Local Connector classifies command intent and risk, then Local Adapter returns a non-destructive action plan.

**Tech Stack:** Node.js 22, ES modules, node:test.

---

### Task 1: RED Tests

**Files:**
- Create: `tests/whisper-agent.test.js`
- Create: `tests/local-connector-agent.test.js`
- Create: `tests/command-policy.test.js`

- [ ] Write failing tests for transcript file reading, safe status command routing, approval-required git push, and blocked delete command.
- [ ] Run: `node --test`
- [ ] Expected: fail because `src/*` modules do not exist.

### Task 2: Whisper Agent

**Files:**
- Create: `src/whisper-agent.js`

- [ ] Implement `createWhisperAgent`, `createMockTranscriber`, and `transcribeTextFile`.
- [ ] Run: `node --test tests/whisper-agent.test.js`
- [ ] Expected: pass.

### Task 3: Command Policy

**Files:**
- Create: `src/command-policy.js`

- [ ] Implement intent classification and risk policy.
- [ ] Run: `node --test tests/command-policy.test.js`
- [ ] Expected: pass.

### Task 4: Local Connector and Adapter

**Files:**
- Create: `src/local-adapter.js`
- Create: `src/local-connector-agent.js`

- [ ] Implement safe action plans and blocked/approval-required outcomes.
- [ ] Run: `node --test tests/local-connector-agent.test.js`
- [ ] Expected: pass.

### Task 5: CLI and Docs

**Files:**
- Create: `src/cli.js`
- Create: `README.md`

- [ ] Add command-line entry for direct text and transcript files.
- [ ] Run: `node src/cli.js --text "현재 상태 알려줘"`
- [ ] Expected: JSON result with `intent: "status"` and `risk: "safe"`.
