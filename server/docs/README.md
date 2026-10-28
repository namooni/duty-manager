# 서버 설계 문서

상위 [AGENTS.md](../../AGENTS.md)와 [공통 정책](../../docs/policies/duty-policy.md)을 따른다.

- [현재 서버 패키지·계층 구조](architecture/server-structure.md)
- [JDBC · MyBatis 혼용 정책](architecture/data-access.md)
- [도메인 자료구조·상태 전이](design/domain-model.md)
- [목표 API 계약](design/api-contract.md)
- [DB 정책·논리 스키마](design/database-policy.md)
- [구현 단계와 검증 기준](../../docs/plans/implementation-roadmap.md)

architecture 문서는 현재 구현, design 문서는 다음 업무 기능의 목표 설계다.
현재 코드는 계층/기능별 Controller·Service·DTO·Model·Repository로 분리되어 있으며 JDBC/MyBatis를 혼용한다.
담당 규칙 버전과 복원·변경 이력은 V4로 구현했다. 목표 모델 전체를 도입한 것은 아니다. 실제 DB는 src/main/resources/db/migration의 V1~V7를 따른다. 신규 실행일·자동 순환의 현행 구현은 아래 보충 문서를 따른다.

## 현재 구현 보충

[실행일과 자동 담당 순환](architecture/automatic-duties.md)을 현재 구현 기준으로 확인한다. 기존 목표 설계의 수동 확정·checkpoint·18개 테이블이 전부 구현되었다는 의미는 아니다.

[담당 변경·복원 구현 명세](../../docs/policies/assignment-change-implementation.md)를 현재 API·DB·제약 기준으로 확인한다.

[운영 기간·담당 배정 범위 정책](../../docs/policies/allocation-window-policy.md): 명시적 생성 범위와 조회 시 저장 금지, 검토 후 기간 연장. 기존 자동 연속 생성 설명은 이 정책으로 대체한다.

[일정 상태·날짜 변경 정책](../../docs/policies/schedule-date-policy.md): 미래 개최일 검토와 과거 이력 표시. 주·월 담당 기간 변경은 제공하지 않는다.

[현재 담당 유지·인계 정책](../../docs/policies/current-assignment-handover.md): 참여자 제외 시 현재 담당 처리와 확정 즉시 오늘부터의 인계.

[Excel 내보내기 정책](../../docs/policies/excel-export-policy.md): 공통 일정 조회를 사용하는 xlsx 출력 API와 템플릿.
