import {useEffect, useState} from 'react';
import {automaticRepository} from '@/repositories/automatic/automatic.repository';
import type {
  WorkOccurrence,
  WorkAssignee,
  Holiday,
  RotationChange,
  ScheduleResult,
} from '@/repositories/automatic/automatic.domain';
import type {Employee} from '@/repositories/employees/employees.domain';
import {useExclusiveAction} from '@/hooks/common/useExclusiveAction';
import {getErrorMessage} from '@/utils/errors/message';
import {useDutyUiStore} from '@/stores/duties/dutyUi.store';
import {groupOccurrences} from '@/utils/schedule/groupOccurrences';
import {validateRange} from '@/utils/validation/dateRange';
type Dialog =
  | Readonly<{kind: 'meeting'; event: WorkOccurrence}>
  | Readonly<{kind: 'replace'; event: WorkOccurrence; person: WorkAssignee}>
  | Readonly<{kind: 'holidays'}>
  | null;
export function useAutomaticSchedule(
  from: string,
  to: string,
  revision: number,
  employees: readonly Employee[],
  today: string,
) {
  const [loadedRange, setLoadedRange] = useState('');
  const [data, setData] = useState<ScheduleResult>({occurrences: [], duties: []});
  const [holidays, setHolidays] = useState<readonly Holiday[]>([]);
  const [loading, setLoading] = useState(true),
    [notice, setNotice] = useState('');
  const [tick, setTick] = useState(0),
    [filter, setFilter] = useState('');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [date, setDate] = useState(today),
    [employeeId, setEmployeeId] = useState(''),
    [reason, setReason] = useState(''),
    [holidayName, setHolidayName] = useState('');
  const [changes, setChanges] = useState<readonly RotationChange[]>([]),
    [historyLoading, setHistoryLoading] = useState(false);
  const {busy, error, setError, run} = useExclusiveAction();
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setData({occurrences: [], duties: []});
    try {
      validateRange(from, to);
    } catch (cause) {
      setError(getErrorMessage(cause, '表示期間を確認してください。'));
      setLoading(false);
      return;
    }
    Promise.all([
      automaticRepository.schedule(from, to, controller.signal),
      automaticRepository.holidays(controller.signal),
    ])
      .then(([result, days]) => {
        if (!controller.signal.aborted) {
          setData(result);
          setLoadedRange(from + ':' + to);
          setHolidays(days);
        }
      })
      .catch(cause => {
        if (!controller.signal.aborted) setError(getErrorMessage(cause, '取得に失敗しました。'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [from, to, revision, tick, setError]);
  const editingSlot = dialog?.kind === 'replace' ? dialog.person.slotId : null;
  useEffect(() => {
    const controller = new AbortController();
    setChanges([]);
    if (editingSlot === null) return;
    setHistoryLoading(true);
    automaticRepository
      .changes(editingSlot, controller.signal)
      .then(result => {
        if (!controller.signal.aborted) setChanges(result);
      })
      .catch(cause => {
        if (!controller.signal.aborted)
          setError(getErrorMessage(cause, '履歴の取得に失敗しました。'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setHistoryLoading(false);
      });
    return () => controller.abort();
  }, [editingSlot, setError]);
  async function mutate(action: () => Promise<void>, success: string, close = true) {
    setNotice('');
    await run(action, () => {
      setNotice(success);
      if (close) setDialog(null);
      setTick(value => value + 1);
    });
  }

  function open(next: Dialog) {
    setError('');
    setNotice('');
    setDialog(next);
    setReason('');
    setEmployeeId('');
    setDate(next?.kind === 'meeting' ? (next.event.date ?? today) : today);
    setHolidayName('');
  }
  const editedDuty =
    dialog && dialog.kind !== 'holidays'
      ? data.duties.find(d => d.duty.id === dialog.event.dutyId)
      : null;
  const replaceChoices =
    dialog?.kind === 'replace'
      ? employees.filter(
          person =>
            person.active &&
            editedDuty?.duty.memberIds.includes(person.id) &&
            !dialog.event.assignees.some(a => a.employeeId === person.id),
        )
      : [];
  return {
    scheduleData: data,
    loadedRange,
    refreshVersion: tick,
    loading,
    error,
    notice,
    busy,
    dialog,
    date,
    setDate,
    employeeId,
    setEmployeeId,
    reason,
    setReason,
    holidayName,
    setHolidayName,
    changes,
    historyLoading,
    replaceChoices,
    holidays,
    duties: data.duties,
    filter,
    setFilter,
    rows: groupOccurrences(
      data.occurrences.filter(event => !filter || event.dutyId === Number(filter)),
    ),
    openMeeting: (event: WorkOccurrence) => open({kind: 'meeting', event}),
    openReplacement: (event: WorkOccurrence, person: WorkAssignee) =>
      open({kind: 'replace', event, person}),
    openHolidays: () => open({kind: 'holidays'}),
    close: () => {
      if (!useDutyUiStore.getState().busy) {
        setDialog(null);
        setError('');
      }
    },
    canChangeMeeting: (event: WorkOccurrence) =>
      data.duties.some(
        d => d.duty.id === event.dutyId && d.schedule.recurrence === 'EXPLICIT_DATES',
      ) &&
      (!event.date || event.date >= today),
    canReplace: (event: WorkOccurrence) => !event.periodEnd || event.periodEnd >= today,
    saveMeeting: () =>
      mutate(async () => {
        if (dialog?.kind !== 'meeting' || !date) throw new Error('開催日を選択してください。');
        await automaticRepository.meeting(dialog.event.dutyId, dialog.event.sequence, date);
      }, '開催日を保存しました。担当者と順番は保持されます。'),
    saveReplacement: () =>
      mutate(async () => {
        if (dialog?.kind !== 'replace' || !employeeId || !reason.trim())
          throw new Error('変更後の担当者と理由を入力してください。');
        await automaticRepository.replace(dialog.person.slotId, Number(employeeId), reason.trim());
      }, '担当者を変更しました。以降の順番は保持されます。'),
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
