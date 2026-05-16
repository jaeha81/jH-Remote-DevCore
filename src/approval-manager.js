export function createApprovalManager({
  idFactory = () => `approval-${Date.now()}-${Math.random().toString(16).slice(2)}`
} = {}) {
  const approvals = new Map();

  return {
    create(routing) {
      const id = idFactory();
      const approval = {
        id,
        status: 'pending',
        createdAt: new Date().toISOString(),
        transcript: routing.transcript,
        intent: routing.intent ?? 'unknown',
        risk: routing.risk,
        action: routing.action ?? null
      };

      approvals.set(id, approval);
      return approval;
    },

    get(id) {
      return approvals.get(id) ?? null;
    },

    resolve(id, status) {
      if (!['approved', 'rejected'].includes(status)) {
        throw new Error(`unsupported approval status: ${status}`);
      }

      const approval = approvals.get(id);
      if (!approval) {
        throw new Error(`approval not found: ${id}`);
      }

      if (approval.status !== 'pending') {
        throw new Error(`approval is not pending: ${id}`);
      }

      approval.status = status;
      approval.resolvedAt = new Date().toISOString();
      approvals.set(id, approval);
      return approval;
    }
  };
}
