# 목표 API 계약

상태: 설계 기준안. 현재 실행 중인 /api API의 계약을 변경하지 않았다.
현재는 사내 공개 전 초기 개발 단계이므로 /api prefix를 유지한다.
자료형/응답 변경은 서버·클라이언트·테스트를 한 작업으로 전환한다. 별도 v2 경로와 이중 쓰기 경로는 만들지 않는다.
현재 계약과 이 문서의 목표 계약은 구현 완료 시점까지 구분한다. 외부 고정 소비자가 생기면 별도 버전 정책을 검토한다.

## 1. 공통 규칙

- JSON camelCase, UTF-8, 일본어 message. 성공 envelope success/data/meta를 강제하지 않는다.
- DB 식별자는 10진 문자열, 날짜는 YYYY-MM-DD, localTime은 HH:mm 또는 null, 기록 시각은 UTC ISO-8601 Z다.
- rowVersion·revision·인원·순번은 음이 아닌 JSON 정수이며 JavaScript 안전 정수 범위로 제한한다.
- 조회 from/to는 양 끝 포함, 최대 367일이다. 응답 담당 기간은 startDate/endDateExclusive를 명시한다.
- 목록은 {items, nextCursor}. limit 기본 100/최대 200, cursor는 서버가 만든 opaque 문자열이다.
- 상세 응답에는 rowVersion과 적용된 ruleVersionId를 필요한 위치에 제공한다.
- 수정 요청에는 expectedRowVersion 또는 expectedAssignmentRevision이 필수다.
- 모든 쓰기 명령에는 UUID Idempotency-Key를 보낸다. 같은 사용자 의도의 재시도는 같은 키·본문을 유지한다.
- 권한은 미래의 인증 principal에서 검사한다. actor·회사 ID를 요청 본문에 넣어 신뢰하지 않는다.
- 실제 인증 전 개발 모드의 audit actor는 LOCAL_DEVELOPMENT로 명확하게 구분한다.

## 2. 엔드포인트

아래 경로는 모두 목표 /api 계약이다. 현재 존재 여부는 구현 계획의 차이 표를 따른다.

| 메서드·경로                                        | 용도                                | 성공                |
| -------------------------------------------------- | ----------------------------------- | ------------------- |
| GET /company-settings                              | 회사 기준·rowVersion                | 200                 |
| PATCH /company-settings                            | 근무 요일·퇴근 시각 변경, 영향 검사 | 200                 |
| GET /calendar-overrides?from=&to=                  | 날짜별 근무/휴무                    | 200                 |
| POST /calendar-change-previews                     | 캘린더 변경 영향 미리보기           | 201                 |
| POST /calendar-changes                             | 영향 확인 후 변경·미래 발생 건 반영 | 200                 |
| GET /employees                                     | 이름·사번 검색, 상태·cursor         | 200                 |
| POST /employees                                    | 직원 등록                           | 201 {id,rowVersion} |
| PATCH /employees/{id}                              | 이름·사번 변경                      | 200                 |
| POST /employees/{id}/status-changes                | 상태 적용일과 확정 담당 검증        | 201                 |
| GET /duties                                        | 상태·검색·cursor로 목록 조회        | 200                 |
| POST /duties                                       | 업무 초안 생성                      | 201 {id,rowVersion} |
| PATCH /duties/{id}                                 | 메타데이터·아직 미운영인 초안 수정  | 200                 |
| GET /duties/{id}                                   | 메타데이터·현재/대기 버전           | 200                 |
| POST /duties/{id}/rule-versions                    | 운영 시작·규칙 변경·중지·재개·종료  | 201                 |
| GET /duties/{id}/rule-versions                     | 버전 이력                           | 200                 |
| POST /duties/{id}/rule-versions/{versionId}/cancel | 적용 대기 변경 취소                 | 200                 |
| POST /duties/{id}/previews                         | 계산과 단기 PreviewSession 생성     | 201                 |
| POST /duties/{id}/confirmations                    | 연속 구간 원자 확정                 | 201                 |
| GET /periods?from=&to=&dutyId=&employeeId=         | 확정 담당 기간과 슬롯               | 200                 |
| GET /occurrences?from=&to=&dutyId=&status=         | 실제 발생 일정                      | 200                 |
| PATCH /assignments/{id}                            | 한 슬롯 대타 변경                   | 200                 |
| GET /assignments/{id}/history                      | 대타 변경 이력                      | 200                 |
| GET /duties/{id}/exclusions                        | 업무별 제외                         | 200                 |
| POST /duties/{id}/exclusions                       | 제외 추가                           | 201                 |
| PATCH /exclusions/{id}                             | 제외 수정·영향 검증                 | 200                 |
| POST /exclusions/{id}/cancel                       | 제외 취소                           | 200                 |
| POST /occurrences/{id}/reschedule                  | 개별 미래 발생 건 이동              | 200                 |
| POST /occurrences/{id}/cancel                      | 개별 미래 발생 건 취소              | 200                 |
| GET /duties/{id}/history                           | 규칙·상태·기간 관련 감사 이력       | 200                 |

MEMBER는 공개 목록·상세·자기 담당을 읽을 수 있다.
미리보기·초안·제외 사유·직원 관리·감사 이력과 모든 쓰기는 ADMIN 전용이다.
권한별 응답 필드도 제한하며 메뉴 숨김만으로 처리하지 않는다.

## 3. 규칙 버전 생성 예

```json
{
  "expectedRowVersion": 3,
  "effectiveFrom": "2026-11-02",
  "state": "ACTIVE",
  "reason": "参加メンバー変更",
  "schedule": {
    "type": "WORKDAYS",
    "localTime": "09:00",
    "holidayPolicy": "COMPANY_WORKDAYS"
  },
  "rotation": {
    "type": "CALENDAR_INTERVAL",
    "anchorDate": "2026-11-02",
    "intervalCount": 1,
    "unit": "WEEK",
    "assigneeCount": 1,
    "strategy": "CUSTOM",
    "startingEmployeeId": "101"
  },
  "memberIds": ["101", "102", "103"],
  "conflictPolicy": "ALLOW_WITH_WARNING"
}
```

memberIds는 CUSTOM 순서를 나타낸다. EMPLOYEE_NUMBER는 서버가 정규화 사번 순서를 snapshot으로 만든다.
랜덤 seed·algorithmVersion·initialState는 서버가 생성하고 응답에 재현 정보를 제공한다.
일본어 message나 클라이언트가 보낸 랜덤 결과를 배정 근거로 저장하지 않는다.
필요하지 않은 schedule 하위 필드를 함께 보내면 VALIDATION_ERROR다.
업무명·설명은 PATCH /duties/{id}의 메타데이터이며 이 요청에 중복시키지 않는다.

## 4. 미리보기

요청:

```json
{
  "from": "2026-11-02",
  "to": "2026-11-29"
}
```

응답 구조 예:

```json
{
  "previewId": "9a9b082d-8d2d-4faf-8992-40171954ff1a",
  "expiresAt": "2026-10-26T01:15:00Z",
  "inputRevision": 14,
  "confirmationRange": {
    "startDate": "2026-11-02",
    "endDateExclusive": "2026-11-30"
  },
  "includesEarlierUnconfirmedPeriods": false,
  "periods": [
    {
      "periodKey": "rule-12:period-0",
      "ruleVersionId": "12",
      "startDate": "2026-11-02",
      "endDateExclusive": "2026-11-09",
      "confirmed": false,
      "occurrenceCount": 3,
      "assignees": [
        { "employeeId": "101", "employeeNumber": "001", "displayName": "田中" }
      ]
    }
  ],
  "warnings": [],
  "violations": [],
  "confirmable": true
}
```

위 periods는 구조 설명용 발췌다. 실제 응답은 confirmationRange에 속하는 모든 대상 기간을 빠짐없이 포함한다.
경고에는 code/message/periodKey/employeeIds/conflictingDutyIds와 충돌 기간을 제공한다.
기본 경고 코드는 OVERLAPPING_DUTIES, NO_OCCURRENCES, INCLUDES_EARLIER_UNCONFIRMED다.
기본 위반 코드는 INSUFFICIENT_MEMBERS, FORBIDDEN_OVERLAP, INVALID_EFFECTIVE_BOUNDARY, MISSING_TARGET_PERIOD다.
위반에는 code/message/field/periodKey를 제공한다.
같은 입력을 재조회해도 순환 상태를 소비하지 않는다. confirmable은 서버가 판단한다.

### 확정

```json
{
  "previewId": "9a9b082d-8d2d-4faf-8992-40171954ff1a",
  "acceptedWarningCodes": ["NO_OCCURRENCES"]
}
```

Idempotency-Key는 별도 header로 보낸다.
서버는 preview에 저장된 전체 대상 목록만 확정한다. 클라이언트가 담당자·checkpoint·일부 기간만 덮어쓸 수 없다.
acceptedWarningCodes는 현재 미리보기의 확인 가능한 경고를 모두 포함해야 한다.
상태가 바뀌어 새 경고가 생기면 자동 동의로 처리하지 않고 409로 다시 확인한다.

성공은 {confirmationId, periodIds, inputRevision}. 이번 명령 결과가 CommandResult에 저장된다.
응답을 못 받았어도 같은 키·본문으로 다시 보내면 원래 상태코드·응답을 반환한다.
키 재사용과 다른 본문은 409다. 이미 사용한 preview에 다른 키로 재확정하면 409다.

## 5. 대타·제외·발생 건 변경

대타:

```json
{
  "expectedAssignmentRevision": 2,
  "employeeId": "102",
  "reason": "出張のため今回のみ代理"
}
```

서버가 같은 기간 중복, 회사 상태, 제외, FORBID를 다시 검사한다.
진행 중 기간은 업무 시작 시각 기준 미래 OccurrenceAssignee만 변경한다.
이미 시작한 건은 응답 affectedOccurrenceIds에서 제외하고 preservedOccurrenceIds에 제공한다.

제외 수정:

```json
{
  "expectedRowVersion": 1,
  "startDate": "2026-11-10",
  "endDateInclusive": "2026-11-12",
  "reason": "休暇"
}
```

발생 건 이동:

```json
{
  "expectedRowVersion": 1,
  "effectiveDate": "2026-11-13",
  "localTime": "15:00",
  "reason": "定例会の日程変更",
  "expectedTargetPeriodId": "501"
}
```

대상 기간·담당자가 미리 본 것과 달라지면 409다. 기간을 넘나드는 이동의 담당 변화는 UI가 사전 표시한다.
EACH_OCCURRENCE는 대상 기간을 바꾸지 않으므로 expectedTargetPeriodId에 현재 기간 ID를 보낸다.
당일/과거의 변경 허용 여부는 서버 Clock과 실제 시작 시각으로 판단한다.
취소·상태 변경 명령도 expectedRowVersion과 reason을 필수로 받는다.

## 6. 캘린더 변경

calendar-change-previews는 요청 변경 목록, 예상 회사 rowVersion, 영향 기간·발생 건·취소/추가를 반환한다.
calendar-changes는 previewId와 확인한 경고 코드만 받고 최신 revision을 재검증한다.
추가 휴무는 미래 발생 건을 취소하지만 기간 담당·checkpoint는 보존한다.
휴무를 근무일로 바꾸면 기존 확정 기간에 새 발생 건을 추가할 수 있다.
이미 취소된 건을 무조건 되살리지 않는다. 수동 취소 기록은 유지하며,
해당 건이 CALENDAR_HOLIDAY 사유로만 취소된 경우에 한해 명시적 영향 목록에서 복원할 수 있다.
아직 확정되지 않은 기간은 이번 명령으로 담당자를 확정하지 않는다.

## 7. 오류 계약

목표 오류:

```json
{
  "code": "PREVIEW_STALE",
  "message": "予定が変更されました。もう一度プレビューを確認してください。",
  "detail": [],
  "requestId": "server-generated-trace-id"
}
```

detail은 [{field, code, message, relatedIds?}]이며 필드가 아닌 위반은 field=null이다.
현재 /api는 {message}만 반환한다. 목표 계약 도입 때 apiClient가 code/detail도 보존하도록 확장한다.
message 우선 표시의 호환성은 유지하되 새 필드가 이미 구현되었다고 간주하지 않는다.

| HTTP    | code 예                                              | 동작                            |
| ------- | ---------------------------------------------------- | ------------------------------- |
| 400     | VALIDATION_ERROR, INVALID_DATE_RANGE                 | 입력 수정                       |
| 401/403 | UNAUTHENTICATED, FORBIDDEN                           | 인증/권한 안내                  |
| 404     | RESOURCE_NOT_FOUND                                   | 대상 재조회                     |
| 409     | ROW_VERSION_CONFLICT, PREVIEW_STALE, PREVIEW_EXPIRED | 상태 보존·최신 내용 재확인      |
| 409     | FORBIDDEN_OVERLAP, CONFIRMED_ASSIGNMENT_CONFLICT     | 영향 기간·직원 안내             |
| 409     | IDEMPOTENCY_KEY_REUSED, PREVIEW_ALREADY_USED         | 같은 키/명령 여부 확인          |
| 422     | INSUFFICIENT_MEMBERS, INVALID_EFFECTIVE_BOUNDARY     | 업무 규칙 수정                  |
| 503     | PLANNING_BUSY                                        | 동일 키로 재시도 가능 여부 안내 |

순수 미리보기에서 인원 부족·중복 위반이 있는 것은 HTTP 201 + violations/confirmable=false로 응답한다.
확정이 최신 재검증에서 이를 만난 경우 409로 반환한다.
필드 입력이 애초에 잘못된 요청은 400이고, 유효한 입력이 업무 적용 조건을 충족하지 못하면 422다.

서버는 내부 SQL·stack trace·secret를 message/detail에 넣지 않는다.
DB 잠금 실패나 교착 뒤 일부 성공으로 응답하지 않는다. rollback 후 안전한 동일 명령 재시도 경로만 제공한다.

## 当番の削除

DELETE /api/duties/{id}

- 成功: 204 No Content。対象なし: 404。
- 対象当番の行ロックを取得し、同一トランザクションで変更履歴、担当割当、開催日、実施・交代ルール、対象外期間、参加者の紐付け、当番本体を削除する。途中の失敗は全体をロールバックする。
- メンバー本体・ほかの当番・会社休業日は変更しない。
- UIで当番名と削除範囲、復元不可であることを表示し、ユーザーの明示的な確定後に呼び出す。

## 当番詳細と基本情報編集

- GET /api/duties/{id}: 当番1件の詳細。存在しないIDは404。
- PATCH /api/duties/{id}: name、description、expectedName、expectedDescriptionを受け取る。名前1〜100文字、説明1000文字以内。成功204。対象行をロックし元の名前・説明と照合する。不一致409、対象なし404、入力不正400。
- 基本情報のみ更新し、実施・交代ルール、開催日、保存済み担当、順番、変更履歴には触れない。DB変更なし。
- POST /api/automatic-duties/{id}/schedule: {from,to} を受け取り対象IDの年間予定を返す。最大367日。範囲と戻り値形式は全体scheduleと共通。対象以外の当番の担当枠を生成・更新しない。対象なし404。
- 未定の回はdate:nullで返す。UIでは年が未確定の回として別に表示する。他当番との同日重複確認は全体の予定一覧で行う。

## メンバー編集・削除

- PATCH /api/employees/{id}: {employee:{name,employeeNumber},expected:{name,employeeNumber}}。成功204、対象なし404、元情報の不一致／社員番号の重複409、入力不正400。名前は1〜80文字、社員番号は1〜40文字。ID・active・保存済み割当は変更しない。
- GET /api/employees/{id}/deletion-status: {canDelete:boolean}。確認用の関連チェック。対象なし404。
- DELETE /api/employees/{id}: 成功204、対象なし404、関連あり409。社員行ロックの下で関連を再確認する。DBのFKも保ち、他レコードを連鎖削除しない。
- 関連判定はduty_members、exclusions、assignments、duty_rotation_slots、assignment_changes、duty_rotation_changes。変更履歴はprevious_employee_idとnew_employee_idを両方確認する。
- 表示名・社員番号は参照先でも現在値を表示する。active切替APIは従来どおり。スキーマ変更なし。

## 규칙 변경의 우선 정책（2026-10-27）

[참가자·규칙 변경 정책](../../../docs/policies/rule-change-policy.md)을 우선한다. 적용 경계 이후 미래 자동 배정은 변경 미리보기 승인으로 갱신할 수 있고, 새 규칙도 기존의 다음 차례부터 이어간다. 조회·자동 저장을 보호 확정과 동일시해 적용일을 밀지 않는다. 과거·진행 중인 기간·수동 변경의 보호를 구분하고, 승인된 영향 전체와 규칙 버전·순환 상태·변경 전후 이력을 한 트랜잭션으로 반영하도록 설계한다. 현재 규칙 편집 API·버전 저장·보호 구분은 미구현이며, 새 필드·API·마이그레이션은 미합의 항목을 결정한 후 정의한다. 기존 확정 불변 원칙은 일반 조회·자동 갱신에 유지하며, 이번 명시적 규칙 변경 승인만 구분한다.

## 現行の担当変更API

担当変更の実装済みエンドポイントは [実装仕様](../../../docs/policies/assignment-change-implementation.md) を参照。現行は数値ID・両端を含む担当期間・確認トークンを用い、この文書の目標APIへ一括移行したものではない。
