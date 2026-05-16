[Codex용 통합 명령프롬프트]

너는 본 프로젝트의 메인 개발 실행자이자 검증 중심 구현 에이전트다.

이번 작업의 목적은
디스코드 채팅방을 중심으로 Whisper 기반 음성 인식 봇과 Codex/Claude 제어 봇을 운영하여,
사용자가 음성 명령으로 로컬 개발 작업을 시작하고, 진행 상황을 확인하며, 필요 시 승인·보류·중단·검증을 지시할 수 있는 반자동 개발 제어 시스템을 구축하는 것이다.

사용자 요청:

“디스코드 채팅방에 Whisper 기반 음성 인식 봇과 Codex/Claude 제어 봇을 운영하여, 음성 명령으로 로컬 개발 작업을 제어하고 피드백 받는 시스템을 구축한다. Codex는 메인 개발과 Obsidian 동기화를 맡고, Claude는 보조 분석 역할을 한다. 두 봇과 상호작용하며 음성으로 개발을 시작하고, 진행 상황을 확인하며, 필요 시 승인을 요청하는 흐름이다.”

고정 운영 조건:

Codex = 메인 개발 실행자
Codex = 로컬 개발 작업 수행
Codex = 코드 수정, 테스트, 오류 수정, 로그 기록 담당
Codex = Obsidian 동기화 담당
Claude = 보조 분석, 설계 검토, 위험 요소 점검, 대안 제시 담당
Discord = 사용자 명령 입력 및 피드백 인터페이스
Whisper = 음성 명령을 텍스트 명령으로 변환
Obsidian = 개발 로그, 명령 기록, 승인 이력, 결과 문서 저장소
LLM Wiki = 장기 상태관리, 세션 절감, 다음 세션 handoff 저장소
모든 자동 실행은 allowlist 기반으로 제한
위험 작업은 반드시 사용자 승인 후 실행
불필요한 컨텍스트 누적 금지
장문 설명 금지
실제 구현 가능한 구조 우선
과도한 자동화 금지
로컬 PC 보안 우선
다음 세션에도 이어받을 수 있는 handoff 구조 포함

너의 해야 할 일:

현재 요청을 실제 개발 가능한 프로젝트 단위로 재정의한다.
Discord 기반 음성 개발 제어 시스템의 전체 구조를 설계한다.
Whisper 음성 인식 봇의 역할과 처리 흐름을 설계한다.
Codex 제어 봇의 역할과 실행 흐름을 설계한다.
Claude 보조 분석 봇의 역할과 연동 흐름을 설계한다.
Discord 채널 구조를 설계한다.
음성 명령 → 텍스트 변환 → 명령 분류 → 위험도 판단 → 실행 또는 승인 요청 흐름을 설계한다.
Codex가 수행 가능한 로컬 개발 명령 allowlist를 정의한다.
금지해야 할 위험 명령 blocklist를 정의한다.
Obsidian 동기화 폴더 구조와 기록 규칙을 설계한다.
LLM Wiki 문서 구조와 상태관리 규칙을 설계한다.
MVP 개발 순서를 정의한다.
테스트 및 검증 루프를 정의한다.
실패 시 롤백·중단·재시도 흐름을 포함한다.
실제 개발 착수용 작업지시서 형태로 정리한다.

반드시 아래 순서로만 출력하라.

프로젝트 한 줄 정의
전체 시스템 구조
Discord 채널 구조
Whisper 음성 인식 봇 구조
Codex 제어 봇 구조
Claude 보조 분석 봇 구조
음성 명령 처리 흐름
로컬 개발 제어 흐름
사용자 승인 흐름
Obsidian 동기화 구조
LLM Wiki 기록 구조
파일 및 폴더 구조
Allowlist 명령
Blocklist 명령
MVP 구현 순서
테스트 및 검증 기준
실패 시 되돌림 흐름
다음 세션 handoff 구조
실제 착수용 작업지시서

세부 규칙:

표 사용 금지
항목형 구조만 사용
설명보다 실행 구조 중심으로 작성
실제 개발 가능한 수준으로 작성
각 봇의 역할이 중복되지 않게 분리
입력 / 처리 / 출력 / 연결 대상을 각각 명시
보안상 위험한 명령은 자동 실행 금지
파일 삭제, Git push, 배포, 환경변수 변경, 외부 전송, 결제 관련 명령은 반드시 사용자 승인 후 실행
음성 명령은 Whisper 변환 후 즉시 실행하지 말고 반드시 명령 해석 단계를 거친다
명령 오인식 가능성이 있는 경우 재확인 단계를 둔다
Discord에는 요약 피드백만 출력한다
전체 로그는 Obsidian에 저장한다
세션 상태는 LLM Wiki에 저장한다
컨텍스트가 길어질 경우 전체 대화가 아니라 요약 상태 문서만 참조한다
Claude는 직접 실행하지 않고 분석·검토·대안 제시만 담당한다
Codex는 실행 전 위험도를 판단하고 필요 시 사용자 승인을 요청한다
개발 중 생성되는 모든 주요 결정은 decision-log에 기록한다
검증 결과는 validation-log에 기록한다
다음 작업을 이어받을 수 있도록 handoff-prompt를 자동 갱신하는 구조를 포함한다

LLM Wiki 고정 문서 구조:

/llm-wiki/project-overview.md
/llm-wiki/agent-registry.md
/llm-wiki/current-state.md
/llm-wiki/decision-log.md
/llm-wiki/validation-log.md
/llm-wiki/handoff-prompt.md

Obsidian 고정 저장 구조:

/obsidian/dev-logs/
/obsidian/voice-commands/
/obsidian/codex-results/
/obsidian/claude-analysis/
/obsidian/approval-history/
/obsidian/error-logs/
/obsidian/handoff/

MVP 기준:

1단계: Discord 텍스트 명령으로 Codex 작업 요청
2단계: 명령 로그를 Obsidian에 저장
3단계: Whisper 음성 인식으로 텍스트 명령 변환
4단계: 명령 위험도 분류
5단계: 안전 명령만 Codex가 실행
6단계: 위험 명령은 Discord에서 사용자 승인 요청
7단계: Claude 보조 분석 결과를 Discord에 요약 출력
8단계: LLM Wiki에 현재 상태와 handoff 문서 저장

필수 음성 명령 예시:

“작업 시작”
“현재 상태 알려줘”
“진행 상황 보고”
“검증해”
“Claude에게 분석 요청”
“Codex 실행”
“승인”
“보류”
“중단”
“다시 시작”
“오류 로그 보여줘”
“Obsidian에 저장”
“다음 세션용 인계문 작성”

차단할 요소:

완전 자율 실행 구조
승인 없는 Git push
승인 없는 배포
승인 없는 파일 삭제
승인 없는 환경변수 수정
승인 없는 외부 API 키 노출
승인 없는 외부 전송
Discord 봇에 과도한 관리자 권한 부여
음성 인식 결과 즉시 실행
전체 대화 로그 무제한 누적
Obsidian과 LLM Wiki의 중복 기록
Claude와 Codex의 역할 중복
사용자가 이해하기 어려운 과도한 구조화

최종 출력은
“다음 단계에서 바로 구현 가능한 수준의 개발계획과 작업지시서”
기준으로 작성하라.

출력 규칙:

프롬프트 외 설명 금지
서론 금지
변명 금지
실제 구현 가능한 구조만 작성
불명확한 부분은 가장 안전하고 단순한 방식으로 가정하여 작성
마지막에는 Codex가 바로 착수할 수 있는 작업 순서를 포함할 것