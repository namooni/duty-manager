# 실행 일정과 자동 담당 순환 — 현재 구현

이 문서는 현재 코드 기준이다. [목표 모델](../design/domain-model.md)의 전체 버전·감사·멱등성 모델이 모두 구현된 것은 아니다.

## 모델과 정책

- DutyDefinition/Duty: 업무명·참가자·담당 인원·시작일·달력 교대 간격·배정 방법·randomSeed.
- ScheduleRule: 실행 규칙과 교대 방식. 실행일은 WORKDAYS, WEEKLY, DAILY_INTERVAL, MONTHLY_DAY, MONTHLY_NTH_WEEKDAY, EXPLICIT_DATES; 교대는 CALENDAR 또는 OCCURRENCE.
- Meeting: 업무별 불변 sequence와 nullable date. 날짜 변경은 sequence를 바꾸지 않는다. 개별 개최일은 OCCURRENCE만 허용한다. 이후 회차는 다음 미정 회차에 날짜를 넣어 추가한다.
- RotationTurn: 담당 순번 단위. C:index는 달력 기간, E:index는 실행 회차다. 실제 개최일과 분리된 키이므로 날짜 변경·대타로 이후 순번을 밀지 않는다.
- WorkOccurrence: 실제 실행일과 담당 기간/담당자 연결. 회차 교대는 하루짜리 실행일로 표시한다. 미정 개최회차는 날짜가 null이다.

미리보기는 max(ceil(참가자 수 / 동시 담당 인원), 등록된 개최일 수, 요청한 표시 회차 수)회다. 랜덤은 고정 seed와 라운드 번호로 재현하며, 기존 AssignmentEngine과 신규 AutomaticEngine 모두 RotationAllocator를 공유한다. 한 회차 내 중복을 피하며, 라운드 경계에서는 한 바퀴 예시에 다음 라운드 일부가 포함될 수 있다.

최초 순환 담당은 생성 시 저장한다. 이후 스케줄 요청은 시작일부터 순번을 계산하되 이미 저장된 슬롯은 변경하지 않고 새 슬롯만 예약한다. 업무별 SELECT FOR UPDATE와 DB UNIQUE가 중복 예약을 막는다. 이 예약을 수반하므로 스케줄 조회 API는 POST다. UI 사용자가 기간별 확정을 반복할 필요는 없다.

회사 휴일에는 실행하지 않으며 달력 교대 경계와 기존 회차 키는 유지한다. 휴일은 실행 없음 상태로 표시한다. 근무일 기본은 월~금이다. 고정 월일/제5요일이 없는 달은 실행을 생성하지 않고, 월말/최종 요일은 별도로 선택할 수 있다. 개별 개최일 수정은 오늘 이후·담당 시작일 이후·앞뒤 회차 날짜 순서를 지켜야 한다. 과거 담당 기간 대타는 차단한다.

## 계층과 공통 코드

- AutomaticDutyService: 생성 입력 검증, 전체 순환 미리보기, 시작 트랜잭션, 설정 목록.
- LiveScheduleService: 실행일·기간 연결, 새 슬롯 예약, 동일 일자 교차 업무 중복 경고.
- MeetingScheduleService: 개별 개최일 등록·변경, 기존 담당의 대상외 기간 검사.
- RotationSlotService: 대타 적격성 검증, 사유·변경 이력.
- CompanyCalendarService: 회사 휴일 목록·등록·해제.
- ScheduleAccess: 업무·규칙 존재 확인과 잠금, 회사 휴일 집합.
- OccurrenceEngine / AutomaticEngine / RotationAllocator: DB·현재 시각에 의존하지 않는 계산.
- ScheduleRepository: 저장 기술을 숨기는 인터페이스. SqlScheduleRepository는 단순 JDBC와 복합 이력용 MyBatis ScheduleMapper를 하나의 DataSource/transaction manager에서 사용한다.
- 공통 Checks.require는 기존 DutyService·PlanningService와 신규 서비스가 공유한다. 프론트는 useExclusiveAction으로 중복 요청 잠금·오류·언마운트 처리를 공유한다.

## DB 변경 및 보존

V1/V2는 수정하지 않는다. V3__separate_occurrences_and_rotation.sql이 아래 5개 테이블을 추가한다.

| 테이블                | 역할                             | 키                                                        |
| --------------------- | -------------------------------- | --------------------------------------------------------- |
| duty_schedules        | 실행일 규칙과 교대 방식          | duty_id                                                   |
| duty_meetings         | 개별 개최일과 회차 순서          | duty_id, sequence_index                                   |
| duty_rotation_slots   | 저장된 담당자와 담당 기간        | id, UNIQUE(duty_id, rotation_key, slot_index/employee_id) |
| duty_rotation_changes | 대타 사유·이전/새 담당·변경 시각 | id, rotation_slot_id                                      |
| company_holidays      | 회사 휴일 날짜·명칭              | holiday_date                                              |

기존 duties/assignments/assignment_changes는 보존한다. 기존 업무의 월 단위 담당 기간만으로 실제 정례회 날짜를 추측하지 않는다. 이전 데이터는 이전 형식 목록에서 확인하며 신규 실행일 모델로 자동 backfill하지 않는다. 실제 운영 이관·규칙 편집은 명시적 적용일과 보존 정책을 설계한 뒤 별도 구현한다.

## 검증과 현재 한계

자동 순환, 5명 전체 미리보기, 개별 미정일, 날짜 변경 후 담당 유지, 회사 휴일 주간 교대, 랜덤 재현, 대타 이력, 월말·없는 월일·제N요일·3일 간격을 검증한다. 기존 API·JDBC/MyBatis 회귀 테스트도 유지한다. 로컬 기본 DB 통합 검증은 H2 MySQL 모드이며 실제 MySQL 검증과 구분한다.

규칙/참여자 버전 편집, 날짜별 직원 재직 상태, 저장 전 멱등 키·preview 만료, 개별 실행 취소·감사 사유, 근무 요일 회사별 설정, FORBID 강제 차단, 스케줄별 과거 담당 snapshot은 미구현이다. 현재 대타는 기간 슬롯 전체에 적용된다. 이미 저장한 슬롯은 휴일/직원 상태 변경으로 자동 재배정하지 않는다. 신규 실행일 상한 계산은 100,000일, 달력 교대는 시작일부터 최대 4,000기간, 단일 조회 범위는 최대 367일이다.

미리보기 회차 수는 참가자 수로 제한하지 않는다. 최소 전체 한 바퀴와 등록된 개별 개최일 전체를 포함하며, 추가로 previewCount(최대 200회)를 지정할 수 있다. 예를 들어 5명·12개 개최일이면 12회 모두 1→2→3→4→5→1 순서로 계산한다. 미리보기 회차 수를 늘려도 seed와 기존 순번은 유지되며 업무 종료 횟수를 뜻하지 않는다.
