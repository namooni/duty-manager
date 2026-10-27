# Design System 컴포넌트 카탈로그

경로: src/components/ui/. import는 `@/components/ui` 또는 개별 파일 경로를 사용한다.
컴포넌트를 추가·변경·삭제하면 같은 작업에서 이 문서를 갱신한다.
아래는 현재 구현된 컴포넌트만 나열한다.

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
| Button     | button/Button         | variant(primary/secondary/text), size(sm/md/lg), fullWidth, radius                              |
| Input      | input/Input           | native input props/ref, error, radius                                                           |
| Select     | form/Select           | native select props                                                                             |
| Textarea   | form/Textarea         | native textarea props, 세로 resize                                                              |
| Checkbox   | form/Checkbox         | native checkbox props, 키보드·폼 참여 유지                                                      |
| Modal      | dialog/Modal          | title, onClose, busy, children. busy일 때 ESC·닫기 차단, 단계 제목 변경 시 제목으로 포커스 이동 |

TextVariants / ButtonSizes / ButtonVariants는 enum이 아닌 const 객체다.
Text는 기본적으로 선택 가능하며, variant 생략 시 폰트 크기와 굵기를 상속한다.
Button의 기본 모서리는 theme.radius.md(8px)다. BaseButton은 외형 variant를 알지 않는다.
Button은 styled(BaseButton)이므로 이중 wrapper에서 transient prop이 소실되는 구조가 아니다.
색 전환과 disabled·pressed 반응은 BaseButton이 소유하며 파생 버튼에서 중복 정의하지 않는다.
입력 계열 focus는 1px theme.palette.black으로 통일하며 색 전환은 .15s다.

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

공통 기본 버튼·입력·Text 구조는 유지하며 primary 계열은 boardAccent와 같은 차분한 녹색을 사용한다. theme.palette의 boardInk / boardMuted / boardLine / boardPaper / boardAccent / boardAccentSoft / boardWarning / boardWarningSoft는 홈의 배경·구분선·강조·확인 상태에 사용한다.

ScheduleOverview.styles.ts와 SchedulePage.styles.ts는 홈 기능 전용 스타일이며 공통 UI로 분류하지 않는다. 사이드바의 영어 슬로건·장식 기호와 페이지 공통 홍보 문구를 제거하고 화면명·업무 내용 중심으로 표시한다. 생성 Modal과 공통 UI 컴포넌트의 입력·검증 동작은 변경하지 않는다.
