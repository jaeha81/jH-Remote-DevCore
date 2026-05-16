import test from 'node:test';
import assert from 'node:assert/strict';

import { createApprovalManager } from '../src/approval-manager.js';

test('creates pending approval for approval-required routing', () => {
  const approvals = createApprovalManager({ idFactory: () => 'approval-1' });

  const approval = approvals.create({
    transcript: 'git push 해줘',
    intent: 'publish_changes',
    risk: 'approval_required',
    action: { type: 'request_user_approval' }
  });

  assert.equal(approval.id, 'approval-1');
  assert.equal(approval.status, 'pending');
  assert.equal(approvals.get('approval-1').transcript, 'git push 해줘');
});

test('approves pending approval once', () => {
  const approvals = createApprovalManager({ idFactory: () => 'approval-1' });
  approvals.create({ transcript: 'git push 해줘', risk: 'approval_required' });

  const approved = approvals.resolve('approval-1', 'approved');

  assert.equal(approved.status, 'approved');
  assert.throws(() => approvals.resolve('approval-1', 'approved'), /not pending/);
});
