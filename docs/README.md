# 설계·정책 문서

기준일: 2026-10-26. 이 문서 묶음은 목표 업무 정책·자료구조 설계다. 현재 서버 계층 구조와 데이터 접근 구현은 서버 architecture 문서에서 별도로 설명한다.

## 읽는 순서

1. [공통 업무·배정 정책](policies/duty-policy.md): 용어, 휴일, 교대, 제외, 중복, 변경·확정의 기준.
2. [UI 정책](../client/docs/policies/ui-policy.md): 화면과 조작, 입력·확인·오류·권한.
3. [서버 도메인 모델](../server/docs/design/domain-model.md): 자료구조와 상태 전이, 계산·트랜잭션 경계.
4. [목표 API 계약](../server/docs/design/api-contract.md): 요청·응답·충돌·재시도.
5. [DB 정책·논리 스키마](../server/docs/design/database-policy.md): 테이블, 제약, 잠금, 시간·이력·마이그레이션.
6. [구현 순서·검증 시나리오](plans/implementation-roadmap.md): 현재 코드와의 차이와 완료 기준.

[현재 서버 구조](../server/docs/architecture/server-structure.md)와 [JDBC/MyBatis 기준](../server/docs/architecture/data-access.md)도 참고한다.

기존 [전체 아키텍처](architecture.md)와 [클라이언트 개발 문서](../client/docs/README.md)는 현재 구현 설명이다.

## 상태와 우선순위

- **사용자 합의**: 일본어 서비스, Asia/Tokyo, 업무별 커스텀 주기·대상·순서, 기본 중복 허용+경고/업무별 금지 선택, 휴일 발생 제외/주간 교대 유지.
- **이번 설계의 기준안**: 규칙 버전·연속 확정·잠금·API v2·테이블 구조 등. 구현 전 수정할 수 있으나 변경 시 연관 문서를 함께 고친다.
- **현재 구현**: 단순 N일/N주/N개월 담당 기간, 미리보기·확정, 직원 활성 상태, 제외 추가, 대타 변경.
- **설계 후 구현할 기능**: 업무 발생 일정 분리, 회사 캘린더, 규칙 버전, 중복 정책, 수정·중지·종료, 재시도 계약.
- **후속 단계**: 로그인·권한의 실제 구현, 메일·Pepper 전송, AWS 배포.

문서의 '목표' 표·JSON·테이블은 현재 API나 실제 DB에 이미 존재한다는 뜻이 아니다.
실제 스키마는 [V1](../server/src/main/resources/db/migration/V1__initial_schema.sql)부터 [V3](../server/src/main/resources/db/migration/V3__separate_occurrences_and_rotation.sql)까지의 migration이 기준이다.

공통 업무 규칙은 duty-policy.md, UI 표현은 ui-policy.md, 영속성은 database-policy.md를 기준으로 한다.
이견이 생기면 코드만 바꾸지 말고 해당 기준 문서와 연결된 API·검증 시나리오도 함께 갱신한다.

## 현재 구현 보충

[실행일과 자동 담당 순환](../server/docs/architecture/automatic-duties.md)을 현재 구현 기준으로 확인한다. 기존 목표 설계의 수동 확정·checkpoint·18개 테이블이 전부 구현되었다는 의미는 아니다.
