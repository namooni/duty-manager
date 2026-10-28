import {act, cleanup, renderHook} from '@testing-library/react';
import {afterEach, beforeEach, expect, it} from 'vitest';
import {useScheduleFilters} from './useScheduleFilters';
import {useScheduleFilterStore} from '@/stores/duties/scheduleFilter.store';
const employees = [
  {id: 1, name: '田中', employeeNumber: '001', active: true},
  {id: 2, name: '田中', employeeNumber: '002', active: false},
];
beforeEach(() => useScheduleFilterStore.getState().reset());
afterEach(cleanup);
it('distinguishes duplicate names by ID and keeps inactive employees searchable', () => {
  const {result} = renderHook(() => useScheduleFilters(employees));
  act(() => result.current.setPersonQuery('００２'));
  expect(result.current.choices).toEqual([{id: '2', label: '田中（002） · 無効'}]);
  act(() => result.current.setPersonId('2'));
  expect(result.current.personQuery).toBe('');
  expect(result.current.personLabel).toBe('田中（002）');
  const assignments = [
    {
      id: 1,
      dutyId: 1,
      dutyName: '朝会',
      periodStart: '2026-10-01',
      periodEnd: '2026-10-07',
      employeeId: 1,
      employeeName: '田中',
      slotIndex: 0,
    },
    {
      id: 2,
      dutyId: 1,
      dutyName: '朝会',
      periodStart: '2026-10-08',
      periodEnd: '2026-10-14',
      employeeId: 2,
      employeeName: '田中',
      slotIndex: 0,
    },
  ];
  expect(result.current.filterLegacy(assignments).map(a => a.id)).toEqual([2]);
});
it('preserves UI filters across page unmounts and clears selection when a new search starts', () => {
  const first = renderHook(() => useScheduleFilters(employees));
  act(() => {
    first.result.current.setDutyId('3');
    first.result.current.setPersonId('1');
  });
  first.unmount();
  const second = renderHook(() => useScheduleFilters(employees));
  expect(second.result.current.dutyId).toBe('3');
  expect(second.result.current.personId).toBe('1');
  act(() => second.result.current.setPersonQuery('002'));
  expect(second.result.current.personId).toBe('');
  act(() => second.result.current.reset());
  expect(second.result.current.hasFilters).toBe(false);
});

it('selects all matching duty IDs even when a previously selected ID is not the representative', () => {
  const base = {
    name: '定例会',
    description: '',
    anchorDate: '2026-10-01',
    intervalCount: 1,
    intervalUnit: 'MONTH' as const,
    strategy: 'CUSTOM' as const,
    assigneeCount: 1,
    memberIds: [1, 2],
  };
  const {result} = renderHook(() =>
    useScheduleFilters(employees, [
      {...base, id: 4},
      {...base, id: 3},
      {...base, id: 2},
    ]),
  );
  act(() => {
    result.current.setDutyId('2');
    result.current.setPersonId('1');
  });
  expect(result.current.selectedDutyValue).toBe('4');
  expect(result.current.dutyChoices).toHaveLength(1);
  const legacy = (dutyId: number, employeeId: number) => ({
    id: dutyId,
    dutyId,
    dutyName: '定例会',
    periodStart: '2026-10-01',
    periodEnd: '2026-10-31',
    employeeId,
    employeeName: '田中',
    slotIndex: 0,
  });
  expect(
    result.current
      .filterLegacy([legacy(4, 1), legacy(3, 1), legacy(2, 2), legacy(9, 1)])
      .map(a => a.dutyId),
  ).toEqual([4, 3]);
  act(() => useScheduleFilterStore.getState().focusDuty(2));
  expect(result.current.selectedDutyValue).toBe('exact:2');
  expect(result.current.personId).toBe('');
  expect(
    result.current.filterLegacy([legacy(4, 1), legacy(3, 1), legacy(2, 2)]).map(a => a.dutyId),
  ).toEqual([2]);
  act(() => result.current.setDutyId('4'));
  expect(
    result.current.filterLegacy([legacy(4, 1), legacy(3, 1), legacy(2, 2)]).map(a => a.dutyId),
  ).toEqual([4, 3, 2]);
});
