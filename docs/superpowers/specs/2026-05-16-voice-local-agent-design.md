# Voice Local Agent MVP Design

Goal: add a safe voice-command entry layer without replacing existing JH roles.

Architecture:
- Whisper Agent turns a voice source into a transcript.
- Local Connector Agent receives transcript text, classifies intent and risk, then asks Local Adapter for an execution plan.
- Local Adapter only returns safe, explicit plans in MVP. It does not run destructive commands.

Boundaries:
- Claude remains implementation/operation owner in JH system.
- Codex remains independent reviewer by default, with user-directed execution exception.
- Discord and real Whisper API are phase 2. MVP uses file/mock transcript input.

Success criteria:
- text or transcript file can be processed locally.
- safe commands produce safe action plans.
- dangerous commands are blocked or marked approval-required.
- behavior covered by Node built-in tests.
