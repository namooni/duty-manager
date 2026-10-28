# API · Repository · Hook 계층

## 데이터 흐름

```text
UI → useDutyManager → employeesRepository / dutiesRepository / assignmentsRepository / systemRepository
   → <domain>.api.ts → apiClient.ts → Java server
```

응답은 반대 방향으로 흐른다. UI는 API·repository를 직접 호출하지 않는다.
TanStack Query는 도입하지 않는다. 사용하지 않는 queryKeys, 캐시 옵션, mutation invalidation 규칙도 만들지 않는다.

## 폴더와 책임

```text
src/
  apis/<domain>/<domain>.api.ts
  apis/apiClient.ts
  apis/types.ts
  repositories/<domain>/
    <domain>.repository.ts
    <domain>.dto.ts
    <domain>.domain.ts
    <domain>.mapper.ts
  hooks/<feature>/use<Feature>.ts
  stores/<feature>/<feature>.store.ts
```

| 계층       | 책임                                                                 |
| ---------- | -------------------------------------------------------------------- |
| apiClient  | Axios 단일 인스턴스, baseURL, timeout, ApiError 정규화               |
| API        | 엔드포인트와 DTO. HTTP 응답의 data를 그대로 반환                     |
| Repository | DTO→readonly Domain 변환, 요청 DTO 변환, 데이터 수집·조립            |
| Hook       | 조회·취소·재조회, 검증, 필터·집계, 폼 상태와 업무 후 이동            |
| Zustand    | 선택한 업무·조회 기간 등 페이지 간 공유할 UI 상태                    |
| UI         | 훅 결과 표시와 이벤트 연결. 순수 포맷팅·포커스 같은 시각 동작은 허용 |

- repositories의 각 도메인 모듈은 repository/dto/domain/mapper 네 파일을 기본으로 한다.
- Domain 타입은 readonly, enum 대신 const + 파생 union을 사용한다.
- API와 repository는 폼 검증·알림·내비게이션을 처리하지 않는다.
- 스토어에는 employees, duties, preview 같은 서버 데이터를 중복 저장하지 않는다.
- 훅의 이름·인자는 역할에 맞게 정한다. 무인자 useDomainApi나 반환 함수 내부 hook 호출을 강제하지 않는다.

## 비동기 처리

- 조회 effect마다 AbortController를 만들고 cleanup에서 취소한다.
- signal을 Repository → API → Axios까지 전달한다.
- 응답을 state에 반영하기 전에도 signal.aborted를 검사해 늦은 이전 응답을 차단한다.
- 조회 기간·업무 선택·조회 revision 변경 시 해당 데이터를 재조회한다.
- 성공한 업무 변경 뒤 훅이 modal·알림·revision을 갱신한다. UI는 저장 뒤 임의로 재조회하지 않는다.
- 서버 409 충돌이면 훅이 오류를 표시하면서 최신 미리보기를 다시 가져온다.
- 중복 저장은 Zustand의 동기 busy 검사와 busy 상태로 차단한다.

## utils / libs

utils는 외부 상태를 읽지 않는 순수 함수다. 예: 입력 날짜 포맷팅, 날짜 간격 검증.
libs는 외부 환경과 접촉한다. 예: 현재 Tokyo 날짜를 얻는 clock, 향후 SDK·스토리지 연동.

## 예정 목록 검색 상태

- stores/duties/scheduleFilter.store.ts: 업무 ID·담당자 ID·검색어만 보관하는 UI 상태.
- hooks/duties/useScheduleFilters.ts: 직원 선택지·필터 결합·기존 형식 내역 필터.
- utils/schedule/scheduleFilters.ts: 이름·사번 정규화 및 동일 담당자 조건의 순수 판정.
- useAutomaticSchedule은 필터 적용 후 기간별로 묶은 목록을 반환하며 원본 scheduleData는 전체 홈 요약용으로 유지한다.

## 取得結果を維持した再取得

useRetainedRequest（hooks/common）は安定したloader、問い合わせキー、更新version、enabledを受け取り、AbortControllerとloading／refreshing／エラーを共通管理する。成功済みの同一キーは空配列も含めて再取得中に保持する。キー変更時は古い結果を返さない。サーバーデータはフック内に留め、Zustandには保存しない。

useDutyManager、useDutyCatalog、useAutomaticSchedule、useDutyDetails、useDutyOverviewで共有する。各機能フックは問い合わせ条件・repository呼び出し・表示用の変換を担当する。初回loadingだけ一覧を置き換え、refreshingでは既存UIを維持する。失敗時はエラーと既存結果を併せて返す。成功通知は共通レイアウトのNoticeToastから表示する。
