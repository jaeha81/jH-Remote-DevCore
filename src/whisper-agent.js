import { readFile } from 'node:fs/promises';

export function createMockTranscriber(transcript) {
  return {
    async transcribe() {
      return normalizeTranscript(transcript);
    }
  };
}

export function createWhisperAgent({ transcriber }) {
  if (!transcriber || typeof transcriber.transcribe !== 'function') {
    throw new TypeError('transcriber with transcribe() is required');
  }

  return {
    async transcribe(input = {}) {
      const transcript = await transcriber.transcribe(input);
      return {
        source: input.source ?? 'unknown',
        transcript: normalizeTranscript(transcript)
      };
    }
  };
}

export async function transcribeTextFile(filePath) {
  const contents = await readFile(filePath, 'utf8');
  return normalizeTranscript(contents);
}

function normalizeTranscript(value) {
  return String(value ?? '').trim();
}
