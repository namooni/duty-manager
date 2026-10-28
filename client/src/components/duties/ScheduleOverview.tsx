import type {useDutyOverview} from '@/hooks/duties/useDutyOverview';
import type {AutomaticSchedule} from '@/hooks/duties/useAutomaticSchedule';
import {dateLabel} from '@/utils/format/date';
import * as U from '@/components/ui';
import * as S from './ScheduleOverview.styles';
export function ScheduleOverview({
  overview,
  today,
  work,
  hasEmployees,
  onAddEmployee,
  onCreate,
  onShowDuty,
}: {
  overview: ReturnType<typeof useDutyOverview>;
  today: string;
  work: AutomaticSchedule;
  hasEmployees: boolean;
  onAddEmployee: () => void;
  onCreate: () => void;
  onShowDuty: (id: number) => void;
}) {
  const date = new Date(today + 'T00:00:00+09:00');
  const month = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'long',
  }).format(date);
  const day = new Intl.DateTimeFormat('ja-JP', {timeZone: 'Asia/Tokyo', day: 'numeric'})
    .format(date)
    .replace('日', '');
  const weekday = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    weekday: 'long',
  }).format(date);
  return (
    <>
      {overview.error && overview.hasData && <U.Alert role="alert">{overview.error}</U.Alert>}
      <S.OverviewGrid>
        <S.Paper aria-labelledby="today-title">
          <S.TodayHeader>
            <U.Flex flexDirection="column" gap={3}>
              <S.Heading id="today-title">今日の当番</S.Heading>
              <S.Caption>
                {month}
                {day}日 · {weekday}
              </S.Caption>
            </U.Flex>
            <S.Caption>
              {overview.loading
                ? '確認中…'
                : overview.error
                  ? '取得失敗'
                  : overview.todayHoliday && !overview.today.length
                    ? '休業日'
                    : overview.today.length + '件'}
            </S.Caption>
          </S.TodayHeader>
          {!overview.loading && (!overview.error || overview.hasData) && overview.todayHoliday && (
            <U.Text role="status" style={{padding: '12px 16px'}}>
              今日は休業日です · {overview.todayHoliday.name}
            </U.Text>
          )}
          {overview.error && !overview.hasData ? (
            <U.Alert role="alert" style={{margin: 16}}>
              {overview.error}
            </U.Alert>
          ) : overview.loading ? (
            <U.Empty role="status">読み込み中…</U.Empty>
          ) : overview.today.length ? (
            overview.today.map(event => (
              <S.TodayRow key={event.dutyId + ':' + event.sequence}>
                <U.Between>
                  <S.DutyName>{event.dutyName}</S.DutyName>
                  <U.Button size="sm" variant="text" onClick={() => onShowDuty(event.dutyId)}>
                    予定を確認
                  </U.Button>
                </U.Between>
                {event.assignees.length ? (
                  event.assignees.map(person => (
                    <U.ItemActionRow key={person.slotId} $actionWidth="112px">
                      <S.PersonName as="strong">{person.name}</S.PersonName>
                      <U.Button
                        size="sm"
                        variant="text"
                        disabled={work.busy}
                        onClick={() => work.openReplacement(event, person)}
                      >
                        担当者を変更
                      </U.Button>
                    </U.ItemActionRow>
                  ))
                ) : (
                  <S.PersonName>担当者未定</S.PersonName>
                )}
                {event.rotationMode === 'CALENDAR' && (
                  <S.Caption>
                    担当期間 {event.periodStart} 〜 {event.periodEnd}
                  </S.Caption>
                )}
                {event.warning && (
                  <U.Text role="status" style={{fontSize: 12}}>
                    {event.warning}
                  </U.Text>
                )}
              </S.TodayRow>
            ))
          ) : (
            <U.Empty>
              <U.Text as="strong">
                {!hasEmployees
                  ? 'メンバーが未登録です'
                  : !overview.dutyCount
                    ? '当番が未登録です'
                    : overview.todayHoliday
                      ? '会社休業日のため、通常の当番はお休みです'
                      : '今日の実施予定はありません'}
              </U.Text>
              {(!hasEmployees || !overview.dutyCount) && (
                <U.Button
                  variant="primary"
                  style={{marginTop: 14}}
                  onClick={hasEmployees ? onCreate : onAddEmployee}
                >
                  {hasEmployees ? '当番を作成' : 'メンバーを追加'}
                </U.Button>
              )}
            </U.Empty>
          )}
        </S.Paper>
        <U.Stack style={{gap: 16}}>
          <S.Paper aria-labelledby="upcoming-title">
            <S.SectionHead>
              <U.Text as="h2" id="upcoming-title">
                次の交代・開催
              </U.Text>
              <S.Caption>6週間以内</S.Caption>
            </S.SectionHead>
            {overview.loading ? (
              <U.Empty role="status">読み込み中…</U.Empty>
            ) : overview.error && !overview.hasData ? (
              <U.Empty>予定を取得できませんでした。</U.Empty>
            ) : overview.upcoming.length ? (
              overview.upcoming.map(item => (
                <S.UpcomingRow key={item.event.dutyId + ':' + item.event.rotationKey}>
                  <U.Flex flexDirection="column" className="when">
                    <U.Text>{dateLabel(item.date)}</U.Text>
                    <S.Kind>{item.kind === 'handover' ? '担当交代' : '開催予定'}</S.Kind>
                  </U.Flex>
                  <U.Flex flexDirection="column" gap={6} style={{minWidth: 0}}>
                    <S.DutyName>{item.event.dutyName}</S.DutyName>
                    <U.Row style={{gap: 8}}>
                      {item.previousNames && (
                        <>
                          <S.PreviousName>{item.previousNames}</S.PreviousName>
                          <S.HandoverArrow aria-label="から交代">→</S.HandoverArrow>
                        </>
                      )}
                      <U.Text className="names">
                        {item.event.assignees.map(person => person.name).join('・') || '担当者未定'}
                      </U.Text>
                    </U.Row>
                  </U.Flex>
                </S.UpcomingRow>
              ))
            ) : (
              <U.Empty>6週間以内の交代・開催予定はありません。</U.Empty>
            )}
          </S.Paper>
          {!overview.loading && (!overview.error || overview.hasData) && (
            <S.Attention aria-labelledby="attention-title">
              <U.Between>
                <U.Text as="h2" id="attention-title">
                  確認が必要な予定
                </U.Text>
                <S.AttentionCount>
                  {overview.pending.length + overview.warnings.length}
                </S.AttentionCount>
              </U.Between>
              {overview.pending.map(event => (
                <S.AttentionItem key={event.dutyId + ':' + event.sequence}>
                  <U.Between>
                    <U.Text as="strong">{event.dutyName}</U.Text>
                    <U.Button
                      size="sm"
                      variant="secondary"
                      disabled={work.busy}
                      onClick={() => work.openMeeting(event)}
                    >
                      開催日を登録
                    </U.Button>
                  </U.Between>
                  <U.Text className="reason">第{event.sequence + 1}回 · 開催日未定</U.Text>
                  <S.Caption>
                    担当：{event.assignees.map(person => person.name).join('・') || '未割当'}
                  </S.Caption>
                </S.AttentionItem>
              ))}
              {overview.warnings.map(event => (
                <S.AttentionItem key={event.key}>
                  <U.Between>
                    <U.Text>{event.dutyName}</U.Text>
                    <U.Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onShowDuty(event.dutyId)}
                    >
                      予定を確認
                    </U.Button>
                  </U.Between>
                  <U.Text className="reason">{event.warning}</U.Text>
                </S.AttentionItem>
              ))}
              {!overview.pending.length && !overview.warnings.length && (
                <S.Caption>確認が必要な予定はありません。</S.Caption>
              )}
            </S.Attention>
          )}
        </U.Stack>
      </S.OverviewGrid>
    </>
  );
}
