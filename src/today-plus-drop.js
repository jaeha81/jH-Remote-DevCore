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
  return String(transcript ?? '')
    .replace(/^\s*(today[-\s]?plus|오늘의\s*플러스|ChatGPT\s*오늘의\s*플러스)\s*/i, '')
    .trim();
}
