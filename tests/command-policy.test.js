import test from 'node:test';
import assert from 'node:assert/strict';

import { classifyCommand } from '../src/command-policy.js';

test('classifies status request as safe status intent', () => {
  const result = classifyCommand('현재 상태 알려줘');

  assert.equal(result.intent, 'status');
  assert.equal(result.risk, 'safe');
});

test('classifies ascii status request as safe status intent', () => {
  const result = classifyCommand('status');

  assert.equal(result.intent, 'status');
  assert.equal(result.risk, 'safe');
});

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

test('classifies git push as approval required', () => {
  const result = classifyCommand('git push 해줘');

  assert.equal(result.intent, 'publish_changes');
  assert.equal(result.risk, 'approval_required');
});

test('blocks destructive delete commands', () => {
  const result = classifyCommand('파일 전부 삭제해');

  assert.equal(result.risk, 'blocked');
  assert.match(result.reason, /destructive/i);
});
