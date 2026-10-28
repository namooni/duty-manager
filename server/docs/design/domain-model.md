# 서버 도메인 자료구조와 처리 경계

상태: 목표 업무 자료구조 설계. 현재 기능별 model과 V1 DB를 이 문서의 모델로 대체한 구현이 아니다.
업무 의미는 [공통 정책](../../../docs/policies/duty-policy.md), 저장 제약은 [DB 정책](database-policy.md)을 따른다.

## 1. 구조 원칙

- Java 21·Spring Boot·Spring JDBC·MyBatis·MySQL·Flyway를 사용한다. ORM 변경을 전제하지 않는다.
- 기존 chokokane-server와 같은 계층 우선, 계층 안 기능별 패키지로 나눈다.
- HTTP request/response record, 도메인 객체, JDBC row 매핑을 분리한다.
- 요청 DTO를 그대로 DB 엔티티로 저장하거나 모든 자료형을 하나의 Models 클래스에 쌓지 않는다.
- Java의 도메인 선택값은 명시적인 enum/string 코드로 저장한다. ordinal을 DB에 저장하지 않는다.
- 클라이언트 타입은 readonly + const/union이다. Java enum 금지라는 뜻이 아니다.
- 컬렉션은 생성 경계에서 List.copyOf 등으로 복사한다. Date는 LocalDate, 업무 시각은 LocalTime, 기록 시각은 Instant다.
- ID는 Java Long/DB BIGINT, 목표 HTTP 계약에서는 10진 문자열이다. 대형 정수의 JavaScript 정밀도 문제를 피한다.

목표 package 예:

```text
com.dutymanager/
  controller/{company,employee,duty,planning,assignment}
  service/{company,employee,duty,planning,assignment,audit}
  dto/{company,employee,duty,planning,assignment}
  model/{company,employee,duty,planning,assignment}
  repository/{company,employee,duty,planning,assignment,audit}
  mapper/{planning,assignment}
  engine/{recurrence,rotation}
  exception/
  config/
  common/{jdbc,time,idempotency}
```

## 2. 논리 모델

아래는 필드의 의미를 정의하는 자료구조다. DTO와 DB 컬럼이 무조건 1:1인 것은 아니다.

| 모델                 | 핵심 필드                                                                                                                    | 책임                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| CompanySettings      | id=1, zoneId, workingWeekdays, closingTime?, rowVersion, planningRevision                                                    | 회사 기준일·근무 요일·계획 입력 변경 번호 |
| CalendarOverride     | date, kind=WORKDAY/HOLIDAY, label, rowVersion                                                                                | 특정 날짜의 회사 근무일 예외              |
| Employee             | id, employeeNumber, normalizedNumber, displayName, rowVersion                                                                | 직원 식별, 현재 표시 정보                 |
| EmployeeStatusPeriod | employeeId, status=ACTIVE/INACTIVE, effectiveFrom, effectiveToExclusive?                                                     | 적용일이 있는 재직/참여 가능 상태         |
| Duty                 | id, name, description, draftPayload?, rowVersion                                                                             | 업무의 고정 ID·메타데이터·편집 초안       |
| RuleVersion          | id, dutyId, versionNo, state, effectiveFrom, effectiveToExclusive?, canceledAt?, schedule, rotation, members, conflictPolicy | 운영 규칙의 불변 본문                     |
| Exclusion            | id, dutyId, employeeId, startDate, endDateInclusive, reason, canceledAt?, rowVersion                                         | 업무별 기간 제외                          |
| DutyPeriod           | id, dutyId, ruleVersionId, periodKey, ordinal, startDate, endDateExclusive, status, nameSnapshot                             | 같은 담당자가 유지되는 확정 구간          |
| PeriodAssignment     | id, periodId, slotIndex, employeeId, nameSnapshot, assignmentRevision                                                        | 기간 담당 슬롯의 현재 상태                |
| Occurrence           | id, dutyId, ruleVersionId, periodId, sourceKey, scheduledDate, effectiveDate, localTime?, status, changeReason?, rowVersion  | 실제 업무 한 건과 일정 이동               |
| OccurrenceAssignee   | occurrenceId, assignmentId, slotIndex, employeeId, nameSnapshot                                                              | 발생 건별 담당 스냅샷                     |
| RotationCheckpoint   | periodId, ruleVersionId, algorithmVersion, stateAfter                                                                        | 확정 직후의 다음 순환 상태                |
| PreviewSession       | id, dutyId?, previewKind, actorSubject, inputRevision, expiresAt, resultDigest, payload, state                               | 단기 미리보기와 명시적 확정 대상          |
| AuditEvent           | actorSubject, action, aggregateType/id, before/after, reason, occurredAt, operationId                                        | 변경 이력                                 |
| CommandResult        | operationId, commandType, aggregateId, requestHash, response, committedAt                                                    | 동일 명령의 안전한 재시도                 |

Employee에 별도 로그인 비밀번호나 가상의 이메일을 만들지 않는다.
인증 계정과 Employee 연결은 로그인 단계에서 추가하며 이름·사번을 계정 식별자로 대신 쓰지 않는다.

## 3. ScheduleRule

```text
ScheduleRule
  type: WORKDAYS | WEEKLY | DAILY_INTERVAL | MONTHLY_DAY |
        MONTHLY_NTH_WEEKDAY | EXPLICIT_DATES
  anchorDate: LocalDate?             # 간격 계산 기준. EXPLICIT_DATES는 불필요
  intervalCount: int?                # DAILY/WEEKLY/MONTHLY에 1..365
  localTime: LocalTime?              # 생략하면 날짜만 있는 업무
  holidayPolicy: COMPANY_WORKDAYS | ALLOW_ON_HOLIDAYS
  weekdays: Set<ISO weekday>?        # WEEKLY만
  monthDay: int?                     # MONTHLY_DAY만, 1..31
  missingDayPolicy: CLAMP_TO_LAST_DAY | SKIP?
  ordinalInMonth: 1..5 | LAST?        # MONTHLY_NTH_WEEKDAY만
  weekdayInMonth: ISO weekday?
  explicitDates: List<LocalDate>?     # EXPLICIT_DATES만, 오름차순·중복 없음
```

WORKDAYS의 holidayPolicy는 COMPANY_WORKDAYS만 허용한다.
서로 다른 type의 불필요한 필드는 null/비워진 집합이어야 한다. 모순된 입력은 무시하지 않고 거절한다.
목표 1차 한도는 개별 지정일 367개, 검색 범위 367일이다.
한 규칙에서 같은 날 발생 건은 최대 하나다. 하루 여러 시각 반복은 후속 기능이다.

scheduledDate는 규칙으로 얻은 원래 날짜, effectiveDate는 개별 변경 후 실제 날짜다.
sourceKey는 원래 규칙 내 발생 건을 식별하며 날짜를 이동해도 바뀌지 않는다.
회사 휴일로 생성하지 않은 미래 날짜는 '발생 없음'이며 취소 레코드를 불필요하게 저장하지 않는다.
이미 확정되어 저장된 건이 휴일 변경으로 취소되면 CANCELED 레코드를 보존한다.

## 4. RotationRule과 순환 상태

```text
RotationRule
  type: CALENDAR_INTERVAL | EACH_OCCURRENCE
  anchorDate: LocalDate?             # CALENDAR_INTERVAL만
  intervalCount: int?                # 1..365
  unit: DAY | WEEK | MONTH?
  assigneeCount: int                 # 1..20
  strategy: EMPLOYEE_NUMBER | CUSTOM | SHUFFLED_ROUND
  startingEmployeeId: EmployeeId?    # 고정 순서의 시작 후보. 랜덤은 seed로 결정
  seed: long?                       # SHUFFLED_ROUND만
  algorithmVersion: String
  initialState: RotationState

RotationState (알고리즘 버전별 직렬화)
  round: long
  remainingEmployeeIds: List<EmployeeId>
  deferredEmployeeIds: List<EmployeeId>
```

members는 employeeId, positionIndex, employeeNumberSnapshot을 갖는다.
현재 사번을 바꿔도 예전 규칙 버전의 정렬이 변하지 않는다.
순환 상태의 직원 ID는 해당 버전 members에 속해야 한다. JSON은 실행 체크포인트이지 참여자 master가 아니다.

Planner는 후보 부족을 먼저 검사하고 실패 시 순환을 소비하지 않는다.
같은 기간 내 중복 후보는 보류 큐에 보존한다. 제외 후보는 그 회차에서 건너뛰되 보상 우선순위를 만들지 않는다.
최대 후보 탐색 횟수를 입력 명단 크기에 비례해 제한하고 무한 루프 대신 위반을 반환한다.
재현 조건은 규칙 버전·algorithmVersion·seed·이전 체크포인트·날짜별 적격 정보다.
조회 시 현재 employee.active만 적용해 과거 전체를 다시 계산하지 않는다.

## 5. 상태와 파생 상태

| 대상                 | 상태·전이                                      | 규칙                                                                             |
| -------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------- |
| Duty 화면 상태       | DRAFT / SCHEDULED / ACTIVE / PAUSED / ARCHIVED | draft 존재/오늘 적용 버전에서 파생. 매일 status 컬럼을 덮어쓰는 scheduler 불필요 |
| RuleVersion.state    | ACTIVE / PAUSED / ARCHIVED                     | 새 버전으로 전이. 취소된 대기 버전은 canceledAt로 별도 제외                      |
| DutyPeriod.status    | CONFIRMED / CANCELED                           | 저장 전 미리보기는 별도 PreviewSession에만 존재                                  |
| Occurrence.status    | SCHEDULED / CANCELED                           | 미래 취소·이동만 허용. 완료 추적은 아직 없음                                     |
| PreviewSession.state | READY → USED, READY → EXPIRED                  | 만료/재사용 여부를 검증. USED도 동일 operationId 재시도는 CommandResult로 응답   |
| Exclusion            | 유효 → 취소                                    | 물리 삭제하지 않음                                                               |

개별 이동 예외는 원래 규칙의 생성 유효 구간을 넘을 수 있으나 기존 ruleVersionId와 sourceKey를 보존한다.
Occurrence의 과거/진행/미래 여부는 effectiveDate·localTime과 회사 Clock으로 계산한다.
시각이 없으면 그 날짜가 시작한 뒤 일정 이동/취소는 첫 단계에서 차단한다.
이미 끝났다는 사실을 COMPLETED 수행 확인으로 간주하지 않는다.

rule body는 불변이지만 effectiveToExclusive와 canceledAt는 타임라인 관리 메타데이터다.
변경 시 직전/이후 유효 구간과 감사 기록을 함께 조정한다. 동일 업무의 유효 버전 구간은 겹치지 않는다.
최대 한 개의 미래 대기 버전만 허용한다.

## 6. 확정 데이터와 역사 보존

- 배정은 미리보기 때 저장하지 않고 confirm에서 DutyPeriod/PeriodAssignment/Occurrence/OccurrenceAssignee/Checkpoint를 함께 저장한다.
- 업무 메타데이터의 이름·설명 변경은 rowVersion 기반으로 가능하며 순환 버전을 새로 만들지 않는다.
- 확정 당시 업무명·직원명·사번은 snapshot으로 보존하고 조회에서 현재 표시명과 구분한다.
- 기간 담당자 변경은 current 슬롯의 employeeId와 revision을 갱신한다.
- 해당 슬롯에 연결된 아직 시작하지 않은 발생 건의 담당 snapshot만 함께 갱신한다.
- 이미 지난 발생 건의 담당 snapshot과 확정 시 checkpoint는 유지한다.
- 발생 건을 다른 기간으로 옮기면 대상 기간의 슬롯과 연결하고 감사 기록을 남긴다.
- 시작한 발생 건 이동은 허용하지 않는다. 동일 업무/날짜의 다른 유효 발생 건과 충돌하면 거절한다.
- 미래 발생 건 취소는 checkpoint를 되감지 않는다.

## 7. 서비스 경계

| 서비스                            | 처리                                                 |
| --------------------------------- | ---------------------------------------------------- |
| CompanyCalendarService            | 날짜별 근무 여부, 미래 확정 건 영향 계산·명시적 반영 |
| EmployeeService                   | 직원 정보·상태 적용일, 확정 담당 영향 검사           |
| DutyRuleService                   | 초안·운영 시작·새 버전·중지·재개·종료·대기 버전 취소 |
| PlanningService                   | 미리보기 생성, 입력 snapshot과 경고/위반 조립        |
| ConfirmationService               | 최신 입력 재검증, 연속 확정, 원자 저장과 checkpoint  |
| AssignmentService                 | 대타, 제외 변경, 개별 발생 건 이동·취소              |
| AuditService / IdempotencyService | 동일 DB transaction 내 이력·명령 결과 기록           |

순수 RecurrenceCalculator와 RotationPlanner는 DB·Clock·HTTP·메일·Pepper를 호출하지 않는다.
필요한 현재 시각·근무일·참여자·기존 배정은 application service가 입력 값으로 제공한다.
공유 정책을 클라이언트에서 별도 복제해 배정 결과를 확정하지 않는다.

## 8. Preview → Confirm

1. 일관된 읽기에서 회사 planningRevision과 규칙·명단·상태·제외·기존 확정·calendar를 수집한다.
2. 마지막 checkpoint 뒤의 첫 미확정부터 요청 종료까지 계산한다. 새 규칙 경계를 만나면 해당 초기 상태로 전환한다.
3. 이미 확정된 내용은 그대로 표시하며 재배정하지 않는다.
4. 필요한 전체 연속 확정 범위와 warnings/violations를 PreviewSession에 최대 15분 저장한다.
5. confirm에서 회사 잠금 → duty 잠금 순서로 잡고, 동일 operationId 결과가 있는지 확인한다.
6. actor·만료·ruleVersion·planningRevision·대상 목록·digest를 검증한다. 최신 상태로 재계산해 불일치 시 409.
   계산 도중 시각이 지나 시작한 발생 건이 생긴 경우에도 409로 재확인을 요청하며 몰래 대상을 줄이지 않는다.
7. 전부 유효하면 모든 기간·배정·발생 건·checkpoint·감사·CommandResult를 한 transaction에 저장한다.
8. planningRevision을 증가시키고 preview를 USED로 변경한 뒤 commit한다.

미리보기의 JSON 문자열 순서나 일본어 message에 기대어 hash하지 않는다.
안정적인 필드명·ID·정렬 순서로 canonical payload를 만든다. token은 권한을 대신하지 않는다.
엄격한 교차 업무 중복은 회사 공통 잠금으로 명령들을 직렬화해 동시에 서로를 놓치지 않게 한다.

## 9. 목표 API 자료형

```java
// 목표 DTO 개념 예시. 현재 소스에 추가한 record가 아니다.
record DateRange(LocalDate startDate, LocalDate endDateExclusive) {}
record PlanWarning(String code, String message, String periodKey,
                   List<String> employeeIds, List<String> conflictingDutyIds) {}
record PlanViolation(String code, String message, String periodKey, String field) {}
record PreviewResponse(String previewId, Instant expiresAt, long inputRevision,
                       DateRange confirmationRange, List<PeriodPlan> periods,
                       List<PlanWarning> warnings, List<PlanViolation> violations) {}
```

버전 충돌은 expectedRowVersion/expectedAssignmentRevision/preview inputRevision을 각각 검증한다.
서버의 시간은 주입한 Clock으로 통일한다. DTO에서 actor나 audit 시각을 클라이언트 임의 값으로 받지 않는다.


## 규칙 변경의 우선 정책（2026-10-27）

[참가자·규칙 변경 정책](../../../docs/policies/rule-change-policy.md)을 우선한다. 적용 경계 이후 미래 자동 배정은 변경 미리보기 승인으로 갱신할 수 있고, 새 규칙도 기존의 다음 차례부터 이어간다. 조회·자동 저장을 보호 확정과 동일시해 적용일을 밀지 않는다. 과거·진행 중인 기간·수동 변경의 보호를 구분하고, 승인된 영향 전체와 규칙 버전·순환 상태·변경 전후 이력을 한 트랜잭션으로 반영하도록 설계한다. 현재 규칙 편집 API·버전 저장·보호 구분은 미구현이며, 새 필드·API·마이그레이션은 미합의 항목을 결정한 후 정의한다. 기존 확정 불변 원칙은 일반 조회·자동 갱신에 유지하며, 이번 명시적 규칙 변경 승인만 구분한다.

신규 참가자의 합류 위치도 합의되었다. 사번순·지정순은 기존 다음 후보의 기준점과 새 명단 순서를 함께 유지한다. 랜덤은 적용 경계의 현재 한 바퀴 잔여 큐에서 제외자를 제거하고 신규자를 뒤에 추가한다. 조회로 미리 저장된 후속 라운드 전체를 현재 잔여 큐로 취급하지 않는다. 이 의미를 표현할 순환 상태·버전 연결 자료형은 후속 구현에서 정의한다.
