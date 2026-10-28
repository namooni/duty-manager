import {useDutyManager} from './useDutyManager';
import {useAutomaticSchedule} from './useAutomaticSchedule';
import {useDutyOverview} from './useDutyOverview';
import {useScheduleFilterStore} from '@/stores/duties/scheduleFilter.store';
import {addDays} from '@/utils/format/date';
export function useHomeSchedule() {
  const m = useDutyManager(false);
  const to = addDays(m.today, 41);
  const work = useAutomaticSchedule(m.today, to, m.revision, m.employees, m.today, {
    duties: m.duties,
  });
  const overview = useDutyOverview(m.today, m.revision, work.refreshVersion, {
    from: m.today,
    to,
    loadedRange: work.loadedRange,
    data: work.scheduleData,
    holidays: work.holidays,
    loading: work.loading,
    error: work.dialog ? '' : work.error,
  });
  return {
    m,
    work,
    overview,
    showSchedules: () => {
      useScheduleFilterStore.getState().reset();
      m.setPage('schedule');
    },
  };
}
