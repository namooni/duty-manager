import {act, renderHook} from '@testing-library/react';
import {afterEach, expect, it, vi} from 'vitest';
import {useGlobalNoticeTimeout} from './useGlobalNoticeTimeout';
import {useDutyUiStore} from '@/stores/duties/dutyUi.store';
afterEach(() => {
  vi.useRealTimers();
  useDutyUiStore.getState().setNotice('');
});
it('dismisses a successful message after five seconds', () => {
  vi.useFakeTimers();
  useDutyUiStore.getState().setNotice('登録しました');
  renderHook(useGlobalNoticeTimeout);
  act(() => vi.advanceTimersByTime(4999));
  expect(useDutyUiStore.getState().notice).toBe('登録しました');
  act(() => vi.advanceTimersByTime(1));
  expect(useDutyUiStore.getState().notice).toBe('');
});
it('gives repeated messages their own full display time', () => {
  vi.useFakeTimers();
  useDutyUiStore.getState().setNotice('登録しました');
  const view = renderHook(useGlobalNoticeTimeout);
  act(() => vi.advanceTimersByTime(4000));
  act(() => useDutyUiStore.getState().setNotice('登録しました'));
  act(() => vi.advanceTimersByTime(4000));
  expect(useDutyUiStore.getState().notice).toBe('登録しました');
  act(() => vi.advanceTimersByTime(1000));
  expect(useDutyUiStore.getState().notice).toBe('');
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});
