import {useEffect, useState} from 'react';
import type {Employee, EmployeeInput} from '@/repositories/employees/employees.domain';
import {employeesRepository} from '@/repositories/employees/employees.repository';
import {useExclusiveAction} from '@/hooks/common/useExclusiveAction';
import {useDutyUiStore} from '@/stores/duties/dutyUi.store';
import {useScheduleFilterStore} from '@/stores/duties/scheduleFilter.store';
import {validateEmployeeInput} from '@/utils/validation/employee';
import {getErrorMessage} from '@/utils/errors/message';
type Dialog = Readonly<{kind: 'edit' | 'delete'; employee: Employee}> | null;
export function useEmployeeManagement() {
  const [dialog, setDialog] = useState<Dialog>(null),
    [form, setForm] = useState<EmployeeInput>({name: '', employeeNumber: ''});
  const [deletionStatus, setDeletionStatus] = useState<{id: number; canDelete: boolean} | null>(
    null,
  );
  const [checking, setChecking] = useState(false),
    [statusVersion, setStatusVersion] = useState(0);
  const {busy, error, setError, run} = useExclusiveAction();
  const deletingId = dialog?.kind === 'delete' ? dialog.employee.id : null;
  useEffect(() => {
    if (deletingId === null) return;
    const controller = new AbortController();
    setChecking(true);
    setDeletionStatus(null);
    setError('');
    employeesRepository
      .deletionStatus(deletingId, controller.signal)
      .then(status => {
        if (!controller.signal.aborted)
          setDeletionStatus({id: deletingId, canDelete: status.canDelete});
      })
      .catch(cause => {
        if (!controller.signal.aborted) setError(getErrorMessage(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setChecking(false);
      });
    return () => controller.abort();
  }, [deletingId, statusVersion, setError]);
  const canDelete =
    deletingId !== null && deletionStatus?.id === deletingId && deletionStatus.canDelete;
  function open(kind: 'edit' | 'delete', employee: Employee) {
    if (useDutyUiStore.getState().busy) return;
    setError('');
    setForm({name: employee.name, employeeNumber: employee.employeeNumber});
    setDeletionStatus(null);
    setChecking(kind === 'delete');
    setDialog({kind, employee});
  }
  function finish(message: string) {
    setDialog(null);
    const ui = useDutyUiStore.getState();
    ui.setNotice(message);
    ui.refreshData();
  }
  return {
    dialog,
    form,
    busy,
    error,
    checking,
    canDelete,
    statusLoaded: deletionStatus?.id === deletingId,
    openEdit: (employee: Employee) => open('edit', employee),
    openDelete: (employee: Employee) => open('delete', employee),
    close: () => {
      if (!useDutyUiStore.getState().busy) {
        setDialog(null);
        setError('');
      }
    },
    update: (key: keyof EmployeeInput, value: string) =>
      setForm(previous => ({...previous, [key]: value})),
    retryStatus: () => {
      if (!useDutyUiStore.getState().busy) setStatusVersion(value => value + 1);
    },
    save: () =>
      run(
        async () => {
          if (dialog?.kind !== 'edit') throw new Error('編集対象を選択してください。');
          await employeesRepository.update(dialog.employee.id, {
            employee: validateEmployeeInput(form),
            expected: {name: dialog.employee.name, employeeNumber: dialog.employee.employeeNumber},
          });
        },
        () => finish('メンバー情報を保存しました。'),
      ),
    remove: async () => {
      if (dialog?.kind !== 'delete' || !canDelete || checking) return;
      await run(
        () => employeesRepository.remove(dialog.employee.id),
        () => {
          const filter = useScheduleFilterStore.getState();
          if (filter.personId === String(dialog.employee.id)) filter.setPersonId('');
          finish('「' + dialog.employee.name + '」を削除しました。');
        },
      );
    },
  };
}
export type EmployeeManagement = ReturnType<typeof useEmployeeManagement>;
