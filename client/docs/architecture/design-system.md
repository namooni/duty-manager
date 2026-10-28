# Design System 컴포넌트 카탈로그

경로: src/components/ui/. import는 `@/components/ui` 또는 개별 파일 경로를 사용한다.
컴포넌트를 추가·변경·삭제하면 같은 작업에서 이 문서를 갱신한다.
아래는 현재 구현된 컴포넌트만 나열한다.

시각 기준은 [Neutral Workplace 디자인 정책](../policies/design-system.md)이 우선이다. 이 문서는 구현 컴포넌트와 사용법의 카탈로그다. Tailwind 예시는 토큰 매핑 참고이며 실제 구현은 styled-components를 유지한다.

## 원칙

- 텍스트는 Text. 의미에 따라 as="h1", as="p", as="strong" 등을 지정한다.
- 네이티브 option 텍스트·placeholder·aria-label처럼 HTML이 요구하는 문자열은 예외다.
- 버튼은 Button 또는 BaseButton을 확장한다. 화면에서 raw button을 만들지 않는다.
- Input/Select/Textarea/Checkbox를 사용한다. 네이티브 요소의 구현은 디자인 시스템 안에서만 허용한다.
- Flex를 기본 레이아웃으로 사용한다. grid는 styled.div, table·form·label 등은 알맞은 의미 구조를 유지한다.
- 모달은 Modal을 사용한다. native dialog가 focus trap·포커스 복원·키보드 모달 동작을 제공한다.
- 전역 스타일과 ThemeProvider는 main.tsx에서 한 번 주입한다.
- 프로젝트 테마: src/styles/theme.ts. 녹음·mini mode·요금제 등 사용하지 않는 토큰은 두지 않는다.

## Foundation

| 컴포넌트   | 경로                  | 핵심 props / 역할                                                                               |
| ---------- | --------------------- | ----------------------------------------------------------------------------------------------- |
| Text       | Text/Text             | variant(h1~h3, t1~t4), color, selectable, lineClamp, as                                         |
| Flex       | layouts/Flex          | flexDirection, justifyContent, alignItems, gap, $grow, as                                       |
| Divider    | layouts/Divider       | $margin, 의미 있는 hr                                                                           |
| BaseButton | foundation/BaseButton | native button props, 기본 type=button, reset·disabled·pressed·색 전환                           |
| Button     | button/Button         | variant(primary/secondary/text/warning/danger/dangerText), size(sm/md/lg), fullWidth, radius    |
| Input      | input/Input           | native input props/ref, error, radius                                                           |
| Select     | form/Select           | native select props                                                                             |
| Textarea   | form/Textarea         | native textarea props, 세로 resize                                                              |
| Checkbox   | form/Checkbox         | native checkbox props, 키보드·폼 참여 유지                                                      |
| Modal      | dialog/Modal          | title, onClose, busy, children. busy일 때 ESC·닫기 차단, 단계 제목 변경 시 제목으로 포커스 이동 |

TextVariants / ButtonSizes / ButtonVariants는 enum이 아닌 const 객체다.
Text는 기본적으로 선택 가능하며, variant 생략 시 폰트 크기와 굵기를 상속한다.
Button의 기본 모서리는 theme.radius.md(6px)다. BaseButton은 외형 variant를 알지 않는다.
Button은 styled(BaseButton)이므로 이중 wrapper에서 transient prop이 소실되는 구조가 아니다.
색 전환과 disabled·pressed 반응은 BaseButton이 소유하며 파생 버튼에서 중복 정의하지 않는다.
입력 계열은 form/controlStyles.ts의 공통 CSS를 사용한다. 기본 높이는 36px, focus는 1px semantic.focus(Charcoal)이며 오류 시 빨간 테두리·outline을 유지한다. Input/Select/Textarea는 같은 규칙을 공유한다.

## 공통 surface · 표시

모두 surfaces/Surfaces.ts에서 export한다.

| 컴포넌트                      | 역할                                       |
| ----------------------------- | ------------------------------------------ |
| Row / Between / Stack         | 공통 flex 배치                             |
| Muted                         | 보조 Text                                  |
| Panel / PanelHead / PanelBody | section 패널과 내용                        |
| TableWrap / Table             | 가로 스크롤 가능한 표                      |
| Badge                         | $muted 상태가 있는 Text 배지               |
| Empty                         | 빈 결과·초기 안내 배치                     |
| Field / Form                  | 의미 있는 label·form 기반 배치             |
| Alert                         | $success 상태가 있는 오류·성공 메시지 배치 |
| ListItem                      | 구분선이 있는 목록 항목                    |

역할에 특화된 스타일은 `pages/<feature>/*.styles.ts` 또는 `components/<feature>/*.styles.ts`에 둔다.
Icon/Toast/Skeleton/ConfirmDialog 등 아직 구현하지 않은 컴포넌트는 사용 가능한 것처럼 문서에 적지 않는다.
필요한 시점에 디자인 시스템에 구현하고 이 카탈로그에 등록한다.

## 홈·공통 레이아웃의 시각 기준

공통 기본 버튼·입력·Text 구조를 유지하며 Neutral Workplace 정책의 값을 적용한다. theme.colors가 색상의 원본이고 palette의 기존 board/gray 이름은 이 값으로 연결하는 호환 별칭이다. 새 스타일은 가능하면 semantic 또는 canonical palette 이름을 사용한다.

- 배경 canvas #F7F7F7, surface #FFFFFF, subtle #F0F0F0, 경계 #DFDFDF.
- 본문 #202020, 보조 #666666, primary #262626, hover #171717.
- accent/warning #B45309, success #525252, error #B42318. 기본 이름 배지와 성공 안내는 중립색이고, 실제 확인 필요 개수·경고만 Amber 강조를 사용한다.
- radius.sm=4px, md=6px, lg=8px. 표준 버튼·입력·카드·모달은 4~6px를 사용한다.
- 일반 버튼 높이는 sm 32px / md 36px / lg 40px다. 표 안 버튼은 28px로 조밀하게 표시한다.
- 테이블 헤더/행은 1px 구분선과 hover 배경을 사용한다. 숫자·날짜·표·폼에는 tabular-nums를 적용한다.
- Modal은 blur 없는 반투명 backdrop, 6px 모서리, shadow.subtle(0 1px 2px rgba(0,0,0,.05))만 사용한다. 포커스·ESC·닫기·busy 동작은 유지한다.
- 데스크톱 간격과 행 높이를 줄이되 작은 화면의 세로 배치·표 내부 가로 스크롤은 유지한다.

ScheduleOverview.styles.ts와 SchedulePage.styles.ts는 홈 기능 전용 스타일이며 공통 UI로 분류하지 않는다. 생성·검증·배정·날짜 등록 업무 동작은 바꾸지 않는다.

### メンバー入力（機能共通）

components/employees/EmployeeFields は登録・編集で共通の社員番号・名前入力を表示する。状態と検証はフックおよびutils/validation/employee.tsに置く。メンバー保守のダイアログはEmployeeDialogsにまとめ、API呼び出しはuseEmployeeManagementからrepository経由で行う。

### ボタンの操作種別

共通Buttonのwarningは無効化・休業日解除など注意が必要な状態変更（amber枠）。dangerTextは削除確認への入口（赤文字）、dangerは最終削除確定（赤塗り）に使う。通常編集はsecondary、作成・保存はprimaryを使い、画面ごとの個別色指定は行わない。hoverとdisabledは共通実装を使う。

### 間隔・操作行の共通化

- ItemActionRow（ui/layouts/ItemActionRow）: 名前や説明を左、操作を右に配置する2列grid。$actionWidthで操作列の幅を固定できる。列間12px、長文は省略せず折り返す。予定一覧・月別一覧・ホーム・旧形式一覧で共有する。
- InlineActions（ui/layouts/InlineActions）: ボタン間8px、中央揃え・折り返し対応。
- PanelBodyはpadding16px/gap16px。Tableは見出しpadding12px 16px、セルpadding14px 16px/上揃え。ボタンのサイズは呼び出し側のsizeで指定し、table内CSSで上書きしない。
- 当番カードは本文と操作footerを分け、カード内padding20px、本文内gap8px、footer上padding16px/操作間8px。予定セルはgap8px。予定一覧のAssigneeRowは最大284px（名前160px・間12px・操作112px）で左寄せし、セルの端まで伸ばさない。狭い場合は名前側を縮めて折り返し、操作列は維持する。

### NoticeToast

ui/feedback/NoticeToastは共通の成功通知。画面右下に固定し、本文や一覧の高さを変えない。role=statusと明示的な閉じるボタンを持つ。表示時間はuseGlobalNoticeTimeoutで管理する。状態変更や再取得で一覧・スクロールを初期化しない。

### 予定の状態表示

SchedulePhaseBadgeとSchedulePhase.stylesは予定一覧・月別詳細の共通表示。過去はsurfaceSecondary/textSecondary、進行中は3pxのtextPrimaryの強調線を使い、opacityで文字を薄くしない。通常の未来予定にはバッジを増やさない。完了ステータスを日付から推測しない。
