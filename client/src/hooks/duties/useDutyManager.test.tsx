import {act, cleanup, renderHook, waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import type {ReactNode} from 'react';
import {useDutyManager} from './useDutyManager';
import {useDutyUiStore} from '@/stores/duties/dutyUi.store';
import {employeesRepository} from '@/repositories/employees/employees.repository';
import {dutiesRepository} from '@/repositories/duties/duties.repository';
import {assignmentsRepository} from '@/repositories/assignments/assignments.repository';
import {systemRepository} from '@/repositories/system/system.repository';

vi.mock('@/repositories/employees/employees.repository', () => ({
  employeesRepository: {list: vi.fn(), create: vi.fn(), setActive: vi.fn()},
}));
vi.mock('@/repositories/duties/duties.repository', () => ({
  dutiesRepository: {
    list: vi.fn(),
    create: vi.fn(),
    previewDraft: vi.fn(),
    createConfirmed: vi.fn(),
    preview: vi.fn(),
    exclusions: vi.fn(),
    confirm: vi.fn(),
    addExclusion: vi.fn(),
  },
}));
vi.mock('@/repositories/assignments/assignments.repository', () => ({
  assignmentsRepository: {list: vi.fn(), changes: vi.fn(), replace: vi.fn()},
}));
vi.mock('@/repositories/system/system.repository', () => ({systemRepository: {info: vi.fn()}}));
const employee = {id: 1, employeeNumber: '001', name: '田中', active: true};
const duty = {
  id: 1,
  name: '朝会',
  description: '',
  anchorDate: '2026-10-26',
  intervalCount: 1,
  intervalUnit: 'WEEK' as const,
  strategy: 'CUSTOM' as const,
  assigneeCount: 1,
  memberIds: [1],
};
function wrapper({children}: {children: ReactNode}) {
  return <MemoryRouter>{children}</MemoryRouter>;
}
beforeEach(() => {
  vi.resetAllMocks();
  useDutyUiStore.setState({
    selectedId: null,
    from: '2026-10-26',
    to: '2026-11-30',
    rangeInitialized: true,
    busy: false,
    error: '',
    notice: '',
    revision: 0,
  });
  vi.mocked(systemRepository.info).mockResolvedValue({today: '2026-10-26', zone: 'Asia/Tokyo'});
  vi.mocked(employeesRepository.list).mockResolvedValue([employee]);
  vi.mocked(employeesRepository.create).mockResolvedValue({id: 2});
  vi.mocked(dutiesRepository.list).mockResolvedValue([duty]);
  vi.mocked(dutiesRepository.exclusions).mockResolvedValue([]);
  vi.mocked(dutiesRepository.preview).mockResolvedValue({
    token: 'token',
    periods: [
      {
        start: '2026-10-26',
        end: '2026-11-01',
        assignees: [employee],
        confirmed: false,
        warning: null,
      },
    ],
  });
  vi.mocked(assignmentsRepository.list).mockResolvedValue([]);
});
afterEach(cleanup);
describe('duty view-model', () => {
  it('validates a form in the hook and reloads after a successful mutation', async () => {
    const {result} = renderHook(useDutyManager, {wrapper});
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.open('employee'));
    await act(async () => {
      await result.current.saveEmployee();
    });
    expect(employeesRepository.create).not.toHaveBeenCalled();
    expect(result.current.error).toBe('名前と社員番号を入力してください。');
    act(() => {
      result.current.updateEmployee('name', ' 佐藤 ');
      result.current.updateEmployee('employeeNumber', ' 002 ');
    });
    await act(async () => {
      await result.current.saveEmployee();
    });
    expect(employeesRepository.create).toHaveBeenCalledWith({name: '佐藤', employeeNumber: '002'});
    expect(result.current.modal).toBeNull();
    expect(employeesRepository.list).toHaveBeenCalledTimes(2);
  });
  it('does not overwrite the latest range with an aborted old request', async () => {
    let resolveOld!: (value: (typeof employee)[]) => void;
    vi.mocked(employeesRepository.list).mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveOld = resolve;
        }),
    );
    const {result} = renderHook(useDutyManager, {wrapper});
    act(() => result.current.setFrom('2026-10-27'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => resolveOld([{...employee, name: '古い応答'}]));
    expect(result.current.employees[0].name).toBe('田中');
  });
  it('keeps the selected range across page unmounts', async () => {
    const first = renderHook(useDutyManager, {wrapper});
    await waitFor(() => expect(first.result.current.loading).toBe(false));
    act(() => first.result.current.setFrom('2026-10-28'));
    first.unmount();
    const second = renderHook(useDutyManager, {wrapper});
    await waitFor(() => expect(second.result.current.loading).toBe(false));
    expect(second.result.current.from).toBe('2026-10-28');
  });
});

it('keeps member rows mounted in the view model during a slow status-change reload', async () => {
  vi.mocked(employeesRepository.setActive).mockResolvedValue();
  const {result} = renderHook(() => useDutyManager(false), {wrapper});
  await waitFor(() => expect(result.current.loading).toBe(false));
  let resolve!: (people: (typeof employee)[]) => void;
  vi.mocked(employeesRepository.list).mockImplementationOnce(
    () =>
      new Promise(yes => {
        resolve = yes;
      }),
  );
  await act(async () => result.current.toggleActive(employee));
  expect(result.current.loading).toBe(false);
  expect(result.current.refreshing).toBe(true);
  expect(result.current.employees[0].id).toBe(1);
  await act(async () => resolve([{...employee, active: false}]));
  await waitFor(() => expect(result.current.refreshing).toBe(false));
  expect(result.current.employees[0].active).toBe(false);
});
