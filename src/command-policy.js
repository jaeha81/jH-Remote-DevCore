const blockedPatterns = [
  /\b(rm\s+-rf|del\s+\/|format\s+|shutdown\s+|reg\s+delete)\b/i,
  /(삭제|지워|날려|초기화).*(전부|전체|모두|싹|완전)/i,
  /(전부|전체|모두|싹).*(삭제|지워|날려|초기화)/i
];

const approvalPatterns = [
  /\bgit\s+push\b/i,
  /\bgit\s+clean\b/i,
  /\bgit\s+reset\b/i,
  /\bnpm\s+(install|audit|publish)\b/i,
  /(배포|푸시|push|환경변수|env|외부 전송|결제)/i
];

export function classifyCommand(text) {
  const normalized = normalizeCommand(text);

  if (!normalized) {
    return buildResult('unknown', 'blocked', 'empty command');
  }

  if (blockedPatterns.some((pattern) => pattern.test(normalized))) {
    return buildResult('blocked_command', 'blocked', 'destructive command blocked');
  }

  if (approvalPatterns.some((pattern) => pattern.test(normalized))) {
    return buildResult(inferApprovalIntent(normalized), 'approval_required', 'user approval required');
  }

  return buildResult(inferSafeIntent(normalized), 'safe', 'safe local routing only');
}

function inferApprovalIntent(text) {
  if (/\bgit\s+push\b/i.test(text) || /(푸시|push)/i.test(text)) {
    return 'publish_changes';
  }
  if (/(배포)/i.test(text)) {
    return 'deploy';
  }
  if (/(환경변수|env)/i.test(text)) {
    return 'change_environment';
  }
  return 'approval_required';
}

function inferSafeIntent(text) {
  if (/(현재 상태|상태|진행 상황|보고)/i.test(text)) {
    return 'status';
  }
  if (/(작업 시작|개발 착수|시작)/i.test(text)) {
    return 'start_work';
  }
  if (/(검수|검증|리뷰)/i.test(text)) {
    return 'review_request';
  }
  if (/(claude|클로드).*(분석|검토|요청)/i.test(text)) {
    return 'claude_analysis_request';
  }
  if (/(옵시디언|obsidian|저장|인계)/i.test(text)) {
    return 'handoff_record_request';
  }
  return 'unknown';
}

function buildResult(intent, risk, reason) {
  return { intent, risk, reason };
}

function normalizeCommand(text) {
  return String(text ?? '').trim();
}
