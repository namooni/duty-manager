import {useState} from 'react';
import {useExclusiveAction} from '@/hooks/common/useExclusiveAction';
import {useDutyUiStore} from '@/stores/duties/dutyUi.store';
import {scheduleDatesRepository as repo} from '@/repositories/scheduleDates/scheduleDates.repository';
import type {
  ScheduleDateContext,
  ScheduleDateInput,
  ScheduleDateReview,
} from '@/repositories/scheduleDates/scheduleDates.domain';
import type {WorkOccurrence} from '@/repositories/automatic/automatic.domain';
import {ApiError} from '@/apis/types';
export function useScheduleDateChange() {
  const [target, setTarget] = useState<WorkOccurrence | null>(null),
    [context, setContext] = useState<ScheduleDateContext | null>(null),
    [date, setDate] = useState(''),
    [reason, setReason] = useState('');
  const [review, setReview] = useState<{
      input: ScheduleDateInput;
      result: ScheduleDateReview;
    } | null>(null),
    [stale, setStale] = useState(false);
  const action = useExclusiveAction();
  const preview = () =>
    action.run(
      async () => {
        if (!target || !context) throw new Error('担当予定を読み込んでください。');
        if (!date || date < context.minimum || date > context.maximum)
          throw new Error('変更できる期間内の日付を指定してください。');
        if (!reason.trim()) throw new Error('変更理由を入力してください。');
        const input = {rotationKey: target.rotationKey, date, reason: reason.trim()};
        return {input, result: await repo.preview(target.dutyId, input)};
      },
      result => {
        setReview(result);
        setStale(false);
      },
    );
  return {
    target,
    context,
    date,
    setDate,
    reason,
    setReason,
    review,
    stale,
    ...action,
    preview,
    open: (event: WorkOccurrence) => {
      if (useDutyUiStore.getState().busy || event.rotationMode !== 'OCCURRENCE') return;
      setTarget(event);
      setContext(null);
      setReview(null);
      setStale(false);
      setReason('');
      void action.run(
        () => repo.context(event.dutyId, event.rotationKey),
        value => {
          setContext(value);
          setDate(value.currentDate ?? value.minimum);
        },
      );
    },
    close: () => {
      if (!useDutyUiStore.getState().busy) setTarget(null);
    },
    back: () => {
      if (!useDutyUiStore.getState().busy) {
        setReview(null);
        setStale(false);
        action.setError('');
      }
    },
    confirm: () =>
      action.run(
        async () => {
          if (!target || !review || stale) throw new Error('変更内容を再確認してください。');
          try {
            await repo.confirm(target.dutyId, review.input, review.result.token);
          } catch (cause) {
            if (cause instanceof ApiError && cause.status === 409) setStale(true);
            throw cause;
          }
        },
        () => {
          const ui = useDutyUiStore.getState();
          ui.setNotice('予定の日付を変更しました。担当者と順番は保持されます。');
          ui.refreshData();
          setTarget(null);
        },
      ),
  };
}
export type ScheduleDateChangeModel = ReturnType<typeof useScheduleDateChange>;
