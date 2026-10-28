import {act, cleanup, renderHook, waitFor} from '@testing-library/react';
import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import {useEmployeeManagement} from './useEmployeeManagement';
import {employeesRepository} from '@/repositories/employees/employees.repository';
import {useDutyUiStore} from '@/stores/duties/dutyUi.store';
import {useScheduleFilterStore} from '@/stores/duties/scheduleFilter.store';
vi.mock('@/repositories/employees/employees.repository', () => ({
  employeesRepository: {update: vi.fn(), remove: vi.fn(), deletionStatus: vi.fn()},
}));
const employee = {id: 1, name: '田中', employeeNumber: '001', active: true};
beforeEach(() => {
  vi.resetAllMocks();
  useDutyUiStore.setState({busy: false, revision: 0, notice: ''});
  useScheduleFilterStore.getState().reset();
});
afterEach(cleanup);
it('validates and edits names and numbers with the original values for conflict detection', async () => {
  vi.mocked(employeesRepository.update).mockResolvedValue();
  const {result} = renderHook(useEmployeeManagement);
  act(() => result.current.openEdit(employee));
  act(() => result.current.update('name', ' '));
  await act(async () => result.current.save());
  expect(employeesRepository.update).not.toHaveBeenCalled();
  act(() => {
    result.current.update('name', ' 山本 ');
    result.current.update('employeeNumber', ' 002 ');
  });
  await act(async () => result.current.save());
  expect(employeesRepository.update).toHaveBeenCalledWith(1, {
    employee: {name: '山本', employeeNumber: '002'},
    expected: {name: '田中', employeeNumber: '001'},
  });
  expect(result.current.dialog).toBeNull();
  expect(useDutyUiStore.getState().revision).toBe(1);
});
it('keeps unsaved input on server conflict', async () => {
  vi.mocked(employeesRepository.update).mockRejectedValue(new Error('社員番号が重複しています'));
  const {result} = renderHook(useEmployeeManagement);
  act(() => result.current.openEdit(employee));
  act(() => result.current.update('name', '変更後'));
  await act(async () => result.current.save());
  expect(result.current.form.name).toBe('変更後');
  expect(result.current.error).toContain('重複');
  expect(result.current.dialog?.kind).toBe('edit');
});
it('does not delete a referenced employee even if confirmation is invoked', async () => {
  vi.mocked(employeesRepository.deletionStatus).mockResolvedValue({canDelete: false});
  const {result} = renderHook(useEmployeeManagement);
  act(() => result.current.openDelete(employee));
  await waitFor(() => expect(result.current.checking).toBe(false));
  await act(async () => result.current.remove());
  expect(result.current.canDelete).toBe(false);
  expect(employeesRepository.remove).not.toHaveBeenCalled();
});
it('waits for the deletion check and clears only a matching selected-person filter after deletion', async () => {
  vi.mocked(employeesRepository.deletionStatus).mockResolvedValue({canDelete: true});
  vi.mocked(employeesRepository.remove).mockResolvedValue();
  useScheduleFilterStore.getState().setPersonId('1');
  const {result} = renderHook(useEmployeeManagement);
  act(() => result.current.openDelete(employee));
  expect(employeesRepository.remove).not.toHaveBeenCalled();
  await waitFor(() => expect(result.current.canDelete).toBe(true));
  await act(async () => result.current.remove());
  expect(employeesRepository.remove).toHaveBeenCalledWith(1);
  expect(result.current.dialog).toBeNull();
  expect(useScheduleFilterStore.getState().personId).toBe('');
});
it('supports retrying a failed deletion check', async () => {
  vi.mocked(employeesRepository.deletionStatus)
    .mockRejectedValueOnce(new Error('接続に失敗'))
    .mockResolvedValueOnce({canDelete: true});
  const {result} = renderHook(useEmployeeManagement);
  act(() => result.current.openDelete(employee));
  await waitFor(() => expect(result.current.error).toBe('接続に失敗'));
  expect(result.current.canDelete).toBeFalsy();
  act(() => result.current.retryStatus());
  await waitFor(() => expect(result.current.canDelete).toBe(true));
  expect(result.current.error).toBe('');
});
