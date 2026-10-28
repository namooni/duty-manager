import {act, cleanup, renderHook} from '@testing-library/react';
import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import {useAssignmentEditor} from './useAssignmentEditor';
import {assignmentChangesRepository as repo} from '@/repositories/assignmentChanges/assignmentChanges.repository';
import {useDutyUiStore} from '@/stores/duties/dutyUi.store';
import {
  CurrentHandling,
  type AssignmentContext,
} from '@/repositories/assignmentChanges/assignmentChanges.domain';
import {config} from '@/test/fixtures/schedule';
vi.mock('@/repositories/assignmentChanges/assignmentChanges.repository', () => ({
  assignmentChangesRepository: {preview: vi.fn()},
}));
const employees = Array.from({length: 6}, (_, i) => ({
  id: i + 1,
  name: String.fromCharCode(65 + i),
  employeeNumber: String(i + 1),
  active: true,
}));
const context: AssignmentContext = {
  duty: {...config().duty, memberIds: [1, 2, 3, 4, 5, 6], strategy: 'CUSTOM'},
  boundaries: [{index: 3, start: '2026-11-09', end: '2026-11-15'}],
  employees,
  history: [],
  currentAssignments: [
    {slotId: 13, slotIndex: 0, start: '2026-11-02', end: '2026-11-08', employee: employees[2]},
  ],
  nextCandidates: [4, 5, 6, 1, 2, 3],
  handoverDate: '2026-11-04',
};
beforeEach(() => {
  vi.resetAllMocks();
  useDutyUiStore.setState({busy: false});
  vi.mocked(repo.preview).mockResolvedValue({
    token: 'review',
    rows: [],
    currentRows: [],
    warnings: [],
    summaries: [],
    canApply: true,
  });
});
afterEach(cleanup);
function setup() {
  const hook = renderHook(() => useAssignmentEditor(context, vi.fn()));
  act(() => {
    hook.result.current.setReason('参加者変更');
    for (const id of [1, 2, 3]) hook.result.current.duty.toggleMember(id);
  });
  return hook;
}
it('defaults to finishing the current period while excluding the owner from the new roster', async () => {
  const {result} = setup();
  expect(result.current.removedCurrent.map(p => p.employee.id)).toEqual([3]);
  expect(result.current.currentHandling).toBe(CurrentHandling.CONTINUE);
  await act(async () => result.current.preview());
  expect(repo.preview).toHaveBeenCalledWith(
    expect.objectContaining({memberIds: [4, 5, 6], handovers: {}, effectiveIndex: 3}),
  );
});
it('defaults the handover to the next remaining member and keeps the first candidate automatic', async () => {
  const {result} = setup();
  act(() => result.current.setCurrentHandling(CurrentHandling.HANDOVER));
  expect(result.current.handoverRows[0].selected).toBe(4);
  await act(async () => result.current.preview());
  expect(repo.preview).toHaveBeenCalledWith(
    expect.objectContaining({handovers: {13: 4}, firstEmployeeId: null, effectiveIndex: 3}),
  );
});
it('clears an inapplicable handover from the submitted command if the owner is retained again', async () => {
  const {result} = setup();
  act(() => result.current.setCurrentHandling(CurrentHandling.HANDOVER));
  act(() => {
    result.current.setReason('参加者変更');
    result.current.duty.toggleMember(3);
  });
  expect(result.current.handoverActive).toBe(false);
  await act(async () => result.current.preview());
  expect(repo.preview).toHaveBeenCalledWith(expect.objectContaining({handovers: {}}));
});
it('selects the next valid participant if the initially suggested receiver is removed', async () => {
  const {result} = setup();
  act(() => {
    result.current.setCurrentHandling(CurrentHandling.HANDOVER);
    result.current.duty.toggleMember(4);
  });
  expect(result.current.handoverRows[0].selected).toBe(5);
  await act(async () => result.current.preview());
  expect(repo.preview).toHaveBeenCalledWith(expect.objectContaining({handovers: {13: 5}}));
});
it('does not allow a handover when the current segment has already ended', async () => {
  const {result} = renderHook(() =>
    useAssignmentEditor(
      {...context, currentAssignments: [{...context.currentAssignments![0], end: '2026-11-03'}]},
      vi.fn(),
    ),
  );
  act(() => {
    result.current.setReason('参加者変更');
    result.current.duty.toggleMember(3);
  });
  expect(result.current.handoverAvailable).toBe(false);
  act(() => result.current.setCurrentHandling(CurrentHandling.HANDOVER));
  await act(async () => result.current.preview());
  expect(repo.preview).not.toHaveBeenCalled();
  expect(result.current.review.error).toContain('残りの担当期間');
});

it('offers handover when a previously excluded owner is still finishing the current period', async () => {
  const {result} = renderHook(() =>
    useAssignmentEditor({...context, duty: {...context.duty, memberIds: [4, 5, 6]}}, vi.fn()),
  );
  expect(result.current.removedCurrent.map(p => p.employee.id)).toEqual([3]);
  act(() => {
    result.current.setReason('継続から引継ぎへ');
    result.current.setCurrentHandling(CurrentHandling.HANDOVER);
  });
  await act(async () => result.current.preview());
  expect(repo.preview).toHaveBeenCalledWith(
    expect.objectContaining({memberIds: [4, 5, 6], handovers: {13: 4}}),
  );
});

it('allows immediate handover on the final day of the current assignment', async () => {
  const {result} = renderHook(() =>
    useAssignmentEditor(
      {...context, currentAssignments: [{...context.currentAssignments![0], end: '2026-11-04'}]},
      vi.fn(),
    ),
  );
  act(() => {
    result.current.setReason('本日から引継ぎ');
    result.current.duty.toggleMember(3);
    result.current.setCurrentHandling(CurrentHandling.HANDOVER);
  });
  expect(result.current.handoverAvailable).toBe(true);
  await act(async () => result.current.preview());
  expect(repo.preview).toHaveBeenCalledWith(expect.objectContaining({handovers: {13: 4}}));
});

it('restores the original participant before the receiver and previews an immediate restoration', async () => {
  const returning = {
    ...context,
    duty: {...context.duty, memberIds: [4, 5, 6]},
    currentAssignments: [
      {...context.currentAssignments![0], employee: employees[3], originalEmployeeId: 3},
    ],
  };
  const {result} = renderHook(() => useAssignmentEditor(returning, vi.fn()));
  act(() => {
    result.current.duty.toggleMember(3);
    result.current.setReason('除外を取り消し');
  });
  expect(result.current.duty.form.memberIds).toEqual([3, 4, 5, 6]);
  expect(result.current.restorationRows[0].original.id).toBe(3);
  expect(result.current.handoverActive).toBe(true);
  await act(async () => result.current.preview());
  expect(repo.preview).toHaveBeenCalledWith(
    expect.objectContaining({memberIds: [3, 4, 5, 6], effectiveIndex: 3, firstEmployeeId: null}),
  );
  act(() => result.current.duty.toggleMember(3));
  expect(result.current.restorationRows).toEqual([]);
  expect(result.current.handoverActive).toBe(false);
});
