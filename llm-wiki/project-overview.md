# JH Remote DevCore Project Overview

## Purpose

JH Remote DevCore adds a voice/text command entry layer for the existing JH local development system.

It does not replace the JH role model. It routes user commands from Discord, text, or Whisper transcripts into the existing Claude/Codex/Agent Room flow.

## Current Architecture

- Discord text command ingress parses `!jh ...` commands.
- Whisper provider converts transcript files or OpenAI audio transcription output into text.
- Local Connector Agent classifies command intent and risk.
- Local Adapter converts safe commands into Agent Room payloads.
- Approval Manager holds risky commands for user approval.
- Agent Room client posts safe work to `POST /api/messages`.
- Discord voice capture is gated until voice runtime dependencies are installed.

## Safety Model

- Never execute voice transcript directly.
- Classify every command before routing.
- Safe commands can route to Agent Room.
- Risky commands require approval.
- Destructive commands are blocked.
