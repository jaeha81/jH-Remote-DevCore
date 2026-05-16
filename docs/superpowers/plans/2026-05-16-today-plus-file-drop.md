# Today Plus File Drop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a safe DevCore route that writes Today Plus content from CLI, Discord, or Whisper transcript input into the Today Plus Obsidian Archiver inbox.

**Architecture:** Extend the existing classification and Local Adapter flow with a `today_plus_capture` intent and `today_plus_drop` action. Add a focused file-drop writer and call it from CLI and Discord safe delivery paths before falling back to Agent Room delivery.

**Tech Stack:** Node.js ES modules, `node:test`, `node:fs/promises`, existing DevCore CLI/Discord modules.

---

## File Structure

- Modify `src/config.js`: add `todayPlus.inbox` and optional `todayPlus.source`.
- Modify `.env.example`: document `TODAY_PLUS_INBOX` and `TODAY_PLUS_SOURCE`.
- Modify `src/command-policy.js`: classify Today Plus capture phrases.
- Modify `src/local-adapter.js`: add `today_plus_drop` safe action.
- Modify `src/local-connector-agent.js`: include source metadata if available.
- Create `src/today-plus-drop.js`: format and write inbox Markdown files.
- Modify `src/cli.js`: call Today Plus drop delivery for `today_plus_drop`.
- Modify `src/discord-text-bot.js`: call Today Plus drop delivery for Discord safe messages.
- Add or modify tests under `tests/`.
- Update `README.md` and `llm-wiki/*` with the new route.

---

### Task 1: Configuration

**Files:**
- Modify: `src/config.js`
- Modify: `.env.example`
- Test: `tests/config.test.js`

- [ ] **Step 1: Write the failing config test**

Add assertions to `tests/config.test.js`:

```js
assert.equal(
  config.todayPlus.inbox,
  'D:\\ai프로젝트\\today-plus-obsidian-archiver\\inbox'
);
assert.equal(config.todayPlus.source, '');
```

Add env override assertions:

```js
const config = loadConfig({
  TODAY_PLUS_INBOX: 'C:\\Users\\user1\\TodayPlus_Input',
  TODAY_PLUS_SOURCE: 'discord'
});

assert.equal(config.todayPlus.inbox, 'C:\\Users\\user1\\TodayPlus_Input');
assert.equal(config.todayPlus.source, 'discord');
```

- [ ] **Step 2: Run the config test to verify it fails**

Run: `node --test tests\config.test.js`

Expected: FAIL because `config.todayPlus` is undefined.

- [ ] **Step 3: Implement config**

In `src/config.js`, add:

```js
    todayPlus: {
      inbox: normalizePath(env.TODAY_PLUS_INBOX ?? 'D:\\ai프로젝트\\today-plus-obsidian-archiver\\inbox'),
      source: String(env.TODAY_PLUS_SOURCE ?? '').trim()
    },
```

Add helper:

```js
function normalizePath(value) {
  return String(value).trim();
}
```

Update `.env.example`:

```text
TODAY_PLUS_INBOX=D:\ai프로젝트\today-plus-obsidian-archiver\inbox
TODAY_PLUS_SOURCE=
```

- [ ] **Step 4: Run the config test to verify it passes**

Run: `node --test tests\config.test.js`

Expected: PASS.

---

### Task 2: Classification And Action Planning

**Files:**
- Modify: `src/command-policy.js`
- Modify: `src/local-adapter.js`
- Test: `tests/command-policy.test.js`
- Test: `tests/local-connector-agent.test.js`

- [ ] **Step 1: Write failing classification tests**

Add to `tests/command-policy.test.js`:

```js
test('classifies today plus capture as safe', () => {
  const result = classifyCommand('today plus\n\nOriginal content');

  assert.equal(result.intent, 'today_plus_capture');
  assert.equal(result.risk, 'safe');
});

test('classifies Korean today plus capture as safe', () => {
  const result = classifyCommand('오늘의 플러스\n\n원문 내용');

  assert.equal(result.intent, 'today_plus_capture');
  assert.equal(result.risk, 'safe');
});
```

- [ ] **Step 2: Write failing adapter test**

Add to `tests/local-connector-agent.test.js`:

```js
test('today plus transcript returns file drop action plan', async () => {
  const agent = createLocalConnectorAgent();

  const result = await agent.handleTranscript('today plus\n\nOriginal content');

  assert.equal(result.intent, 'today_plus_capture');
  assert.equal(result.risk, 'safe');
  assert.equal(result.action.type, 'today_plus_drop');
  assert.equal(result.action.autoExecutable, true);
  assert.equal(result.action.route.channel, 'local_file');
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `node --test tests\command-policy.test.js tests\local-connector-agent.test.js`

Expected: FAIL because the intent is `unknown`.

- [ ] **Step 4: Implement classification**

In `src/command-policy.js`, add before the status check:

```js
  if (/\btoday[-\s]?plus\b/i.test(text) || /(오늘의\s*플러스|ChatGPT\s*오늘의\s*플러스)/i.test(text)) {
    return 'today_plus_capture';
  }
```

- [ ] **Step 5: Implement adapter action**

In `src/local-adapter.js`, add to `actions`:

```js
    today_plus_capture: {
      type: 'today_plus_drop',
      autoExecutable: true,
      message: 'Today Plus content will be written to the archiver inbox.',
      route: buildRoute('local_file', 'today_plus')
    },
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `node --test tests\command-policy.test.js tests\local-connector-agent.test.js`

Expected: PASS.

---

### Task 3: Today Plus File Writer

**Files:**
- Create: `src/today-plus-drop.js`
- Test: `tests/today-plus-drop.test.js`

- [ ] **Step 1: Write failing writer tests**

Create `tests/today-plus-drop.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { writeTodayPlusDrop } from '../src/today-plus-drop.js';

test('writes today plus markdown file to inbox', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'today-plus-'));
  try {
    const result = await writeTodayPlusDrop({
      inbox: dir,
      transcript: 'today plus\n\nOriginal content',
      source: 'discord',
      sender: 'user',
      now: new Date('2026-05-16T12:30:45+09:00')
    });

    assert.equal(result.written, true);
    assert.match(result.fileName, /^today-plus-20260516-123045\.md$/);
    const content = await readFile(result.path, 'utf8');
    assert.match(content, /^# Today Plus/);
    assert.match(content, /source: discord/);
    assert.match(content, /sender: user/);
    assert.match(content, /Original content/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run writer test to verify it fails**

Run: `node --test tests\today-plus-drop.test.js`

Expected: FAIL because `src/today-plus-drop.js` does not exist.

- [ ] **Step 3: Implement writer**

Create `src/today-plus-drop.js`:

```js
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function writeTodayPlusDrop({
  inbox,
  transcript,
  source = 'devcore',
  sender = 'user',
  now = new Date()
}) {
  try {
    await mkdir(inbox, { recursive: true });
    const fileName = `today-plus-${formatTimestamp(now)}.md`;
    const path = join(inbox, fileName);
    await writeFile(path, formatMarkdown({ transcript, source, sender, now }), 'utf8');
    return { written: true, path, fileName };
  } catch (error) {
    return {
      written: false,
      reason: 'today_plus_write_failed',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function formatTimestamp(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  return `${parts.year}${parts.month}${parts.day}-${parts.hour}${parts.minute}${parts.second}`;
}

function formatMarkdown({ transcript, source, sender, now }) {
  return [
    '# Today Plus',
    '',
    `source: ${source}`,
    `received_at: ${now.toISOString()}`,
    `sender: ${sender}`,
    '',
    '---',
    '',
    stripTriggerLine(transcript),
    ''
  ].join('\n');
}

function stripTriggerLine(transcript) {
  return String(transcript ?? '').replace(/^\s*(today[-\s]?plus|오늘의\s*플러스|ChatGPT\s*오늘의\s*플러스)\s*/i, '').trim();
}
```

- [ ] **Step 4: Run writer test to verify it passes**

Run: `node --test tests\today-plus-drop.test.js`

Expected: PASS.

---

### Task 4: CLI Delivery

**Files:**
- Modify: `src/cli.js`
- Test: create or modify `tests/cli-today-plus.test.js`

- [ ] **Step 1: Write failing CLI integration test**

Create `tests/cli-today-plus.test.js` using `node:child_process`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

test('cli writes today plus content to configured inbox', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'today-plus-cli-'));
  try {
    const { stdout } = await execFileAsync('node', [
      'src/cli.js',
      '--text',
      'today plus\n\nOriginal content'
    ], {
      env: {
        ...process.env,
        TODAY_PLUS_INBOX: dir,
        TODAY_PLUS_SOURCE: 'cli'
      }
    });

    const result = JSON.parse(stdout);
    assert.equal(result.delivery.written, true);
    const files = await readdir(dir);
    assert.equal(files.length, 1);
    const content = await readFile(join(dir, files[0]), 'utf8');
    assert.match(content, /source: cli/);
    assert.match(content, /Original content/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run CLI test to verify it fails**

Run: `node --test tests\cli-today-plus.test.js`

Expected: FAIL because CLI still routes only Agent Room delivery.

- [ ] **Step 3: Implement CLI delivery**

In `src/cli.js`, import:

```js
import { writeTodayPlusDrop } from './today-plus-drop.js';
```

Change `maybeDeliver` signature to accept config:

```js
const delivery = await maybeDeliver(agentRoom, routing, config);
```

Add first branch in `maybeDeliver`:

```js
async function maybeDeliver(agentRoom, routing, config) {
  if (routing.action.type === 'today_plus_drop') {
    return writeTodayPlusDrop({
      inbox: config.todayPlus.inbox,
      transcript: routing.transcript,
      source: config.todayPlus.source || routing.agentRoomMessage.source || 'cli',
      sender: 'user'
    });
  }
```

Keep the existing Agent Room branch after this.

- [ ] **Step 4: Run CLI test to verify it passes**

Run: `node --test tests\cli-today-plus.test.js`

Expected: PASS.

---

### Task 5: Discord Safe Delivery

**Files:**
- Modify: `src/discord-text-bot.js`
- Test: `tests/discord-text-bot.test.js`

- [ ] **Step 1: Write failing Discord delivery test**

Add to `tests/discord-text-bot.test.js`:

```js
test('Discord text bot writes today plus content through injected drop writer', async () => {
  const writes = [];
  const bot = createDiscordTextBot({
    config: {
      discord: { prefix: '!jh', token: 'discord-token' },
      agentRoom: { enabled: false, baseUrl: 'http://agent-room.local', target: 'claude' },
      todayPlus: { inbox: 'C:\\TodayPlus', source: '' }
    },
    responder: { sendMessage: async () => ({ sent: true }) },
    todayPlusDrop: async (input) => {
      writes.push(input);
      return { written: true, path: 'C:\\TodayPlus\\today-plus-20260516-123000.md' };
    }
  });

  const result = await bot.handleMessageCreate({
    author: { bot: false, username: 'mobile-user' },
    channel_id: 'channel-1',
    content: '!jh today plus\n\nOriginal content'
  });

  assert.equal(result.handled, true);
  assert.equal(result.delivery.written, true);
  assert.equal(writes[0].source, 'discord');
  assert.equal(writes[0].sender, 'mobile-user');
});
```

- [ ] **Step 2: Run Discord test to verify it fails**

Run: `node --test tests\discord-text-bot.test.js`

Expected: FAIL because `todayPlusDrop` injection is unused.

- [ ] **Step 3: Implement Discord delivery injection**

In `src/discord-text-bot.js`, import:

```js
import { writeTodayPlusDrop } from './today-plus-drop.js';
```

Add constructor option:

```js
  todayPlusDrop = writeTodayPlusDrop
```

Pass it into `maybeDeliver`:

```js
const delivery = await maybeDeliver(agentRoomClient, routing, config, parsed, event, todayPlusDrop);
```

Update `maybeDeliver`:

```js
async function maybeDeliver(agentRoomClient, routing, config, parsed, event, todayPlusDrop) {
  if (routing.action.type === 'today_plus_drop') {
    return todayPlusDrop({
      inbox: config.todayPlus.inbox,
      transcript: routing.transcript,
      source: config.todayPlus.source || 'discord',
      sender: event.author?.username ?? parsed.discord?.authorId ?? 'user'
    });
  }
```

Keep the existing Agent Room branch after this.

- [ ] **Step 4: Run Discord test to verify it passes**

Run: `node --test tests\discord-text-bot.test.js`

Expected: PASS.

---

### Task 6: Documentation And Verification

**Files:**
- Modify: `README.md`
- Modify: `llm-wiki/current-state.md`
- Modify: `llm-wiki/agent-registry.md`
- Modify: `llm-wiki/validation-log.md`

- [ ] **Step 1: Update README**

Add a section:

```markdown
## Today Plus File Drop

Remote DevCore can write Today Plus content into the archiver inbox:

```powershell
$env:TODAY_PLUS_INBOX="D:\ai프로젝트\today-plus-obsidian-archiver\inbox"
node src/cli.js --text "today plus`n`nOriginal Today Plus content"
```

Run the archiver watcher separately:

```powershell
cd "D:\ai프로젝트\today-plus-obsidian-archiver"
python main.py --watch
```
```

- [ ] **Step 2: Update LLM wiki**

Record that `today_plus_capture` routes to a local file drop and not Agent Room.

- [ ] **Step 3: Run full verification**

Run:

```powershell
node --test
node src\cli.js --check-agent-room
$env:TODAY_PLUS_INBOX="$env:TEMP\devcore-today-plus"; node src\cli.js --text "today plus`n`nVerification content"
```

Expected:

- All tests pass.
- Agent Room status remains JSON.
- CLI output includes `"written": true`.
- A `today-plus-*.md` file exists in the temp inbox.

- [ ] **Step 4: Inspect git status**

Run: `git status --short`

Expected: only intended source, test, docs, and config files are modified.
