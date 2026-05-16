# Today Plus File Drop Integration Design

Date: 2026-05-16

## Goal

Route Today Plus content sent from mobile-friendly channels into the local Today Plus Obsidian Archiver without manual file save or move steps.

## Selected Approach

jH Remote DevCore will create a local Markdown file in the archiver inbox when a safe Today Plus capture request is received. The existing `today-plus-obsidian-archiver --watch` process will handle the file and write the final Obsidian note.

This keeps Discord, Whisper, transcript file, and direct CLI inputs on the same DevCore path while keeping the archiver responsible for parsing, deduplication, summarization, and Obsidian output.

## Data Flow

1. User sends Today Plus content through Discord, Whisper transcript, transcript file, or direct CLI text.
2. DevCore classifies the transcript as a safe `today_plus_capture` intent.
3. The Local Adapter plans a `today_plus_drop` action.
4. DevCore writes a Markdown file to the configured inbox folder.
5. The archiver, running in `--watch` mode, detects the new `.md` file.
6. The archiver creates or updates the TodayPlus note in the configured Obsidian Vault.

## Configuration

Add DevCore environment variables:

- `TODAY_PLUS_INBOX`: defaults to `D:\ai프로젝트\today-plus-obsidian-archiver\inbox`
- `TODAY_PLUS_SOURCE`: optional source label override; default comes from the input channel when available

The archiver `config.yaml` must use the same folder:

```yaml
input_folder: "D:/ai프로젝트/today-plus-obsidian-archiver/inbox"
```

## File Format

Filename:

```text
today-plus-YYYYMMDD-HHMMSS.md
```

Content:

```markdown
# Today Plus

source: discord
received_at: 2026-05-16T21:30:00+09:00
sender: user

---

Original Today Plus content...
```

The writer must create the inbox directory if missing and write using UTF-8.

## Classification

The first implementation will classify a transcript as Today Plus when it contains one of:

- `today plus`
- `today-plus`
- `오늘의 플러스`
- `ChatGPT 오늘의 플러스`

The transcript remains safe because DevCore only writes a local text file and does not execute user content.

## Error Handling

If the file write fails, DevCore should return a structured delivery object with:

- `written: false`
- `reason: "today_plus_write_failed"`
- `error`

Discord replies should still complete with a failure summary instead of crashing the gateway handler.

## Tests

Add focused Node tests for:

- Today Plus text classification.
- Local Adapter planning `today_plus_drop`.
- Markdown writer filename and content format.
- CLI/direct text path writing to a temporary inbox.
- Discord text bot safe path using an injected writer or delivery handler.

## Out Of Scope

- Direct Discord token setup.
- Editing the archiver parsing pipeline.
- Starting the archiver watcher automatically.
- Parsing Today Plus content into sections inside DevCore.
