import {act, cleanup, renderHook} from '@testing-library/react';
import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import {useDutyDeletion} from './useDutyDeletion';
import {dutiesRepository} from '@/repositories/duties/duties.repository';
import {useDutyUiStore} from '@/stores/duties/dutyUi.store';
import {useScheduleFilterStore} from '@/stores/duties/scheduleFilter.store';
import {config} from '@/test/fixtures/schedule';
vi.mock('@/repositories/duties/duties.repository', () => ({dutiesRepository: {remove: vi.fn()}}));
beforeEach(() => {
  vi.clearAllMocks();
  useDutyUiStore.setState({busy: false, notice: '', revision: 0});
  useScheduleFilterStore.getState().reset();
});
afterEach(cleanup);
it('does not delete until confirmed and cancels without a request', async () => {
  const {result} = renderHook(useDutyDeletion);
  act(() => result.current.open(config().duty));
  expect(dutiesRepository.remove).not.toHaveBeenCalled();
  act(() => result.current.close());
  await act(async () => result.current.confirm());
  expect(dutiesRepository.remove).not.toHaveBeenCalled();
});
it('deletes the exact ID and refreshes data only after success', async () => {
  vi.mocked(dutiesRepository.remove).mockResolvedValue();
  useDutyUiStore.setState({selectedId: 1});
  useScheduleFilterStore.getState().focusDuty(1);
  const {result} = renderHook(useDutyDeletion);
  act(() => result.current.open(config().duty));
  await act(async () => result.current.confirm());
  expect(dutiesRepository.remove).toHaveBeenCalledWith(1);
  expect(result.current.target).toBeNull();
  expect(useDutyUiStore.getState().revision).toBe(1);
  expect(useDutyUiStore.getState().notice).toContain('削除しました');
  expect(useDutyUiStore.getState().selectedId).toBeNull();
  expect(useScheduleFilterStore.getState().dutyId).toBe('');
});
it('keeps the dialog and selection after failure and supports retry', async () => {
  vi.mocked(dutiesRepository.remove)
    .mockRejectedValueOnce(new Error('削除に失敗しました'))
    .mockResolvedValueOnce();
  const {result} = renderHook(useDutyDeletion);
  act(() => result.current.open(config().duty));
  await act(async () => result.current.confirm());
  expect(result.current.target?.id).toBe(1);
  expect(result.current.error).toBe('削除に失敗しました');
  expect(useDutyUiStore.getState().revision).toBe(0);
  await act(async () => result.current.confirm());
  expect(result.current.target).toBeNull();
});
it('blocks double submission and closing while deleting', async () => {
  let finish!: () => void;
  vi.mocked(dutiesRepository.remove).mockImplementation(
    () =>
      new Promise<void>(resolve => {
        finish = resolve;
      }),
  );
  const {result} = renderHook(useDutyDeletion);
  act(() => result.current.open(config().duty));
  let pending!: Promise<void>;
  act(() => {
    pending = result.current.confirm();
  });
  act(() => {
    void result.current.confirm();
    result.current.close();
  });
  expect(result.current.target?.id).toBe(1);
  expect(dutiesRepository.remove).toHaveBeenCalledTimes(1);
  await act(async () => {
    finish();
    await pending;
  });
  expect(result.current.target).toBeNull();
});
