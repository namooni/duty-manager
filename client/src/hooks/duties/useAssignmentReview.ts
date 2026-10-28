import {useState} from 'react';
import {ApiError} from '@/apis/types';
import {useExclusiveAction} from '@/hooks/common/useExclusiveAction';
import {assignmentChangesRepository} from '@/repositories/assignmentChanges/assignmentChanges.repository';
import type {
  AssignmentChangeInput,
  AssignmentReview,
} from '@/repositories/assignmentChanges/assignmentChanges.domain';
import {useDutyUiStore} from '@/stores/duties/dutyUi.store';
export function useAssignmentReview(onSaved: () => void) {
  const [review, setReview] = useState<{
      input: AssignmentChangeInput;
      result: AssignmentReview;
    } | null>(null),
    [stale, setStale] = useState(false);
  const {busy, error, setError, run} = useExclusiveAction();
  const preview = (
    value: AssignmentChangeInput | (() => AssignmentChangeInput | Promise<AssignmentChangeInput>),
  ) =>
    run(
      async () => {
        const input = typeof value === 'function' ? await value() : value;
        return {input, result: await assignmentChangesRepository.preview(input)};
      },
      value => {
        setReview(value);
        setStale(false);
      },
    );
  const rows = review
    ? [...(review.result.currentRows ?? []), ...review.result.rows].map(row => ({
        ...row,
        changed: row.before?.id !== row.after?.id,
      }))
    : [];
  return {
    review,
    busy,
    error,
    stale,
    preview,
    rows,
    changedCount: rows.filter(row => row.changed).length,
    conflictCount: rows.filter(row => row.conflict).length,
    back: () => {
      if (!useDutyUiStore.getState().busy) {
        setReview(null);
        setStale(false);
        setError('');
      }
    },
    resolve: (key: string, id: number) => {
      if (review)
        return preview({...review.input, replacements: {...review.input.replacements, [key]: id}});
    },
    retry: () => {
      if (review) return preview(review.input);
    },
    confirm: () =>
      run(
        async () => {
          if (!review || !review.result.canApply || stale)
            throw new Error('変更内容を再確認してください。');
          try {
            await assignmentChangesRepository.confirm(review.input, review.result.token);
          } catch (cause) {
            if (cause instanceof ApiError && cause.status === 409) setStale(true);
            throw cause;
          }
        },
        () => {
          const ui = useDutyUiStore.getState();
          ui.setNotice('担当ルール・状態と今後の割当を更新しました。');
          ui.refreshData();
          onSaved();
        },
      ),
  };
}
export type AssignmentReviewModel = ReturnType<typeof useAssignmentReview>;
