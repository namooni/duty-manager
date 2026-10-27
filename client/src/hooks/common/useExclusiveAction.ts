import {useEffect, useRef, useState} from 'react';
import {useDutyUiStore} from '@/stores/duties/dutyUi.store';
import {getErrorMessage} from '@/utils/errors/message';
export function useExclusiveAction() {
  const [error, setError] = useState('');
  const busy = useDutyUiStore(state => state.busy);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function run<T>(action: () => Promise<T>, onSuccess?: (result: T) => void) {
    if (useDutyUiStore.getState().busy) return;
    useDutyUiStore.getState().setBusy(true);
    setError('');
    try {
      const result = await action();
      if (mounted.current) onSuccess?.(result);
    } catch (cause) {
      if (mounted.current) setError(getErrorMessage(cause));
    } finally {
      useDutyUiStore.getState().setBusy(false);
    }
  }
  return {busy, error, setError, run};
}
