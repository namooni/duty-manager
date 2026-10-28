# 클라이언트 개발 문서

상위 [AGENTS.md](../../AGENTS.md)를 기본 지침으로 따른다.

- [UI 정책 — 목표 화면·입력·확정·변경](policies/ui-policy.md)
- [공통 업무 정책](../../docs/policies/duty-policy.md)
- [서버 자료구조·API·DB 설계](../../server/docs/README.md)
- [API · Repository · Hook 구조](architecture/api-hook-layer-structure.md)
- [HTTP 계약과 오류 처리](architecture/api-raw.md)
- [디자인 시스템 카탈로그](architecture/design-system.md)

React + Vite 웹앱이다. Electron renderer, IPC, 녹음/VAD, EMR, 요금제 및 토큰 갱신은 현재 프로젝트의 기능이 아니다.
TanStack Query는 사용하지 않는다. 서버 상태는 기능별 훅, 전역 UI 상태는 Zustand가 관리한다.

검증: `npm run build`, `npm run lint`, `npm test`, `npm run format:check`.

## 시각 디자인 정책

- [Neutral Workplace · Design System & UI Tone](policies/design-system.md): 색상·모서리·밀도·타이포그래피의 기준.
- [구현 컴포넌트 카탈로그](architecture/design-system.md): 실제 공통 컴포넌트와 사용 방법.
- Tailwind 설정 예시는 참고용이며 프로젝트는 styled-components를 사용한다.

[담당 변경·복원 구현 명세](../../docs/policies/assignment-change-implementation.md): 공통 검토 화면, 무효화·유효화, 미래 담당 복원의 실제 범위.

[운영 기간·담당 배정 범위 정책](../../docs/policies/allocation-window-policy.md): 명시적 생성 범위와 조회 시 저장 금지, 검토 후 기간 연장. 기존 자동 연속 생성 설명은 이 정책으로 대체한다.

[일정 상태·날짜 변경 정책](../../docs/policies/schedule-date-policy.md): 미래 개최일 검토와 과거 이력 표시. 주·월 담당 기간 변경은 제공하지 않는다.

[현재 담당 유지·인계 정책](../../docs/policies/current-assignment-handover.md): 참여자 제외 시 현재 담당 처리와 확정 즉시 오늘부터의 인계.

[Excel 내보내기 정책](../../docs/policies/excel-export-policy.md): 당번 상세 다운로드 창과 두 출력 형식.
