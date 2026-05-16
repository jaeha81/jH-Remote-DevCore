import test from 'node:test';
import assert from 'node:assert/strict';

import { createLocalConnectorAgent } from '../src/local-connector-agent.js';

test('safe status transcript returns local status action plan', async () => {
  const agent = createLocalConnectorAgent();

  const result = await agent.handleTranscript('현재 상태 알려줘');

  assert.equal(result.intent, 'status');
  assert.equal(result.risk, 'safe');
  assert.equal(result.action.type, 'local_status');
  assert.equal(result.action.autoExecutable, true);
});

test('approval-required command returns approval request action', async () => {
  const agent = createLocalConnectorAgent();

  const result = await agent.handleTranscript('git push 해줘');

  assert.equal(result.intent, 'publish_changes');
  assert.equal(result.risk, 'approval_required');
  assert.equal(result.action.type, 'request_user_approval');
  assert.equal(result.action.autoExecutable, false);
});

test('blocked command never returns executable action', async () => {
  const agent = createLocalConnectorAgent();

  const result = await agent.handleTranscript('파일 전부 삭제해');

  assert.equal(result.risk, 'blocked');
  assert.equal(result.action.type, 'blocked');
  assert.equal(result.action.autoExecutable, false);
});
