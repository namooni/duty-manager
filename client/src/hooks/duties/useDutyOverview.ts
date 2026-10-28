import {useCallback} from 'react';
import {useRetainedRequest} from '@/hooks/common/useRetainedRequest';
import {automaticRepository} from '@/repositories/automatic/automatic.repository';
import type {Holiday, ScheduleResult} from '@/repositories/automatic/automatic.domain';
import {addDays} from '@/utils/format/date';
import {buildOverview} from '@/utils/schedule/buildOverview';
type Source = Readonly<{
  from: string;
  to: string;
  loadedRange: string;
  data: ScheduleResult;
  holidays?: readonly Holiday[];
  loading: boolean;
  error: string;
}>;
const empty: ScheduleResult = {occurrences: [], duties: []};
export function useDutyOverview(
  today: string,
  revision: number,
  refreshVersion: number,
  source: Source,
) {
  const through = addDays(today, 41),
    reuse = source.from <= today && source.to >= through;
  const load = useCallback(
    (signal: AbortSignal) => automaticRepository.schedule(today, through, signal),
    [today, through],
  );
  const remote = useRetainedRequest(
    today + ':' + through,
    load,
    revision + ':' + refreshVersion,
    !reuse,
  );
  const sourceReady = source.loadedRange === source.from + ':' + source.to;
  const hasData = reuse ? sourceReady : remote.hasData;
  const data = reuse ? (sourceReady ? source.data : empty) : (remote.data ?? empty);
  return {
    ...buildOverview(data, today, through),
    todayHoliday: source.holidays?.find(day => day.date === today) ?? null,
    hasData,
    loading: reuse ? source.loading || (!sourceReady && !source.error) : remote.loading,
    refreshing: reuse ? false : remote.refreshing,
    error: reuse ? source.error : remote.error,
  };
}
