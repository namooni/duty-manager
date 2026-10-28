import {useRetainedRequest} from '@/hooks/common/useRetainedRequest';
import {validateEmployeeInput} from '@/utils/validation/employee';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {employeesRepository} from '@/repositories/employees/employees.repository';
import {dutiesRepository} from '@/repositories/duties/duties.repository';
import {assignmentsRepository} from '@/repositories/assignments/assignments.repository';
import {systemRepository} from '@/repositories/system/system.repository';
import {getErrorMessage as message} from '@/utils/errors/message';
import {ApiError} from '@/apis/types';
import {useScheduleFilterStore} from '@/stores/duties/scheduleFilter.store';
import {useDutyUiStore} from '@/stores/duties/dutyUi.store';
import {useAppNavigation} from '@/hooks/navigation/useAppNavigation';
import {getTokyoToday} from '@/libs/clock';
import {addDays as daysAfter} from '@/utils/format/date';
import {validateRange} from '@/utils/validation/dateRange';
import type {Assignment, Change} from '@/repositories/assignments/assignments.domain';
import type {Duty} from '@/repositories/duties/duties.domain';
import type {Employee} from '@/repositories/employees/employees.domain';
import type {Modal} from '@/types/ui';

const emptyEmployees: readonly Employee[] = [];
const emptyDuties: readonly Duty[] = [];
const emptyAssignments: readonly Assignment[] = [];
export function useDutyManager(loadSchedule = true) {
  const [today, setToday] = useState(getTokyoToday);
  const [zone, setZone] = useState('Asia/Tokyo');
  const {page, setPage} = useAppNavigation();
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

  const [modal, setModal] = useState<Modal>(null);
  const [employeeForm, setEmployeeForm] = useState({name: '', employeeNumber: ''});
  const [replaceForm, setReplaceForm] = useState({employeeId: '', reason: ''});
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [changes, setChanges] = useState<readonly Change[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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
  const queryFrom = loadSchedule ? from : '',
    queryTo = loadSchedule ? to : '';
  const load = useCallback(
    async (signal: AbortSignal) => {
      if (loadSchedule) validateRange(queryFrom, queryTo);
      const [employees, duties, assignments] = await Promise.all([
        employeesRepository.list(signal),
        dutiesRepository.list(signal),
        loadSchedule ? assignmentsRepository.list(queryFrom, queryTo, signal) : Promise.resolve([]),
      ]);
      return {employees, duties, assignments};
    },
    [loadSchedule, queryFrom, queryTo],
  );
  const directory = useRetainedRequest(
    loadSchedule ? queryFrom + ':' + queryTo : 'directory',
    load,
    revision,
  );
  const employees: readonly Employee[] = directory.data?.employees ?? emptyEmployees;
  const duties: readonly Duty[] = directory.data?.duties ?? emptyDuties;
  const assignments: readonly Assignment[] = directory.data?.assignments ?? emptyAssignments;
  const selectedDuty = duties.find(duty => duty.id === selectedId) ?? null;
  useEffect(() => {
    if (!directory.data) return;
    const tasks = directory.data.duties;
    setSelectedId(previous =>
      tasks.some(task => task.id === previous) ? previous : (tasks[0]?.id ?? null),
    );
  }, [directory.data, setSelectedId]);
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
    if (useDutyUiStore.getState().busy || directory.pending) return;

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
    setModal(next);
  }
  function openReplace(assignment: Assignment) {
    setEditing(assignment);
    setChanges([]);
    setReplaceForm({employeeId: '', reason: ''});
    open('replace');
  }
  const activeEmployees = employees.filter(employee => employee.active);
  const replaceChoices = activeEmployees.filter(employee => {
    const task = duties.find(duty => duty.id === editing?.dutyId);
    return task?.memberIds.includes(employee.id) && employee.id !== editing?.employeeId;
  });
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
      useScheduleFilterStore.getState().focusDuty(id);
      setModal(null);
      setNotice('当番と指定期間の担当予定を作成しました。続きは当番詳細から追加できます。');
      refreshData();
      setPage('schedule');
    },
    revision,
    primaryLabel: page === 'employees' ? 'メンバーを追加' : '当番を作成',
    openPrimary: () => open(page === 'employees' ? 'employee' : 'duty'),
    showDuty: (id: number) => {
      useScheduleFilterStore.getState().focusDuty(id);
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
    assignments,
    loading: directory.loading,
    refreshing: directory.refreshing,
    busy: busy || directory.refreshing,
    error: error || directory.error,
    notice,
    modal,
    employeeForm,
    replaceForm,
    editing,
    changes,
    historyLoading,
    updateEmployee: (key: keyof typeof employeeForm, value: string) =>
      setEmployeeForm(previous => ({...previous, [key]: value})),
    updateReplacement: (key: keyof typeof replaceForm, value: string) =>
      setReplaceForm(previous => ({...previous, [key]: value})),
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
        await employeesRepository.create(validateEmployeeInput(employeeForm));
      }, 'メンバーを登録しました。当番の参加者に追加できます。'),
    toggleActive: (employee: Employee) =>
      mutate(
        () => employeesRepository.setActive(employee.id, !employee.active),
        'メンバーの状態を変更しました。確定済みの予定は保持されます。',
      ),
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
