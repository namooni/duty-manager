# Spring JDBC · MyBatis 혼용 정책

현재 코드에 적용한 기준이다. 미래 규칙/DB 정책 자체를 구현했다는 뜻은 아니다.
패키지는 [서버 구조](server-structure.md)를 따른다.

## 1. 선택 기준

MyBatis도 JDBC 기반이다. 여기서 'JDBC'는 직접 DriverManager를 쓰는 방식이 아닌 Spring JdbcTemplate을 뜻한다.
복잡도는 SQL을 어디서 관리하면 읽고 고치기 쉬운지의 기준이다. 단순/복잡에 따라 자동으로 성능 우열이 생긴다고 가정하지 않는다.

| 경우                                  | 기본 선택               | 현재 적용                           |
| ------------------------------------- | ----------------------- | ----------------------------------- |
| 단순 등록·상태 갱신·짧은 고정 SQL     | JdbcTemplate            | 직원·업무·제외 CRUD, 배정/이력 저장 |
| 여러 테이블 join·복합 조회 projection | MyBatis XML             | 배정 목록·단건·변경 이력            |
| 조건 조합이 많아지는 검색·집계        | MyBatis 우선 검토       | 해당 기능을 추가할 때 선택          |
| 대량 쓰기                             | 측정 후 batch 방식 결정 | 현재 SIMPLE executor, batch 미도입  |

복잡한 SQL도 JDBC로 실행할 수 있고, 단순 CRUD도 MyBatis로 구현할 수 있다.
한 기능의 동일 SQL을 양쪽에 중복해서 만들거나 SQL 길이에 따라 Service에서 분기하지 않는다.

## 2. 혼용 위치

Service에는 AssignmentRepository 인터페이스 하나만 주입한다.
현재 SqlAssignmentRepository 내부에서 MyBatis 조회와 JDBC 쓰기를 조합한다.

```text
AssignmentService
  → AssignmentRepository
      → SqlAssignmentRepository
          ├─ AssignmentMapper → XML (조회)
          └─ JdbcTemplate / JdbcInsertSupport (쓰기)
```

직원은 EmployeeRepository → JdbcEmployeeRepository다.
같은 인터페이스의 JDBC/MyBatis 구현 두 개를 동시에 bean으로 등록해 호출자가 골라야 하는 구조를 기본으로 하지 않는다.
다른 구현이 필요한 경우 bean 선택 기준을 명시한다.

## 3. 같은 트랜잭션으로 묶는 조건

- JdbcTemplate, MyBatis SqlSessionFactory, transaction manager가 같은 DataSource bean을 사용한다.
- config/DataAccessConfig가 단일 JdbcTransactionManager를 등록한다.
- MyBatis는 Spring이 주입한 Mapper와 SqlSessionTemplate을 통해 실행한다.
- 업무 쓰기는 Service의 @Transactional을 경계로 한다.
- 별도 Connection/openSession, 수동 commit/rollback, 다른 transaction manager를 섞지 않는다.
- 하나의 원자 작업 안에서 임의의 비동기 실행이나 REQUIRES_NEW로 경계를 나누지 않는다.

MyBatis-Spring은 Spring transaction에 참여하며 transaction manager와 SqlSessionFactory가 같은 DataSource를 사용해야 한다.
[공식 트랜잭션 문서](https://mybatis.org/spring/transactions.html)

예를 들어 대타 변경의 조회는 MyBatis, 담당자 갱신과 이력 저장은 JDBC여도 같은 Service transaction에 묶인다.
실패 시 전체 rollback된다. 잠금 범위·업무 검증은 사용 기술과 무관하게 Service가 책임진다.

## 4. 혼용 시 조회 캐시

JDBC 수정은 MyBatis의 조회 캐시에 변경 사실을 알려주지 않으므로 다음을 명시한다.

```yaml
mybatis:
  mapper-locations: classpath*:mapper/**/*.xml
  configuration:
    local-cache-scope: STATEMENT
    cache-enabled: false
    default-executor-type: SIMPLE
```

- localCacheScope=STATEMENT는 서로 다른 statement 호출 사이의 1차 캐시 결과 재사용을 제한한다.
- cacheEnabled=false는 Mapper 2차 캐시를 사용하지 않게 한다. XML에도 cache를 추가하지 않는다.
- 현재 batch executor는 쓰지 않는다. 향후 batch를 도입하면 실행/flush 시점을 별도로 설계한다.
- 이 설정이 DB 격리 수준·외부 transaction의 변경 가시성을 대신하지는 않는다.

[MyBatis 설정](https://mybatis.org/mybatis-3/configuration.html), [Spring 관리 SqlSession](https://mybatis.org/spring/sqlsession.html)

## 5. 매핑·오류·검증

- JDBC row mapping은 Repository 내부에 둔다. MyBatis SQL은 resources/mapper/<feature>에 둔다.
- Mapper는 service/model을 바꾸지 않는 persistence row를 반환할 수 있다.
  현재 AssignmentChangeRow는 기존 changedAt 응답 형식을 유지하기 위한 Timestamp 변환을 담당한다.
- Repository는 요청 DTO를 받지 않고 내부 모델/명령을 받는다.
- SQL 결과에서 도메인 객체를 만들고, Controller가 Response DTO로 바꾼다.
- Spring DataAccessException과 무결성 충돌은 예외 처리 계층에서 기존 API 오류로 변환한다.
- MyBatis가 조회한 직후 JDBC 수정 → 같은 MyBatis 재조회, 중간 실패 rollback을 통합 테스트한다.
- 로컬 H2와 CI MySQL을 구분한다. 실제 MySQL의 SQL·잠금·시간대 검증을 생략하지 않는다.
