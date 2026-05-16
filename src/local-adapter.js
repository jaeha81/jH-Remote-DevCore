export function createLocalAdapter({ routeTarget = 'claude' } = {}) {
  return {
    plan(classification) {
      if (classification.risk === 'blocked') {
        return {
          type: 'blocked',
          autoExecutable: false,
          message: classification.reason,
          route: buildRoute('none', routeTarget)
        };
      }

      if (classification.risk === 'approval_required') {
        return {
          type: 'request_user_approval',
          autoExecutable: false,
          message: '사용자 승인 후 기존 JH 흐름으로 전달',
          route: buildRoute('user', routeTarget)
        };
      }

      return buildSafeAction(classification.intent, routeTarget);
    }
  };
}

function buildSafeAction(intent, routeTarget) {
  const actions = {
    status: {
      type: 'local_status',
      autoExecutable: true,
      message: '로컬 상태 점검 요청 생성',
      route: buildRoute('agent_room', routeTarget)
    },
    start_work: {
      type: 'start_workflow',
      autoExecutable: true,
      message: '개발 착수 워크플로우 요청 생성',
      route: buildRoute('agent_room', routeTarget)
    },
    review_request: {
      type: 'codex_review',
      autoExecutable: true,
      message: 'Codex 검수 요청 생성',
      route: buildRoute('agent_room', 'codex')
    },
    claude_analysis_request: {
      type: 'claude_analysis',
      autoExecutable: true,
      message: 'Claude 분석 요청 생성',
      route: buildRoute('agent_room', 'claude')
    },
    handoff_record_request: {
      type: 'handoff_record',
      autoExecutable: true,
      message: 'handoff 기록 요청 생성',
      route: buildRoute('agent_room', 'claude')
    },
    unknown: {
      type: 'needs_clarification',
      autoExecutable: false,
      message: '명령 해석 필요',
      route: buildRoute('user', routeTarget)
    }
  };

  return actions[intent] ?? actions.unknown;
}

function buildRoute(channel, target) {
  return {
    channel,
    target
  };
}
