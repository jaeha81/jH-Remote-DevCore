# Decision Log

## 2026-05-16 - Preserve JH Role Model

Decision: Keep existing JH local system direction.

Reason: Codex remains independent reviewer by default, Claude remains implementation/operation owner, and Discord/Whisper become input interfaces instead of replacing the system.

## 2026-05-16 - Route Through Agent Room

Decision: Safe text commands route to Agent Room instead of direct shell execution.

Reason: Maintains approval, visibility, and existing JH collaboration flow.

## 2026-05-16 - Use Real Agent Room API Shape

Decision: Agent Room client uses `POST /api/messages`, not `/messages`.

Reason: Local Agent Room server exposes `/api/messages` with fields `speaker`, `kind`, `target`, `taskType`, and `body`.

## 2026-05-16 - Gate Voice Capture

Decision: Do not fake Discord voice capture.

Reason: Real voice requires Discord voice runtime dependencies and Opus/audio stream handling. Current implementation records explicit dependency gate.
