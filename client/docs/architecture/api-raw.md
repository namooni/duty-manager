# HTTP 계약과 오류 처리

구조의 기준은 [API · Repository · Hook 계층](api-hook-layer-structure.md)이다.

## apiClient

- Axios 인스턴스는 src/apis/apiClient.ts 하나를 사용한다.
- 기본 baseURL은 /api. VITE_API_BASE_URL로 변경할 수 있다.
- 개발 중 /api는 Vite가 localhost:8080으로 proxy한다.
- timeout은 30초, Accept는 application/json.
- 현재 Java 서버는 배열·객체를 직접 반환하고, 생성은 {id}, 내용 없는 성공은 204를 반환한다.
- 성공 응답을 임의의 success/data/meta envelope로 감싸지 않는다.

## 오류

Java 서버의 현재 오류 형식은 `{message: string}`이다.
이 메시지를 우선 보존하고, 본문이 없거나 형식이 다르면 일본어 기본 안내를 사용한다.

- HTTP 오류: ApiError(code=HTTP_<status>, message, status).
- 네트워크 오류: ApiError(NETWORK_ERROR, 일본어 안내, 0).
- timeout: ApiError(TIMEOUT, 일본어 안내, 0).
- 예기치 않은 오류: ApiError(UNKNOWN_ERROR, 일본어 안내, 0).
- 요청 취소는 오류 안내 대상이 아니므로 Axios 취소 예외를 그대로 전달한다.
- ApiError는 기존 code/message/status/detail 인터페이스와 필드 조회 메서드를 유지한다.
  현재 서버는 필드별 detail을 반환하지 않는다.

인증이 구현되지 않았으므로 localStorage 토큰, refresh queue, 로그아웃·비밀번호 변경·요금제 handler는 없다.
브라우저 시간대를 임의의 HTTP 헤더로 보내지 않는다. 업무 기준일·시간대는 서버 /health의 today/zone을 따른다.
응답·요청 본문을 자동으로 로깅하지 않는다.

## 다음 API 설계

[목표 API 계약](../../../server/docs/design/api-contract.md)은 아직 구현 전이다.
prefix는 /api를 유지하되 현재 숫자 ID·직접 응답·{message} 오류와 목표 자료형을 구분한다.
목표 계약으로 전환할 때 문자열 ID, code/detail 보존, Idempotency-Key, 미리보기 만료 처리를 함께 적용한다.

## 현재 자동 당번 API

- POST /automatic-duties/preview: {duty, schedule, dates, seed, previewCount?} → {token, turns}. DB 저장 없이 참가자 전체 순환을 계산한다. from/to는 받지 않는다.
- POST /automatic-duties: {draft, token} → 201 {id}. 재검증 후 설정·개별 개최일·첫 순환 담당을 한 트랜잭션으로 저장한다.
- GET /automatic-duties: 설정된 업무 목록.
- POST /automatic-duties/schedule: {from,to} → {occurrences,duties}. 조회 범위의 담당을 자동 예약하므로 POST를 사용한다. 수동 확정은 없다.
- PUT /automatic-duties/{id}/meetings/{sequence}: {date}. 회차 번호와 담당자는 유지하고 개최일만 변경한다.
- PATCH /automatic-duties/slots/{id}: {employeeId,reason}; GET /automatic-duties/slots/{id}/changes: 대타·이력.
- GET/PUT /automatic-duties/holidays; DELETE /automatic-duties/holidays/{date}: 회사 휴일 목록·등록·해제.
- 모든 신규 HTTP는 apis/automatic, DTO 변환은 repositories/automatic, 생성·조회·업무 변경은 전용 Hook이 담당한다. 오류 규격과 숫자 ID는 기존 계약을 유지한다.
- 기존 /duties/{id}/preview·confirm과 /duties/create-confirmed는 이전 클라이언트 호환용으로 남기며 신규 UI에서는 호출하지 않는다.

previewCount는 0(자동) 또는 1~200회다. 최소 전체 한 바퀴와 등록된 개최일 전체를 포함한다. 회차 수 변경 후에는 같은 seed로 재미리보기하고, 해당 token으로 시작한다.
