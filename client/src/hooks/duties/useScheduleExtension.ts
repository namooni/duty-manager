import {useState} from 'react';
import type {
  AutomaticDuty,
  AllocationExtension,
  RotationPreview,
} from '@/repositories/automatic/automatic.domain';
import {automaticRepository} from '@/repositories/automatic/automatic.repository';
import {useExclusiveAction} from '@/hooks/common/useExclusiveAction';
import {useDutyUiStore} from '@/stores/duties/dutyUi.store';
import {ApiError} from '@/apis/types';
export function useScheduleExtension(config: AutomaticDuty, onSaved: () => void) {
  const through = config.range?.plannedThrough ?? config.duty.anchorDate;
  const end = config.range?.endDate;
  const suggested = String(Number(through.slice(0, 4)) + 1) + '-12-31';
  const [plannedThrough, setPlannedThrough] = useState(end && end < suggested ? end : suggested),
    [additionalMeetings, setAdditionalMeetings] = useState(0);
  const [review, setReview] = useState<{
      input: AllocationExtension;
      preview: RotationPreview;
    } | null>(null),
    [stale, setStale] = useState(false);
  const action = useExclusiveAction();
  const preview = () =>
    action.run(
      async () => {
        if (!plannedThrough || plannedThrough < through)
          throw new Error('追加する期間は現在の担当予定の終了日以降を指定してください。');
        if (end && plannedThrough > end)
          throw new Error('当番の終了日を超える予定は追加できません。');
        if (
          !Number.isInteger(additionalMeetings) ||
          additionalMeetings < 0 ||
          additionalMeetings > 200
        )
          throw new Error('追加する開催回数は0〜200回です。');
        const input = {plannedThrough, additionalMeetings};
        return {input, preview: await automaticRepository.allocationPreview(config.duty.id, input)};
      },
      value => {
        setReview(value);
        setStale(false);
      },
    );
  return {
    through,
    end,
    plannedThrough,
    setPlannedThrough,
    additionalMeetings,
    setAdditionalMeetings,
    review,
    stale,
    ...action,
    preview,
    back: () => {
      if (!useDutyUiStore.getState().busy) {
        setReview(null);
        setStale(false);
        action.setError('');
      }
    },
    canApply: !!review && !stale && !action.busy && review.preview.turns.every(t => !t.warning),
    confirm: () =>
      action.run(
        async () => {
          if (!review || stale || review.preview.turns.some(t => t.warning))
            throw new Error('追加内容を再確認してください。');
          try {
            await automaticRepository.allocate(config.duty.id, review.input, review.preview.token);
          } catch (cause) {
            if (cause instanceof ApiError && cause.status === 409) setStale(true);
            throw cause;
          }
        },
        () => {
          const ui = useDutyUiStore.getState();
          ui.setNotice('担当予定を追加しました。');
          ui.refreshData();
          onSaved();
        },
      ),
  };
}
