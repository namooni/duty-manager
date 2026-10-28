# Duty Manager

- Business logic and form state transitions belong in feature hooks under `client/src/hooks`.
- Pages and UI components render hook results and connect events to hook handlers.
- HTTP transport belongs in `client/src/apis`; hooks call repositories, never API modules directly.
- The Java server is authoritative for recurrence, assignment, validation and history.
- Keep execution dates separate from rotation periods. Creation requires an explicit assignment window, separately from the optional duty operating end. Queries never create assignments. Preview and confirm extensions from duty details; continue the existing rotation and preserve saved/manual assignments.
- Preserve the meeting sequence and assignee when an explicitly scheduled meeting date changes.
- Preserve confirmed assignments when rules change. Never silently rebuild published schedules.
- Keep mail and Pepper integration out of the initial implementation.
- Never commit credentials or deploy without an explicit deployment request.

## Core coding principles

- 공통 코드 재사용과 철저한 관심사 분리를 코드 작성의 최우선 기준으로 삼는다.
- 같은 로직을 두 번 이상 사용하거나 새 중복을 발견하면 반드시 공통화 가능성을 검토한다. 기존 공통 구현을 먼저 찾고, 의미와 변경 이유가 같은 로직은 적절한 공통 함수·컴포넌트·훅·서비스로 추출한다.
- 공통화하지 않는 경우에는 책임이나 변경 이유가 서로 다른지 근거를 명확히 한다. 코드 모양이 비슷하다는 이유만으로 독립된 책임을 결합하지 않는다.
- 공통화 범위는 기능 내부부터 판단하고, 여러 기능이 실제로 공유하는 책임을 상위 공통 계층으로 옮긴다. 공통 코드도 역할을 좁게 유지하고 입출력·의존성을 명시한다.
- 프론트는 UI·업무 훅·Repository·HTTP·전역 UI 상태의 책임을 분리한다. 서버는 Controller·Service·Repository·Mapper·계산 엔진·오류 처리의 책임을 분리한다.
- 공통화로 계층을 우회하거나 공통 유틸에 기능별 업무 로직을 집중시키지 않는다. 같은 SQL을 JDBC와 MyBatis 양쪽에 중복 구현하지 않는다.
- 작업 완료 전 중복 로직, 공통 코드 재사용, 계층 간 의존성을 확인한다. 공통 코드 변경 시 모든 사용처의 동작과 관련 문서 영향을 함께 점검한다.

## Frontend rules

- 시각 디자인은 [Neutral Workplace 정책](client/docs/policies/design-system.md)을 우선하며, 컴포넌트 사용은 [카탈로그](client/docs/architecture/design-system.md)를 따른다. Tailwind 예시는 참고용이고 구현은 styled-components를 유지한다.

- 작업 완료 시 AGENTS.md와 관련 docs의 영향을 확인하고, 구현과 어긋나는 문서는 같은 작업에서 갱신한다.
- UI는 `client/src/components/ui/`의 디자인 시스템을 우선 사용한다. 텍스트는 Text, 버튼은 Button/BaseButton, 입력은 Input/Select/Textarea/Checkbox, 레이아웃은 Flex를 사용한다.
- raw interactive 요소는 디자인 시스템의 기반 컴포넌트를 구현하는 경우에만 허용한다. 화면에서 별도 styled.button/input/a를 만들지 않는다.
- styled.div는 grid·scroll 영역처럼 Flex로 표현하기 부적합한 경우에만 사용한다.
- 공통으로 재사용할 UI를 추가·변경하면 [디자인 시스템 카탈로그](client/docs/architecture/design-system.md)도 갱신한다.
- 일본어 UI·오류 메시지와 Asia/Tokyo 날짜 기준을 유지한다.
- styled-components의 커스텀 스타일 props는 transient props(`$prop`) 또는 명시적인 shouldForwardProp으로 DOM 전달을 차단한다.
- 도메인 타입은 readonly, 선택값은 const 객체 + 파생 union으로 정의한다. enum은 사용하지 않는다.

## Frontend architecture

```text
Page → custom hook → repository → domain API → apiClient → Java server
```

- `apis/<domain>/<domain>.api.ts`: Axios 호출, raw DTO 반환.
- `repositories/<domain>/`: *.repository.ts, *.dto.ts, *.domain.ts, *.mapper.ts. DTO↔Domain 변환과 데이터 조립.
- `hooks/<domain>/`: 조회·취소·재조회·검증·집계·폼 상태·업무 후 이동.
- `stores/<domain>/*.store.ts`: Zustand로 전역 UI 상태만 보관. 서버 데이터는 훅에서 관리.
- `router/index.tsx`: createHashRouter 경로 설정. 정적 호스팅에서 별도 rewrite 없이 새로고침 가능.
- `pages/<domain>/`: 경로 단위 화면.
- `components/ui/`: 디자인 시스템.
- `components/layouts/`: CommonLayout(사이드바 + Outlet), 페이지 공통 헤더.
- `components/<feature>/`: 기능별 UI.
- `utils/`: 순수 함수만. 입력→출력, 네트워크·스토리지·현재 시각·DOM 접근 없음.
- `libs/`: 외부 연동·인프라. 현재 시각, SDK, 타이머, DOM, 스토리지 등.
- `styles/`: 테마·전역 스타일, `constants/`: 라벨·상수, `config/`: 환경 설정.
- TanStack Query는 도입하지 않는다. 전역 상태를 위한 React Context provider도 추가하지 않는다. ThemeProvider는 스타일 주입 용도다.
- UI는 API·repository를 직접 호출하지 않는다. 순수 포맷팅과 포커스·dialog 키보드 처리 등 시각적 동작은 UI에서 처리할 수 있다.

## Server architecture

- 기존 chokokane-server와 같은 계층 → 기능 패키지 배치를 따른다: controller, service, dto, model, repository, mapper, engine, exception, config, common.
- Controller는 Service만 호출하고, Service는 Repository 인터페이스에 의존한다.
- 요청/응답 DTO와 내부 모델·명령을 분리한다. SQL은 Service·Controller에 두지 않는다.
- 단순 SQL은 Spring JdbcTemplate, 복합 조회는 MyBatis XML을 기준으로 선택하고 동일 SQL을 중복 구현하지 않는다.
- JDBC/MyBatis는 하나의 DataSource와 Spring transaction manager를 공유한다. Mapper를 Service에 직접 주입하지 않는다.
- MyBatis localCacheScope=STATEMENT, cacheEnabled=false, SIMPLE executor를 유지한다.
- [현재 서버 구조](server/docs/architecture/server-structure.md)와 [혼용 정책](server/docs/architecture/data-access.md)을 따른다.

## Product policy and design

- 구현 전에 [공통 업무 정책](docs/policies/duty-policy.md), [UI 정책](client/docs/policies/ui-policy.md), [서버 설계](server/docs/README.md)를 확인한다.
- 회사 휴일에는 업무가 발생하지 않으며 달력 기준 담당 교대는 유지한다. 자동 보충·자동 이월하지 않는다.
- 교차 업무 중복은 기본 허용+경고이며 어느 한 업무라도 FORBID이면 차단한다.
- 목표 설계의 테이블·API가 현재 구현된 것처럼 문서나 코드 설명에서 표현하지 않는다.

## Documentation layout

- `client/docs/README.md`: 클라이언트 문서 인덱스.
- `client/docs/architecture/*.md`: 클라이언트 계층·디자인 시스템·API 계약.
- docs/README.md: 정책·설계 문서 인덱스.
- docs/policies/*.md: UI와 서버가 공유하는 업무 정책.
- docs/plans/*.md: 현재/목표 차이·구현 순서·인수 기준.
- client/docs/policies/*.md: 화면·입력·동작·접근성 정책.
- server/docs/README.md, server/docs/design/*.md: 서버 자료구조·목표 API·DB 정책.
- server/docs/architecture/*.md: 현재 패키지·계층·데이터 접근 기준.
- docs/architecture.md: 모노레포·서버·인프라·향후 연동.
- `README.md`: 프로젝트 실행·테스트 안내.
- 현재 구현 설명은 실제 파일과 도입한 기술에 맞춘다. 미구현 설계는 상태를 목표 설계/기준안으로 명시하고 현재 구현과의 차이를 적는다. 새 문서는 .md 확장자를 사용하고 위 위치에 배치한다.

- Current participant removal offers finish-current-period or hand over immediately from today. Keep roster membership separate from current confirmed ownership, preserve assignments before today and rotation boundaries, and consume handover recipients in the next automatic queue only after reviewed confirmation. Do not introduce general period editing or ad hoc daily substitution.

Current calendar assignment changes from schedule/home must use the same reviewed handover and automatic-queue advancement as participant editing. Preserve yesterday and earlier; roster removal is not required. The single-slot replacement endpoint must not bypass this workflow.

Rejoining an excluded original owner during the same calendar period restores that owner from today, restores their position before the handover recipient, and returns the displaced recipient to the next automatic turn. Show the restoration in the shared review; preserve earlier days and protected assignments. Do not restore expired periods.

Excel exports must reuse the authoritative saved schedule, preserve actual execution dates, handover segments and undated meetings, and never allocate or mutate assignments. Share workbook styles and binary transport/error handling across layouts.
