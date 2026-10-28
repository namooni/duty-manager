import {act, cleanup, renderHook} from '@testing-library/react';
import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import {useScheduleDateChange} from './useScheduleDateChange';
import {scheduleDatesRepository as repo} from '@/repositories/scheduleDates/scheduleDates.repository';
import {useDutyUiStore} from '@/stores/duties/dutyUi.store';
import {occurrence} from '@/test/fixtures/schedule';
import {ApiError} from '@/apis/types';
vi.mock('@/repositories/scheduleDates/scheduleDates.repository', () => ({
  scheduleDatesRepository: {context: vi.fn(), preview: vi.fn(), confirm: vi.fn()},
}));
const context = {
  dutyName: '朝会',
  mode: 'OCCURRENCE' as const,
  minimum: '2026-11-03',
  maximum: '2026-11-15',
  currentDate: '2026-11-09',
  periods: [],
  history: [],
};
beforeEach(() => {
  vi.resetAllMocks();
  useDutyUiStore.setState({busy: false, revision: 0, notice: ''});
  vi.mocked(repo.context).mockResolvedValue(context);
  vi.mocked(repo.preview).mockResolvedValue({token: 'verified', rows: [], warnings: []});
  vi.mocked(repo.confirm).mockResolvedValue();
});
afterEach(cleanup);
async function opened() {
  const hook = renderHook(useScheduleDateChange);
  await act(async () => {
    hook.result.current.open(occurrence({rotationMode: 'OCCURRENCE', rotationKey: 'E:0'}));
  });
  act(() => {
    hook.result.current.setDate('2026-11-10');
    hook.result.current.setReason('開催日調整');
  });
  return hook;
}
it('does not write when loading, previewing, returning or cancelling', async () => {
  const {result} = await opened();
  await act(async () => result.current.preview());
  expect(repo.confirm).not.toHaveBeenCalled();
  act(() => result.current.back());
  expect(result.current.date).toBe('2026-11-10');
  act(() => result.current.close());
  expect(result.current.target).toBeNull();
  expect(useDutyUiStore.getState().revision).toBe(0);
});
it('submits the reviewed date and reason and closes only on success', async () => {
  const {result} = await opened();
  await act(async () => result.current.preview());
  act(() => result.current.setDate('2026-11-11'));
  await act(async () => result.current.confirm());
  expect(repo.confirm).toHaveBeenCalledWith(
    1,
    {rotationKey: 'E:0', date: '2026-11-10', reason: '開催日調整'},
    'verified',
  );
  expect(result.current.target).toBeNull();
  expect(useDutyUiStore.getState().revision).toBe(1);
});
it('requires a new preview after concurrent changes', async () => {
  vi.mocked(repo.confirm).mockRejectedValueOnce(new ApiError('CONFLICT', '更新済み', 409));
  const {result} = await opened();
  await act(async () => result.current.preview());
  await act(async () => result.current.confirm());
  expect(result.current.stale).toBe(true);
  await act(async () => result.current.confirm());
  expect(repo.confirm).toHaveBeenCalledTimes(1);
  expect(result.current.target).not.toBeNull();
  await act(async () => result.current.preview());
  expect(result.current.stale).toBe(false);
});
it('rejects dates outside the server supplied interval before requesting a preview', async () => {
  const {result} = await opened();
  act(() => result.current.setDate('2026-11-16'));
  await act(async () => result.current.preview());
  expect(repo.preview).not.toHaveBeenCalled();
  expect(result.current.error).toContain('期間内');
});

it('does not open a date editor or call the repository for weekly ownership periods', () => {
  const {result} = renderHook(useScheduleDateChange);
  act(() => result.current.open(occurrence({rotationMode: 'CALENDAR'})));
  expect(result.current.target).toBeNull();
  expect(repo.context).not.toHaveBeenCalled();
});
