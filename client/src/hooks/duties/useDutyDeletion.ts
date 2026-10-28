import {useState} from 'react';
import {dutiesRepository} from '@/repositories/duties/duties.repository';
import type {Duty} from '@/repositories/duties/duties.domain';
import {useExclusiveAction} from '@/hooks/common/useExclusiveAction';
import {useDutyUiStore} from '@/stores/duties/dutyUi.store';
import {useScheduleFilterStore} from '@/stores/duties/scheduleFilter.store';
export function useDutyDeletion() {
  const [target, setTarget] = useState<Duty | null>(null);
  const {busy, error, setError, run} = useExclusiveAction();
  return {
    target,
    busy,
    error,
    open: (duty: Duty) => {
      if (useDutyUiStore.getState().busy) return;
      setError('');
      setTarget(duty);
    },
    close: () => {
      if (useDutyUiStore.getState().busy) return;
      setTarget(null);
      setError('');
    },
    confirm: async () => {
      if (!target) return;
      await run(
        () => dutiesRepository.remove(target.id),
        () => {
          const ui = useDutyUiStore.getState();
          if (ui.selectedId === target.id) ui.setSelectedId(null);
          const filters = useScheduleFilterStore.getState();
          if (filters.dutyId === String(target.id)) filters.setDutyId('');
          ui.setNotice('「' + target.name + '」を削除しました。');
          ui.refreshData();
          setTarget(null);
        },
      );
    },
  };
}
