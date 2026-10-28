import {useHomeSchedule} from '@/hooks/duties/useHomeSchedule';
import {DutyPageLayout} from '@/components/layouts/DutyPageLayout';
import {ScheduleOverview} from '@/components/duties/ScheduleOverview';
import {AutomaticScheduleDialogs} from '@/components/duties/AutomaticScheduleDialogs';
import * as U from '@/components/ui';
export function HomePage() {
  const {m, work, overview, showSchedules} = useHomeSchedule();
  return (
    <DutyPageLayout m={m}>
      <U.Between style={{marginBottom: 16}}>
        <U.Text color="muted">今日の担当と、次の交代・開催を確認できます。</U.Text>
        <U.Button onClick={showSchedules}>予定一覧へ</U.Button>
      </U.Between>
      <ScheduleOverview
        overview={overview}
        today={m.today}
        work={work}
        hasEmployees={!!m.employees.length}
        onAddEmployee={() => m.open('employee')}
        onCreate={() => m.open('duty')}
        onShowDuty={m.showDuty}
      />
      <AutomaticScheduleDialogs m={work} today={m.today} />
    </DutyPageLayout>
  );
}
