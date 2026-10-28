import {act, cleanup, renderHook} from '@testing-library/react';
import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import {useAssignmentReview} from './useAssignmentReview';
import {assignmentChangesRepository as repo} from '@/repositories/assignmentChanges/assignmentChanges.repository';
import {useDutyUiStore} from '@/stores/duties/dutyUi.store';
import {ApiError} from '@/apis/types';
import type {
  AssignmentChangeInput,
  AssignmentReview,
} from '@/repositories/assignmentChanges/assignmentChanges.domain';
vi.mock('@/repositories/assignmentChanges/assignmentChanges.repository', () => ({
  assignmentChangesRepository: {preview: vi.fn(), confirm: vi.fn()},
}));
const input: AssignmentChangeInput = {
  kind: 'STATUS',
  dutyId: null,
  employeeId: 4,
  active: false,
  effectiveIndex: null,
  strategy: null,
  assigneeCount: null,
  memberIds: [],
  firstEmployeeId: null,
  reason: '退職',
  replacements: {},
};
const preview: AssignmentReview = {
  token: 'first',
  rows: [],
  warnings: [],
  summaries: [],
  canApply: true,
};
beforeEach(() => {
  vi.resetAllMocks();
  useDutyUiStore.setState({busy: false, revision: 0, notice: ''});
  vi.mocked(repo.preview).mockResolvedValue(preview);
  vi.mocked(repo.confirm).mockResolvedValue();
});
afterEach(cleanup);
it('does not write while previewing or returning to the form', async () => {
  const saved = vi.fn();
  const {result} = renderHook(() => useAssignmentReview(saved));
  await act(async () => result.current.preview(input));
  expect(repo.confirm).not.toHaveBeenCalled();
  act(() => result.current.back());
  expect(result.current.review).toBeNull();
  expect(saved).not.toHaveBeenCalled();
  expect(useDutyUiStore.getState().revision).toBe(0);
});
it('submits exactly the reviewed command and token once then refreshes', async () => {
  const saved = vi.fn();
  const {result} = renderHook(() => useAssignmentReview(saved));
  await act(async () => result.current.preview(input));
  await act(async () => result.current.confirm());
  expect(repo.confirm).toHaveBeenCalledExactlyOnceWith(input, 'first');
  expect(saved).toHaveBeenCalledOnce();
  expect(useDutyUiStore.getState().revision).toBe(1);
});
it('requires a fresh review after a concurrent update', async () => {
  vi.mocked(repo.confirm).mockRejectedValueOnce(new ApiError('CONFLICT', '更新されています', 409));
  const {result} = renderHook(() => useAssignmentReview(vi.fn()));
  await act(async () => result.current.preview(input));
  await act(async () => result.current.confirm());
  expect(result.current.stale).toBe(true);
  await act(async () => result.current.confirm());
  expect(repo.confirm).toHaveBeenCalledTimes(1);
  vi.mocked(repo.preview).mockResolvedValue({...preview, token: 'fresh'});
  await act(async () => result.current.retry());
  expect(result.current.stale).toBe(false);
  await act(async () => result.current.confirm());
  expect(repo.confirm).toHaveBeenLastCalledWith(input, 'fresh');
});
it('re-previews manual resolutions and confirms the revised command only', async () => {
  vi.mocked(repo.preview)
    .mockResolvedValueOnce({...preview, canApply: false})
    .mockResolvedValueOnce({...preview, token: 'resolved'});
  const {result} = renderHook(() => useAssignmentReview(vi.fn()));
  await act(async () => result.current.preview(input));
  await act(async () => result.current.confirm());
  expect(repo.confirm).not.toHaveBeenCalled();
  await act(async () => result.current.resolve('1:C:3:0', 9));
  await act(async () => result.current.confirm());
  expect(repo.confirm).toHaveBeenCalledWith({...input, replacements: {'1:C:3:0': 9}}, 'resolved');
});
