import {act, cleanup, renderHook} from '@testing-library/react';
import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import {useScheduleExtension} from './useScheduleExtension';
import {automaticRepository as repo} from '@/repositories/automatic/automatic.repository';
import {config} from '@/test/fixtures/schedule';
import {useDutyUiStore} from '@/stores/duties/dutyUi.store';
import {ApiError} from '@/apis/types';
vi.mock('@/repositories/automatic/automatic.repository', () => ({
  automaticRepository: {allocationPreview: vi.fn(), allocate: vi.fn()},
}));
const duty = {...config(), range: {endDate: null, plannedThrough: '2026-12-31'}};
const preview = {
  token: 'reviewed',
  turns: [],
  range: {endDate: null, plannedThrough: '2027-12-31'},
};
beforeEach(() => {
  vi.resetAllMocks();
  useDutyUiStore.setState({busy: false, revision: 0, notice: ''});
  vi.mocked(repo.allocationPreview).mockResolvedValue(preview);
  vi.mocked(repo.allocate).mockResolvedValue();
});
afterEach(cleanup);
it('previews an explicit window without saving and returns to the same draft', async () => {
  const {result} = renderHook(() => useScheduleExtension(duty, vi.fn()));
  act(() => result.current.setPlannedThrough('2027-03-31'));
  await act(async () => result.current.preview());
  expect(repo.allocationPreview).toHaveBeenCalledWith(duty.duty.id, {
    plannedThrough: '2027-03-31',
    additionalMeetings: 0,
  });
  expect(repo.allocate).not.toHaveBeenCalled();
  act(() => result.current.back());
  expect(result.current.plannedThrough).toBe('2027-03-31');
  expect(result.current.review).toBeNull();
});
it('confirms exactly the reviewed range then refreshes the page data', async () => {
  const saved = vi.fn();
  const {result} = renderHook(() => useScheduleExtension(duty, saved));
  await act(async () => result.current.preview());
  act(() => result.current.setPlannedThrough('2028-12-31'));
  await act(async () => result.current.confirm());
  expect(repo.allocate).toHaveBeenCalledWith(
    duty.duty.id,
    {plannedThrough: '2027-12-31', additionalMeetings: 0},
    'reviewed',
  );
  expect(saved).toHaveBeenCalledOnce();
  expect(useDutyUiStore.getState().revision).toBe(1);
});
it('requires another preview after a conflict', async () => {
  vi.mocked(repo.allocate).mockRejectedValueOnce(new ApiError('CONFLICT', '変更済み', 409));
  const {result} = renderHook(() => useScheduleExtension(duty, vi.fn()));
  await act(async () => result.current.preview());
  await act(async () => result.current.confirm());
  expect(result.current.stale).toBe(true);
  expect(result.current.canApply).toBe(false);
  await act(async () => result.current.confirm());
  expect(repo.allocate).toHaveBeenCalledTimes(1);
  await act(async () => result.current.preview());
  expect(result.current.canApply).toBe(true);
});
it('rejects a window beyond the operating end before transport', async () => {
  const {result} = renderHook(() =>
    useScheduleExtension(
      {...duty, range: {endDate: '2027-03-31', plannedThrough: '2026-12-31'}},
      vi.fn(),
    ),
  );
  act(() => result.current.setPlannedThrough('2027-04-01'));
  await act(async () => result.current.preview());
  expect(repo.allocationPreview).not.toHaveBeenCalled();
  expect(result.current.error).toContain('当番の終了日');
});
