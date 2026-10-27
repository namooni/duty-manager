import {useState} from 'react';
import {useDutyForm} from './useDutyForm';
import {automaticRepository} from '@/repositories/automatic/automatic.repository';
import type {
  AutomaticDraft,
  RotationPreview,
  ScheduleRule,
} from '@/repositories/automatic/automatic.domain';
import type {Employee} from '@/repositories/employees/employees.domain';
import {createRotationSeed} from '@/libs/random';
import {useExclusiveAction} from '@/hooks/common/useExclusiveAction';
import {useDutyUiStore} from '@/stores/duties/dutyUi.store';
import {scheduleLabel, rotationLabel} from '@/utils/format/schedule';
export function useAutomaticDutyCreation(
  employees: readonly Employee[],
  today: string,
  onSaved: (id: number, anchorDate: string) => void,
  onClose: () => void,
) {
  const duty = useDutyForm(employees, today);
  const [rule, setRule] = useState<ScheduleRule>({
    recurrence: 'WORKDAYS',
    rotationMode: 'CALENDAR',
    weekdays: [1, 2, 3, 4, 5],
    everyDays: 1,
    monthDay: 1,
    monthOrdinal: 1,
    weekday: 1,
  });
  const [previewCount, setPreviewCount] = useState(0);
  const [dates, setDates] = useState<readonly string[]>(['']);
  const [review, setReview] = useState<Readonly<{
    draft: AutomaticDraft;
    preview: RotationPreview;
  }> | null>(null);
  const {busy, error, setError, run} = useExclusiveAction();
  function updateRule<K extends keyof ScheduleRule>(key: K, value: ScheduleRule[K]) {
    setRule(previous => ({
      ...previous,
      [key]: value,
      ...(key === 'recurrence' && value === 'EXPLICIT_DATES'
        ? {rotationMode: 'OCCURRENCE' as const}
        : {}),
    }));
  }
  return {
    duty,
    rule,
    dates,
    review,
    error,
    busy,
    scheduleText: scheduleLabel(rule),
    rotationText: rotationLabel(duty.form, rule),
    updateRule,
    toggleWeekday: (day: number) =>
      setRule(previous => ({
        ...previous,
        weekdays: previous.weekdays.includes(day)
          ? previous.weekdays.filter(d => d !== day)
          : [...previous.weekdays, day].sort(),
      })),
    updateDate: (index: number, value: string) =>
      setDates(previous => previous.map((date, i) => (i === index ? value : date))),
    addDate: () => setDates(previous => [...previous, '']),
    removeDate: (index: number) => setDates(previous => previous.filter((_, i) => i !== index)),
    close: () => {
      if (!useDutyUiStore.getState().busy) onClose();
    },
    back: () => {
      if (!busy) {
        setReview(null);
        setError('');
      }
    },
    preview: () =>
      run(async () => {
        const input = review?.draft.duty ?? duty.input();
        if (!Number.isInteger(previewCount) || previewCount < 0 || previewCount > 200)
          throw new Error('表示する回数は1〜200の整数で指定してください。');
        if (rule.recurrence === 'WEEKLY' && !rule.weekdays.length)
          throw new Error('実施する曜日を選択してください。');
        const selectedDates =
          rule.recurrence === 'EXPLICIT_DATES' ? dates.filter(Boolean).sort() : [];
        if (new Set(selectedDates).size !== selectedDates.length)
          throw new Error('開催日が重複しています。');
        if (selectedDates.some(date => date < input.anchorDate))
          throw new Error('開催日は担当開始日以降で指定してください。');
        const draft: AutomaticDraft = {
          duty: input,
          schedule: rule,
          dates: selectedDates,
          seed: review?.draft.seed ?? createRotationSeed(),
          previewCount,
        };
        const preview = await automaticRepository.preview(draft);
        return {draft, preview};
      }, setReview),
    previewCount: previewCount || review?.preview.turns.length || 1,
    setPreviewCount,
    minimumPreviewCount: review
      ? Math.max(
          review.draft.dates.length,
          Math.ceil(review.draft.duty.memberIds.length / review.draft.duty.assigneeCount),
        )
      : 1,
    canStart:
      !!review?.preview.turns.length &&
      (review.draft.previewCount ?? 0) === previewCount &&
      review.preview.turns.every(turn => !turn.warning) &&
      !busy,
    activate: () =>
      run(
        async () => {
          if (!review || (review.draft.previewCount ?? 0) !== previewCount)
            throw new Error('表示を更新して担当順を確認してください。');
          const result = await automaticRepository.activate(review.draft, review.preview.token);
          return result.id;
        },
        id => {
          if (review) onSaved(id, review.draft.duty.anchorDate);
        },
      ),
  };
}
export type AutomaticDutyCreation = ReturnType<typeof useAutomaticDutyCreation>;
