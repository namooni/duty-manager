import {scheduleDatesRepository} from '@/repositories/scheduleDates/scheduleDates.repository';
import type {DateHistory} from '@/repositories/scheduleDates/scheduleDates.domain';
import {useScheduleHandover} from './useScheduleHandover';
import {useScheduleDateChange} from './useScheduleDateChange';
import {schedulePhase} from '@/utils/schedule/schedulePhase';
import {meetingDateRange} from '@/utils/schedule/meetingDateRange';
import {useRetainedRequest} from '@/hooks/common/useRetainedRequest';
import {useCallback, useEffect, useState} from 'react';
import {automaticRepository} from '@/repositories/automatic/automatic.repository';
import type {
  WorkOccurrence,
  WorkAssignee,
  RotationChange,
} from '@/repositories/automatic/automatic.domain';
import type {Employee} from '@/repositories/employees/employees.domain';
import {useScheduleFilters} from './useScheduleFilters';
import type {Assignment} from '@/repositories/assignments/assignments.domain';
import type {Duty} from '@/repositories/duties/duties.domain';
import {useExclusiveAction} from '@/hooks/common/useExclusiveAction';
import {getErrorMessage} from '@/utils/errors/message';
import {useDutyUiStore} from '@/stores/duties/dutyUi.store';
import {groupOccurrences} from '@/utils/schedule/groupOccurrences';
import {validateRange} from '@/utils/validation/dateRange';
type Dialog =
  | Readonly<{kind: 'meeting'; event: WorkOccurrence; month?: string}>
  | Readonly<{kind: 'replace'; event: WorkOccurrence; person: WorkAssignee}>
  | Readonly<{kind: 'holidays'}>
  | null;
export function useAutomaticSchedule(
  from: string,
  to: string,
  revision: number,
  employees: readonly Employee[],
  today: string,
  options: Readonly<{
    legacyAssignments?: readonly Assignment[];
    duties?: readonly Duty[];
    dutyId?: number;
  }> = {},
) {
  const scopeId = options.dutyId;
  const dateChange = useScheduleDateChange();
  const [tick, setTick] = useState(0);
  const notice = useDutyUiStore(state => state.notice);
  const setNotice = useDutyUiStore(state => state.setNotice);
  const load = useCallback(
    async (signal: AbortSignal) => {
      validateRange(from, to);
      const [schedule, holidays] = await Promise.all([
        scopeId === undefined
          ? automaticRepository.schedule(from, to, signal)
          : automaticRepository.dutySchedule(scopeId, from, to, signal),
        automaticRepository.holidays(signal),
      ]);
      return {schedule, holidays};
    },
    [from, to, scopeId],
  );
  const request = useRetainedRequest(
    (scopeId ?? 'all') + ':' + from + ':' + to,
    load,
    revision + ':' + tick,
  );
  const data = request.data?.schedule ?? {occurrences: [], duties: []};
  const holidays = request.data?.holidays ?? [];
  const loadedRange = request.hasData ? from + ':' + to : '';
  const filters = useScheduleFilters(employees, [
    ...(options.duties ?? []),
    ...data.duties.map(config => config.duty),
  ]);
  const [dialog, setDialog] = useState<Dialog>(null);
  const handover = useScheduleHandover(today, () => {
    setDialog(null);
    setTick(value => value + 1);
  });
  const [date, setDate] = useState(today),
    [employeeId, setEmployeeId] = useState(''),
    [reason, setReason] = useState(''),
    [holidayName, setHolidayName] = useState('');
  const [replacementChoices, setReplacementChoices] = useState<readonly Employee[]>([]);
  const [dateHistory, setDateHistory] = useState<readonly DateHistory[]>([]);
  const [changes, setChanges] = useState<readonly RotationChange[]>([]),
    [historyLoading, setHistoryLoading] = useState(false);
  const {busy, error, setError, run} = useExclusiveAction();
  const editingSlot = dialog?.kind === 'replace' ? dialog.person.slotId : null;
  useEffect(() => {
    const controller = new AbortController();
    setChanges([]);
    setDateHistory([]);
    setReplacementChoices([]);
    if (editingSlot === null) return;
    setHistoryLoading(true);
    Promise.all([
      automaticRepository.changes(editingSlot, controller.signal),
      automaticRepository.replacementChoices(
        editingSlot,
        controller.signal,
        dialog?.kind === 'replace' ? (dialog.event.periodStart ?? undefined) : undefined,
      ),
      dialog?.kind === 'replace'
        ? scheduleDatesRepository.history(dialog.event.dutyId, dialog.event.rotationKey)
        : Promise.resolve([]),
    ])
      .then(([result, choices, dates]) => {
        if (!controller.signal.aborted) {
          setChanges(result);
          setDateHistory(dates);
          setReplacementChoices(choices);
        }
      })
      .catch(cause => {
        if (!controller.signal.aborted)
          setError(getErrorMessage(cause, '履歴の取得に失敗しました。'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setHistoryLoading(false);
      });
    return () => controller.abort();
  }, [editingSlot, dialog, setError]);
  async function mutate(action: () => Promise<void>, success: string, close = true) {
    setNotice('');
    await run(action, () => {
      setNotice(success);
      if (close) setDialog(null);
      setTick(value => value + 1);
    });
  }

  function open(next: Dialog) {
    handover.back();
    setError('');
    setNotice('');
    setDialog(next);
    setReason('');
    setEmployeeId('');
    const config =
      next?.kind === 'meeting' ? data.duties.find(d => d.duty.id === next.event.dutyId) : undefined;
    const range =
      next?.kind === 'meeting' && config
        ? meetingDateRange(
            config.meetings,
            next.event.sequence,
            today,
            config.duty.anchorDate,
            next.month,
            config.range?.plannedThrough,
          )
        : null;
    setDate(
      next?.kind === 'meeting' ? (next.event.date ?? (range?.available ? range.min : '')) : today,
    );
    setHolidayName('');
  }
  const editedDuty =
    dialog && dialog.kind !== 'holidays'
      ? data.duties.find(d => d.duty.id === dialog.event.dutyId)
      : null;
  const meetingRange =
    dialog?.kind === 'meeting' && editedDuty
      ? meetingDateRange(
          editedDuty.meetings,
          dialog.event.sequence,
          today,
          editedDuty.duty.anchorDate,
          dialog.month,
          editedDuty.range?.plannedThrough,
        )
      : null;
  const replaceChoices = replacementChoices;
  return {
    dateChange,
    phaseOf: (event: WorkOccurrence) => schedulePhase(event, today),
    scheduleData: data,
    loadedRange,
    refreshVersion: tick,
    loading: request.loading,
    refreshing: request.refreshing,
    hasData: request.hasData,
    error: handover.error || error || request.error,
    handover,
    isCurrentReplacement: dialog?.kind === 'replace' && handover.isCurrent(dialog.event),
    notice,
    busy: busy || request.refreshing,
    dialog,
    date,
    setDate,
    meetingRange,
    employeeId,
    setEmployeeId,
    reason,
    setReason,
    holidayName,
    setHolidayName,
    changes,
    dateHistory,
    historyLoading,
    replaceChoices,
    holidays,
    duties: data.duties,
    filter: filters.selectedDutyValue,
    setFilter: filters.setDutyId,
    personId: filters.personId,
    personQuery: filters.personQuery,
    personChoices: filters.choices,
    personLabel: filters.personLabel,
    setPersonId: filters.setPersonId,
    setPersonQuery: filters.setPersonQuery,
    resetFilters: filters.reset,
    hasFilters: scopeId === undefined && filters.hasFilters,
    isAssigneeMatch: (person: Parameters<typeof filters.matchesAssignee>[0]) =>
      scopeId === undefined && filters.matchesAssignee(person),
    legacyAssignments: filters.filterLegacy(options.legacyAssignments ?? []),
    dutyChoices: filters.dutyChoices,
    focusDuty: (id: number) => {
      filters.reset();
      filters.setDutyId(String(id));
    },
    rows: groupOccurrences(
      data.occurrences.filter(event =>
        scopeId === undefined ? filters.matchesOccurrence(event) : event.dutyId === scopeId,
      ),
    ),
    openMeeting: (event: WorkOccurrence, month?: string) =>
      event.date ? dateChange.open(event) : open({kind: 'meeting', event, month}),
    openReplacement: (event: WorkOccurrence, person: WorkAssignee) =>
      open({kind: 'replace', event, person}),
    openHolidays: () => open({kind: 'holidays'}),
    close: () => {
      if (!useDutyUiStore.getState().busy) {
        handover.back();
        setDialog(null);
        setError('');
      }
    },
    canChangeMeeting: (event: WorkOccurrence) =>
      event.rotationMode === 'OCCURRENCE' && (!event.date || event.date > today),
    canReplace: (event: WorkOccurrence) =>
      (!event.periodEnd || event.periodEnd >= today) &&
      (!event.segmented ||
        handover.isCurrent(event) ||
        (!!event.periodStart && event.periodStart >= today)),
    saveMeeting: () =>
      mutate(async () => {
        if (dialog?.kind !== 'meeting' || !date) throw new Error('開催日を選択してください。');
        if (
          !meetingRange?.available ||
          date < meetingRange.min ||
          (meetingRange.max && date > meetingRange.max)
        )
          throw new Error('指定した月と前後の開催順に合う日付を選択してください。');
        await automaticRepository.meeting(dialog.event.dutyId, dialog.event.sequence, date);
      }, '開催日を保存しました。担当者と順番は保持されます。'),
    saveReplacement: () => {
      if (dialog?.kind === 'replace' && handover.isCurrent(dialog.event))
        return handover.previewHandover(dialog.event, dialog.person, Number(employeeId), reason);
      return mutate(async () => {
        if (dialog?.kind !== 'replace' || !employeeId || !reason.trim())
          throw new Error('変更後の担当者と理由を入力してください。');
        await automaticRepository.replace(
          dialog.person.slotId,
          Number(employeeId),
          reason.trim(),
          dialog.event.periodStart ?? undefined,
        );
      }, '担当者を変更しました。以降の順番は保持されます。');
    },
    saveHoliday: () =>
      mutate(
        async () => {
          if (!date || !holidayName.trim()) throw new Error('休業日と名称を入力してください。');
          await automaticRepository.saveHoliday({date, name: holidayName.trim()});
        },
        '会社休業日を保存しました。交代周期は変わりません。',
        false,
      ),
    removeHoliday: (day: string) =>
      mutate(() => automaticRepository.removeHoliday(day), '会社休業日を解除しました。', false),
  };
}
export type AutomaticSchedule = ReturnType<typeof useAutomaticSchedule>;
