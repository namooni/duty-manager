import {useEffect, useState} from 'react';
import {automaticRepository} from '@/repositories/automatic/automatic.repository';
import type {AutomaticDuty} from '@/repositories/automatic/automatic.domain';
import type {DutyManager} from './useDutyManager';
import {scheduleLabel, rotationLabel} from '@/utils/format/schedule';
export function useDutyCatalog(m: DutyManager) {
  const [configs, setConfigs] = useState<readonly AutomaticDuty[]>([]),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    automaticRepository
      .catalog(controller.signal)
      .then(result => {
        if (!controller.signal.aborted) setConfigs(result);
      })
      .catch(cause => {
        if (!controller.signal.aborted)
          setError(cause instanceof Error ? cause.message : '実施日の取得に失敗しました。');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [m.revision]);
  return {
    error,
    loading,
    rows: m.duties.map(duty => {
      const config = configs.find(c => c.duty.id === duty.id);
      return {
        ...duty,
        scheduleText: config ? scheduleLabel(config.schedule) : '実施日未設定（以前の形式）',
        rotationText: config ? rotationLabel(duty, config.schedule) : '保存済みの担当期間を保持',
        automatic: !!config,
      };
    }),
  };
}
