import {useEffect, useMemo, useState} from 'react';
import {employeesRepository} from '@/repositories/employees/employees.repository';
import {dutiesRepository} from '@/repositories/duties/duties.repository';
import {assignmentsRepository} from '@/repositories/assignments/assignments.repository';
import {systemRepository} from '@/repositories/system/system.repository';
import {getErrorMessage as message} from '@/utils/errors/message';
import {ApiError} from '@/apis/types';
import {useDutyUiStore} from '@/stores/duties/dutyUi.store';
import {useAppNavigation} from '@/hooks/navigation/useAppNavigation';
import {getTokyoToday} from '@/libs/clock';
import {addDays as daysAfter} from '@/utils/format/date';
import {validateRange} from '@/utils/validation/dateRange';
import type {Assignment, Change} from '@/repositories/assignments/assignments.domain';
import type {Duty, Exclusion} from '@/repositories/duties/duties.domain';
import type {Employee} from '@/repositories/employees/employees.domain';
import type {Modal} from '@/types/ui';

export function useDutyManager() {
  const [today, setToday] = useState(getTokyoToday);
  const [zone, setZone] = useState('Asia/Tokyo');
  const {page, setPage} = useAppNavigation();
  const [employees, setEmployees] = useState<readonly Employee[]>([]);
  const [duties, setDuties] = useState<readonly Duty[]>([]);
  const [assignments, setAssignments] = useState<readonly Assignment[]>([]);
  const {
    selectedId,
    setSelectedId,
    from,
    to,
    setFrom,
    setTo,
    initializeRange,
    busy,
    setBusy,
    error,
    setError,
    notice,
    setNotice,
    revision,
    refreshData,
  } = useDutyUiStore();
  const [exclusions, setExclusions] = useState<readonly Exclusion[]>([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState<Modal>(null);
  const [employeeForm, setEmployeeForm] = useState({name: '', employeeNumber: ''});
  const [exclusionForm, setExclusionForm] = useState({
    employeeId: '',
    startDate: today,
    endDate: today,
    reason: '',
  });
  const [replaceForm, setReplaceForm] = useState({employeeId: '', reason: ''});
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [changes, setChanges] = useState<readonly Change[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const selectedDuty = duties.find(duty => duty.id === selectedId) ?? null;

  useEffect(() => {
    const controller = new AbortController();
    systemRepository
      .info(controller.signal)
      .then(health => {
        if (controller.signal.aborted) return;
        setToday(health.today);
        setZone(health.zone);
        initializeRange(health.today, daysAfter(health.today, 41));
      })
      .catch(() => {});
    return () => controller.abort();
  }, [initializeRange]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    try {
      validateRange(from, to);
    } catch (cause) {
      setAssignments([]);
      setError(message(cause));
      setLoading(false);
      return;
    }
    Promise.all([
      employeesRepository.list(controller.signal),
      dutiesRepository.list(controller.signal),
      assignmentsRepository.list(from, to, controller.signal),
    ])
      .then(([people, tasks, schedule]) => {
        if (controller.signal.aborted) return;
        setEmployees(people);
        setDuties(tasks);
        setAssignments(schedule);
        setSelectedId(previous =>
          tasks.some(task => task.id === previous) ? previous : (tasks[0]?.id ?? null),
        );
      })
      .catch(cause => {
        if (!controller.signal.aborted) setError(message(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [revision, from, to, setSelectedId, setError]);
  useEffect(() => {
    const controller = new AbortController();
    setExclusions([]);
    if (selectedId === null) return;
    try {
      validateRange(from, to);
    } catch {
      return;
    }
    dutiesRepository
      .exclusions(selectedId, controller.signal)
      .then(result => {
        if (!controller.signal.aborted) setExclusions(result);
      })
      .catch(cause => {
        if (!controller.signal.aborted) setError(message(cause));
      });
    return () => controller.abort();
  }, [selectedId, from, to, revision, setError]);
  useEffect(() => {
    if (!editing) return;
    const controller = new AbortController();
    setHistoryLoading(true);
    assignmentsRepository
      .changes(editing.id, controller.signal)
      .then(result => {
        if (!controller.signal.aborted) setChanges(result);
      })
      .catch(cause => {
        if (!controller.signal.aborted) setError(message(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setHistoryLoading(false);
      });
    return () => controller.abort();
  }, [editing, setError]);

  async function mutate(action: () => Promise<unknown>, success: string) {
    if (useDutyUiStore.getState().busy) return;

    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
      setModal(null);
      setEditing(null);
      setNotice(success);
      refreshData();
    } catch (cause) {
      setError(message(cause));
      if (cause instanceof ApiError && cause.status === 409) refreshData();
    } finally {
      setBusy(false);
    }
  }
  function open(next: Modal) {
    setError('');
    setNotice('');
    if (next === 'employee') setEmployeeForm({name: '', employeeNumber: ''});
    if (next === 'exclusion')
      setExclusionForm({employeeId: '', startDate: from, endDate: from, reason: ''});
    setModal(next);
  }
  function openReplace(assignment: Assignment) {
    setEditing(assignment);
    setChanges([]);
    setReplaceForm({employeeId: '', reason: ''});
    open('replace');
  }
  const activeEmployees = employees.filter(employee => employee.active);
  const memberChoices = activeEmployees.filter(employee =>
    selectedDuty?.memberIds.includes(employee.id),
  );
  const replaceChoices = activeEmployees.filter(employee => {
    const task = duties.find(duty => duty.id === editing?.dutyId);
    return task?.memberIds.includes(employee.id) && employee.id !== editing?.employeeId;
  });
  const exclusionsWithNames = exclusions.map(exclusion => ({
    ...exclusion,
    employeeName:
      employees.find(employee => employee.id === exclusion.employeeId)?.name ?? 'メンバー',
  }));
  const employeeRows = useMemo(
    () =>
      employees.map(employee => ({
        ...employee,
        dutyCount: duties.filter(duty => duty.memberIds.includes(employee.id)).length,
      })),
    [employees, duties],
  );
  const dutyRows = duties.map(duty => ({
    ...duty,
    memberNames: duty.memberIds
      .map(id => employees.find(employee => employee.id === id)?.name ?? 'メンバー')
      .join(', '),
  }));
  return {
    finishAutomaticCreation: (id: number, anchorDate: string) => {
      setFrom(anchorDate);
      setTo(daysAfter(anchorDate, 41));
      setSelectedId(id);
      setModal(null);
      setNotice('当番を開始しました。実施日と担当ルールに沿って自動で割り当てます。');
      refreshData();
      setPage('schedule');
    },
    revision,
    primaryLabel: page === 'employees' ? 'メンバーを追加' : '当番を作成',
    openPrimary: () => open(page === 'employees' ? 'employee' : 'duty'),
    showDuty: (id: number) => {
      setSelectedId(id);
      setPage('schedule');
    },
    page,
    setPage,
    today,
    zone,
    employees: employeeRows,
    activeEmployees,
    duties: dutyRows,
    selectedDuty,
    selectedId,
    setSelectedId,
    from,
    to,
    setFrom: (value: string) => {
      setError('');
      setFrom(value);
    },
    setTo: (value: string) => {
      setError('');
      setTo(value);
    },
    exclusions: exclusionsWithNames,
    assignments,
    loading,
    busy,
    error,
    notice,
    modal,
    employeeForm,
    exclusionForm,
    replaceForm,
    editing,
    changes,
    historyLoading,
    updateEmployee: (key: keyof typeof employeeForm, value: string) =>
      setEmployeeForm(previous => ({...previous, [key]: value})),
    updateExclusion: (key: keyof typeof exclusionForm, value: string) =>
      setExclusionForm(previous => ({...previous, [key]: value})),
    updateReplacement: (key: keyof typeof replaceForm, value: string) =>
      setReplaceForm(previous => ({...previous, [key]: value})),
    memberChoices,
    replaceChoices,
    open,
    openReplace,
    close: () => {
      if (!useDutyUiStore.getState().busy) {
        setError('');
        setModal(null);
        setEditing(null);
      }
    },
    refresh: () => {
      setError('');
      refreshData();
    },
    saveEmployee: () =>
      mutate(async () => {
        if (!employeeForm.name.trim() || !employeeForm.employeeNumber.trim())
          throw new Error('名前と社員番号を入力してください。');
        await employeesRepository.create({
          employeeNumber: employeeForm.employeeNumber.trim(),
          name: employeeForm.name.trim(),
        });
      }, 'メンバーを登録しました。当番の参加者に追加できます。'),
    toggleActive: (employee: Employee) =>
      mutate(
        () => employeesRepository.setActive(employee.id, !employee.active),
        'メンバーの状態を変更しました。確定済みの予定は保持されます。',
      ),
    saveExclusion: () =>
      mutate(async () => {
        if (!selectedDuty || !exclusionForm.employeeId || !exclusionForm.reason.trim())
          throw new Error('メンバーと対象外にする理由を入力してください。');
        validateRange(exclusionForm.startDate, exclusionForm.endDate);
        await dutiesRepository.addExclusion(selectedDuty.id, {
          ...exclusionForm,
          employeeId: Number(exclusionForm.employeeId),
        });
      }, '対象外の期間を登録しました。未確定の予定を再計算しました。'),
    saveReplacement: () =>
      mutate(async () => {
        if (!editing || !replaceForm.employeeId || !replaceForm.reason.trim())
          throw new Error('変更後の担当者と理由を入力してください。');
        await assignmentsRepository.replace(
          editing.id,
          Number(replaceForm.employeeId),
          replaceForm.reason,
        );
      }, '担当者を変更し、履歴を保存しました。以降の順番は保持されます。'),
  };
}

export type DutyManager = ReturnType<typeof useDutyManager>;
