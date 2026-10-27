import {useEffect, useState} from 'react';
import {automaticRepository} from '@/repositories/automatic/automatic.repository';
import type {ScheduleResult} from '@/repositories/automatic/automatic.domain';
import {addDays} from '@/utils/format/date';
import {buildOverview} from '@/utils/schedule/buildOverview';
import {getErrorMessage} from '@/utils/errors/message';
type Source = Readonly<{
  from: string;
  to: string;
  loadedRange: string;
  data: ScheduleResult;
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
  const through = addDays(today, 41);
  const reuse = source.from <= today && source.to >= through;
  const key = today + ':' + revision + ':' + refreshVersion;
  const [remote, setRemote] = useState<Readonly<{
    key: string;
    data: ScheduleResult;
    error: string;
  }> | null>(null);
  useEffect(() => {
    if (reuse) return;
    const controller = new AbortController();
    automaticRepository
      .schedule(today, through, controller.signal)
      .then(data => {
        if (!controller.signal.aborted) setRemote({key, data, error: ''});
      })
      .catch(cause => {
        if (!controller.signal.aborted)
          setRemote({key, data: empty, error: getErrorMessage(cause)});
      });
    return () => controller.abort();
  }, [reuse, today, through, key]);
  const sourceReady = source.loadedRange === source.from + ':' + source.to;
  const remoteReady = remote?.key === key;
  const data = reuse ? (sourceReady ? source.data : empty) : remoteReady ? remote.data : empty;
  return {
    ...buildOverview(data, today, through),
    loading: reuse ? source.loading || (!sourceReady && !source.error) : !remoteReady,
    error: reuse ? source.error : remoteReady ? remote.error : '',
  };
}
