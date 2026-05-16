import { classifyCommand } from './command-policy.js';
import { createLocalAdapter } from './local-adapter.js';

export function createLocalConnectorAgent({ adapter = createLocalAdapter() } = {}) {
  return {
    async handleTranscript(transcript) {
      const normalizedTranscript = String(transcript ?? '').trim();
      const classification = classifyCommand(normalizedTranscript);
      const action = adapter.plan(classification);

      return {
        transcript: normalizedTranscript,
        intent: classification.intent,
        risk: classification.risk,
        reason: classification.reason,
        action
      };
    }
  };
}
