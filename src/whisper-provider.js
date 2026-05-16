import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { transcribeTextFile } from './whisper-agent.js';

export function createTranscriberFromConfig(config) {
  const provider = String(config.provider ?? 'text-file').toLowerCase();

  if (provider === 'text-file') {
    requireValue(config.filePath, 'filePath is required for text-file provider');
    return {
      async transcribe() {
        return transcribeTextFile(config.filePath);
      }
    };
  }

  if (provider === 'openai') {
    return createOpenAIWhisperTranscriber(config);
  }

  throw new Error(`unsupported whisper provider: ${provider}`);
}

function createOpenAIWhisperTranscriber({
  apiKey,
  filePath,
  model = 'whisper-1',
  endpoint = 'https://api.openai.com/v1/audio/transcriptions',
  fetchImpl = globalThis.fetch
}) {
  requireValue(apiKey, 'apiKey is required for openai provider');
  requireValue(filePath, 'filePath is required for openai provider');

  if (typeof fetchImpl !== 'function') {
    throw new TypeError('fetch implementation is required for openai provider');
  }

  return {
    async transcribe() {
      const audio = await readFile(filePath);
      const form = new FormData();
      form.set('model', model);
      form.set('file', new Blob([audio]), basename(filePath));

      const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${apiKey}`
        },
        body: form
      });

      const body = await response.json();

      if (!response.ok) {
        const message = body?.error?.message ?? `OpenAI transcription failed with ${response.status}`;
        throw new Error(message);
      }

      return String(body.text ?? '').trim();
    }
  };
}

function requireValue(value, message) {
  if (value === undefined || value === null || value === '') {
    throw new Error(message);
  }
}
