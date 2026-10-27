# 서버 패키지·계층 구조

현재 구조는 기존 chokokane-server의 '계층 → 기능' 배치를 따른다.
규칙 버전·발생 건 등 다음 단계 모델은 [설계 문서](../design/domain-model.md)에 있으며 아직 구현 전이다.

## 패키지

```text
com.dutymanager/
  DutyManagerApplication
  controller/{employee,duty,planning,assignment,system}
  service/{employee,duty,planning,assignment,system}
  dto/{common,employee,duty,planning,assignment,system}
  model/{employee,duty,planning,assignment,system}
  repository/{employee,duty,assignment}
  mapper/assignment
  engine/rotation
  exception
  config
  common/{jdbc,time}
resources/
  mapper/assignment/AssignmentMapper.xml
  db/migration/
```

controller는 HTTP 수신·입력 검증·응답 변환을 맡고 Service만 호출한다.
Service는 업무 검증·트랜잭션·순수 계산기 호출을 조정하고 Repository 인터페이스에 의존한다.
Repository 구현은 JDBC/MyBatis 선택과 SQL 실행·row 매핑을 숨긴다.

```text
Controller → Service → Repository interface → JDBC 구현
                                          └→ SQL 구현 → MyBatis Mapper → XML
                   └→ engine (순수 계산)
```

## 역할

| 계층       | 책임                                             | 두지 않는 것                               |
| ---------- | ------------------------------------------------ | ------------------------------------------ |
| controller | Request DTO, @Valid, 상태코드, Response DTO 변환 | 직접 Repository/Mapper/JdbcTemplate 호출   |
| service    | 업무 결정·조회 조립·쓰기 transaction             | SQL, HTTP ResponseEntity, Mapper 직접 호출 |
| dto        | 외부 요청·응답 계약과 명시적 변환                | 배정 알고리즘·DB 연결                      |
| model      | 내부 모델·명령·값 객체                           | HTTP validation annotation, DB 접근        |
| repository | 저장/조회 계약과 기술별 구현                     | 웹 예외·화면 동작                          |
| mapper     | MyBatis 인터페이스·조회 row 매핑                 | 업무 결정·트랜잭션 commit                  |
| engine     | 반복·순환 계산, 적격 결과                        | DB·HTTP·현재 시각 조회                     |
| exception  | 업무 예외와 HTTP 변환                            | SQL 실행                                   |
| config     | Clock·Mapper scan·공유 transaction manager       | 업무 정책                                  |
| common     | 재사용 JDBC key 생성·순수 날짜 범위 검증         | 기능별 거대 helper                         |

## 현재 서비스

- EmployeeService: 직원 조회·생성·활성 상태 변경.
- DutyService: 업무 조회·생성, 제외 조회·추가.
- PlanningService: 미리보기·확정.
- AssignmentService: 확정 배정 조회, 대타 변경, 변경 이력.
- SystemService: 서버 기준일·시간대 조회.
- AssignmentEngine: 기존 순환 계산 유지.

요청 DTO와 내부 명령은 분리한다. 예: DutyInput → DutyDefinition.
응답은 DutyResponse.from(Duty)처럼 Controller 경계에서 변환한다.
현재 API의 필드명·숫자 ID·상태코드는 유지한다. 목표 API 전환과 섞어서 변경하지 않는다.

## 트랜잭션과 테스트

- 쓰기 경계는 public Service 메서드의 @Transactional.
- 조회 Service는 필요에 따라 @Transactional(readOnly=true).
- Repository와 Mapper에서 수동 commit/rollback/close를 하지 않는다.
- 설정과 혼용 기준은 [데이터 접근 정책](data-access.md)을 따른다.
- src/test/java도 controller/service/engine/repository 기능별로 나눈다.
- MixedDataAccessTest는 JDBC 수정 후 MyBatis 재조회와 혼용 경로 rollback을 확인한다.
- 실제 MySQL 검증은 기존 CI의 MySQL 테스트 단계에서 수행한다. 로컬 H2 결과와 구분한다.

## 실행일과 자동 순환

현재 신규 당번 생성은 [자동 당번 구조](automatic-duties.md)를 따른다. 기존 PlanningService의 preview/confirm은 호환용이다. controller/service/dto/model/repository/mapper 아래 schedule 기능 패키지를 추가하며, 순수 계산은 engine/schedule과 engine/rotation에 둔다.
