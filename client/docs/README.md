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
