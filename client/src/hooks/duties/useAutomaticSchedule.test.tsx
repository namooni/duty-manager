import {act, cleanup, renderHook, waitFor} from '@testing-library/react';
import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import {assignmentChangesRepository as changesRepo} from '@/repositories/assignmentChanges/assignmentChanges.repository';
import {useAutomaticSchedule} from './useAutomaticSchedule';
import {automaticRepository} from '@/repositories/automatic/automatic.repository';
import {useScheduleFilterStore} from '@/stores/duties/scheduleFilter.store';
import {useDutyUiStore} from '@/stores/duties/dutyUi.store';
import {config, employee, occurrence, schedule} from '@/test/fixtures/schedule';
vi.mock('@/repositories/automatic/automatic.repository', () => ({
  automaticRepository: {
    schedule: vi.fn(),
    dutySchedule: vi.fn(),
    holidays: vi.fn(),
    changes: vi.fn(),
    meeting: vi.fn(),
    replacementChoices: vi.fn(),
    replace: vi.fn(),
  },
}));
vi.mock('@/repositories/assignmentChanges/assignmentChanges.repository', () => ({
  assignmentChangesRepository: {context: vi.fn(), preview: vi.fn(), confirm: vi.fn()},
}));
vi.mock('@/repositories/scheduleDates/scheduleDates.repository', () => ({
  scheduleDatesRepository: {history: vi.fn().mockResolvedValue([])},
}));
const people = [
  {id: 1, name: '田中', employeeNumber: '001', active: true},
  {id: 2, name: '鈴木', employeeNumber: '002', active: true},
];
beforeEach(() => {
  vi.resetAllMocks();
  useScheduleFilterStore.getState().reset();
  useDutyUiStore.setState({busy: false});
  vi.mocked(automaticRepository.holidays).mockResolvedValue([]);
  vi.mocked(automaticRepository.changes).mockResolvedValue([]);
  vi.mocked(automaticRepository.replacementChoices).mockResolvedValue(people);
  vi.mocked(automaticRepository.schedule).mockResolvedValue(
    schedule([
      occurrence({
        assignees: [employee, {slotId: 2, employeeId: 2, name: '鈴木', employeeNumber: '002'}],
      }),
      occurrence({
        sequence: 1,
        date: '2026-10-27',
        assignees: [employee, {slotId: 2, employeeId: 2, name: '鈴木', employeeNumber: '002'}],
      }),
      occurrence({
        dutyId: 2,
        dutyName: '議事録',
        sequence: 2,
        rotationMode: 'OCCURRENCE',
        rotationKey: 'E:0',
        assignees: [{slotId: 3, employeeId: 2, name: '鈴木', employeeNumber: '002'}],
      }),
    ]),
  );
});
afterEach(cleanup);
it('filters before grouping, preserves co-assignees, and never narrows the overview data', async () => {
  const {result} = renderHook(() =>
    useAutomaticSchedule('2026-10-26', '2026-12-06', 0, people, '2026-10-26'),
  );
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.rows).toHaveLength(2);
  act(() => result.current.setPersonQuery('００１'));
  expect(result.current.rows).toHaveLength(1);
  expect(result.current.rows[0].events).toHaveLength(2);
  expect(result.current.rows[0].assignees).toHaveLength(2);
  expect(result.current.isAssigneeMatch(employee)).toBe(true);
  expect(result.current.isAssigneeMatch({employeeId: 2, name: '鈴木', employeeNumber: '002'})).toBe(
    false,
  );
  expect(result.current.scheduleData.occurrences).toHaveLength(3);
  act(() => result.current.setFilter('2'));
  expect(result.current.rows).toHaveLength(0);
  act(() => result.current.resetFilters());
  expect(result.current.rows).toHaveLength(2);
  expect(automaticRepository.schedule).toHaveBeenCalledOnce();
});
it('keeps user selection when the view data is refreshed', async () => {
  const {result, rerender} = renderHook(
    ({revision}) =>
      useAutomaticSchedule('2026-10-26', '2026-12-06', revision, people, '2026-10-26'),
    {initialProps: {revision: 0}},
  );
  await waitFor(() => expect(result.current.loading).toBe(false));
  act(() => result.current.setPersonId('2'));
  rerender({revision: 1});
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.personId).toBe('2');
  expect(result.current.rows).toHaveLength(2);
});

it('loads the entire year for one duty without consuming or changing schedule-list filters', async () => {
  useScheduleFilterStore.getState().setDutyId('99');
  useScheduleFilterStore.getState().setPersonId('99');
  vi.mocked(automaticRepository.dutySchedule).mockResolvedValue(schedule([occurrence()]));
  const {result} = renderHook(() =>
    useAutomaticSchedule('2026-01-01', '2026-12-31', 0, people, '2026-10-26', {dutyId: 1}),
  );
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(automaticRepository.dutySchedule).toHaveBeenCalledWith(
    1,
    '2026-01-01',
    '2026-12-31',
    expect.any(AbortSignal),
  );
  expect(automaticRepository.schedule).not.toHaveBeenCalled();
  expect(result.current.rows).toHaveLength(1);
  expect(useScheduleFilterStore.getState().dutyId).toBe('99');
  expect(useScheduleFilterStore.getState().personId).toBe('99');
});

it('registers a pending meeting inside the chosen month using its existing sequence and assignee', async () => {
  const event = occurrence({
    sequence: 1,
    date: null,
    rotationMode: 'OCCURRENCE',
    rotationKey: 'E:1',
    periodStart: null,
    periodEnd: null,
  });
  const base = config();
  const data = {
    occurrences: [event],
    duties: [
      {
        ...base,
        schedule: {...base.schedule, recurrence: 'EXPLICIT_DATES' as const},
        meetings: [
          {sequence: 0, date: '2027-08-20'},
          {sequence: 1, date: null},
        ],
      },
    ],
  };
  vi.mocked(automaticRepository.dutySchedule).mockResolvedValue(data);
  vi.mocked(automaticRepository.meeting).mockResolvedValue();
  const {result} = renderHook(() =>
    useAutomaticSchedule('2027-01-01', '2027-12-31', 0, people, '2026-10-26', {dutyId: 1}),
  );
  await waitFor(() => expect(result.current.loading).toBe(false));
  act(() => result.current.openMeeting(event, '2027-09'));
  expect(result.current.date).toBe('2027-09-01');
  expect(result.current.meetingRange).toEqual({
    min: '2027-09-01',
    max: '2027-09-30',
    available: true,
  });
  expect(
    result.current.dialog?.kind === 'meeting' && result.current.dialog.event.assignees,
  ).toEqual([employee]);
  act(() => result.current.setDate('2027-08-15'));
  await act(async () => result.current.saveMeeting());
  expect(automaticRepository.meeting).not.toHaveBeenCalled();
  expect(result.current.dialog?.kind).toBe('meeting');
  act(() => result.current.setDate('2027-09-17'));
  await act(async () => result.current.saveMeeting());
  expect(automaticRepository.meeting).toHaveBeenCalledWith(1, 1, '2027-09-17');
  expect(result.current.dialog).toBeNull();
});

it('retains visible schedule rows through a same-period refresh, including an empty response', async () => {
  const {result, rerender} = renderHook(
    ({revision}) =>
      useAutomaticSchedule('2026-10-26', '2026-12-06', revision, people, '2026-10-26'),
    {initialProps: {revision: 0}},
  );
  await waitFor(() => expect(result.current.loading).toBe(false));
  const rows = result.current.rows.length;
  let resolve!: (data: ReturnType<typeof schedule>) => void;
  vi.mocked(automaticRepository.schedule).mockImplementationOnce(
    () =>
      new Promise(yes => {
        resolve = yes;
      }),
  );
  rerender({revision: 1});
  expect(result.current.loading).toBe(false);
  expect(result.current.refreshing).toBe(true);
  expect(result.current.rows).toHaveLength(rows);
  await waitFor(() => expect(automaticRepository.schedule).toHaveBeenCalledTimes(2));
  await act(async () => resolve(schedule([])));
  expect(result.current.hasData).toBe(true);
  expect(result.current.rows).toHaveLength(0);
  expect(result.current.refreshing).toBe(false);
});

it('reviews current calendar replacement with the full roster and confirms the shared handover command', async () => {
  const event = occurrence();
  vi.mocked(changesRepo.context).mockResolvedValue({
    duty: config().duty,
    employees: people,
    boundaries: [{index: 1, start: '2026-11-02', end: '2026-11-08'}],
    history: [],
    currentAssignments: [
      {
        slotId: 1,
        slotIndex: 0,
        start: event.periodStart!,
        end: event.periodEnd!,
        employee: people[0],
      },
    ],
  });
  vi.mocked(changesRepo.preview).mockResolvedValue({
    token: 'reviewed-handover',
    rows: [],
    currentRows: [],
    warnings: [],
    summaries: [],
    canApply: true,
  });
  vi.mocked(changesRepo.confirm).mockResolvedValue();
  const {result} = renderHook(() =>
    useAutomaticSchedule('2026-10-26', '2026-12-06', 0, people, '2026-10-28'),
  );
  await waitFor(() => expect(result.current.loading).toBe(false));
  act(() => result.current.openReplacement(event, employee));
  await waitFor(() => expect(result.current.historyLoading).toBe(false));
  act(() => {
    result.current.setEmployeeId('2');
    result.current.setReason('本日から引継ぎ');
  });
  await act(async () => result.current.saveReplacement());
  expect(automaticRepository.replace).not.toHaveBeenCalled();
  expect(changesRepo.confirm).not.toHaveBeenCalled();
  expect(changesRepo.preview).toHaveBeenCalledWith(
    expect.objectContaining({memberIds: [1, 2], handovers: {1: 2}, effectiveIndex: 1}),
  );
  expect(result.current.dialog?.kind).toBe('replace');
  await act(async () => result.current.handover.confirm());
  expect(changesRepo.confirm).toHaveBeenCalledWith(
    expect.objectContaining({handovers: {1: 2}}),
    'reviewed-handover',
  );
  expect(result.current.dialog).toBeNull();
});
it('keeps a future one-off replacement separate from the current handover workflow', async () => {
  const event = occurrence({
    date: '2026-11-02',
    periodStart: '2026-11-02',
    periodEnd: '2026-11-08',
  });
  vi.mocked(automaticRepository.replace).mockResolvedValue();
  const {result} = renderHook(() =>
    useAutomaticSchedule('2026-10-26', '2026-12-06', 0, people, '2026-10-28'),
  );
  await waitFor(() => expect(result.current.loading).toBe(false));
  act(() => result.current.openReplacement(event, employee));
  await waitFor(() => expect(result.current.historyLoading).toBe(false));
  act(() => {
    result.current.setEmployeeId('2');
    result.current.setReason('代理');
  });
  await act(async () => result.current.saveReplacement());
  expect(automaticRepository.replace).toHaveBeenCalledWith(1, 2, '代理', '2026-11-02');
  expect(changesRepo.preview).not.toHaveBeenCalled();
});
