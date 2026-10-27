import {useState} from 'react';
import {useDutyManager} from '@/hooks/duties/useDutyManager';
import {useAutomaticSchedule} from '@/hooks/duties/useAutomaticSchedule';
import {useDutyOverview} from '@/hooks/duties/useDutyOverview';
import {useScheduleRange} from '@/hooks/duties/useScheduleRange';
import {DutyPageLayout} from '@/components/layouts/DutyPageLayout';
import {ScheduleOverview} from '@/components/duties/ScheduleOverview';
import {ScheduleList} from '@/components/duties/ScheduleList';
import {LegacySchedule} from '@/components/duties/LegacySchedule';
import {AutomaticScheduleDialogs} from '@/components/duties/AutomaticScheduleDialogs';
import * as U from '@/components/ui';
import * as S from './SchedulePage.styles';
export function SchedulePage() {
  const m = useDutyManager();
  const work = useAutomaticSchedule(m.from, m.to, m.revision, m.employees, m.today);
  const overview = useDutyOverview(m.today, m.revision, work.refreshVersion, {
    from: m.from,
    to: m.to,
    loadedRange: work.loadedRange,
    data: work.scheduleData,
    loading: work.loading,
    error: work.dialog ? '' : work.error,
  });
  const range = useScheduleRange(m.today, m.from, m.to, m.setFrom, m.setTo);
  const [filtersOpen, setFiltersOpen] = useState(false);
  function showDuty(id: number) {
    work.setFilter(String(id));
    document.getElementById('schedule-list')?.scrollIntoView({behavior: 'smooth', block: 'start'});
  }
  return (
    <DutyPageLayout m={m}>
      <ScheduleOverview
        overview={overview}
        today={m.today}
        work={work}
        hasEmployees={!!m.employees.length}
        onAddEmployee={() => m.open('employee')}
        onCreate={() => m.open('duty')}
        onShowDuty={showDuty}
      />
      <S.ScheduleSection id="schedule-list" aria-labelledby="schedule-heading">
        <S.Toolbar>
          <U.Flex flexDirection="column" gap={3}>
            <U.Text as="h2" id="schedule-heading">
              予定一覧
            </U.Text>
            <S.RangeText>
              {m.from} 〜 {m.to}
            </S.RangeText>
          </U.Flex>
          <U.Row>
            <U.Button
              size="sm"
              variant={range.isUpcoming ? 'secondary' : 'text'}
              aria-pressed={range.isUpcoming}
              onClick={range.showUpcoming}
            >
              今日から6週間
            </U.Button>
            <U.Button
              size="sm"
              variant={range.isThisMonth ? 'secondary' : 'text'}
              aria-pressed={range.isThisMonth}
              onClick={range.showThisMonth}
            >
              今月
            </U.Button>
            <U.Button
              size="sm"
              variant="text"
              aria-expanded={filtersOpen}
              aria-controls="schedule-filters"
              onClick={() => setFiltersOpen(value => !value)}
            >
              期間を指定
            </U.Button>
            <U.Select
              aria-label="当番で絞り込む"
              style={{width: 180}}
              value={work.filter}
              onChange={event => work.setFilter(event.target.value)}
            >
              <option value="">すべての当番</option>
              {work.duties.map(config => (
                <option key={config.duty.id} value={config.duty.id}>
                  {config.duty.name}
                </option>
              ))}
            </U.Select>
          </U.Row>
        </S.Toolbar>
        {filtersOpen && (
          <S.Filters id="schedule-filters">
            <U.Field>
              <U.Text>表示開始日</U.Text>
              <U.Input
                type="date"
                value={m.from}
                onChange={event => m.setFrom(event.target.value)}
              />
            </U.Field>
            <U.Field>
              <U.Text>表示終了日</U.Text>
              <U.Input type="date" value={m.to} onChange={event => m.setTo(event.target.value)} />
            </U.Field>
            <U.Button variant="text" onClick={() => setFiltersOpen(false)}>
              閉じる
            </U.Button>
          </S.Filters>
        )}
        {work.error && !work.dialog && overview.error !== work.error && (
          <U.Alert role="alert">{work.error}</U.Alert>
        )}
        {work.notice && (
          <U.Alert $success role="status">
            {work.notice}
          </U.Alert>
        )}
        <ScheduleList m={m} work={work} />
        <U.Between>
          <S.RangeText>
            {work.loading ? '読み込み中…' : work.rows.length + '件の担当・開催予定'}
          </S.RangeText>
          <U.Button size="sm" variant="text" disabled={m.busy} onClick={work.openHolidays}>
            会社休業日を管理
          </U.Button>
        </U.Between>
      </S.ScheduleSection>
      <LegacySchedule m={m} />
      <AutomaticScheduleDialogs m={work} today={m.today} />
    </DutyPageLayout>
  );
}
