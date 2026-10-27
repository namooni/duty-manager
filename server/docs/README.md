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
규칙 버전·발생 건 등 목표 모델과 DB는 아직 구현 전이다. 실제 DB는 src/main/resources/db/migration의 V1~V3를 따른다. 신규 실행일·자동 순환의 현행 구현은 아래 보충 문서를 따른다.

## 현재 구현 보충

[실행일과 자동 담당 순환](architecture/automatic-duties.md)을 현재 구현 기준으로 확인한다. 기존 목표 설계의 수동 확정·checkpoint·18개 테이블이 전부 구현되었다는 의미는 아니다.
