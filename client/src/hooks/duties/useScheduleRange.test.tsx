import {act, cleanup, renderHook} from '@testing-library/react';
import {afterEach, beforeEach, expect, it} from 'vitest';
import {useScheduleRange} from './useScheduleRange';
import {useDutyUiStore, ScheduleRangeModes} from '@/stores/duties/dutyUi.store';
function useRange() {
  const state = useDutyUiStore();
  return useScheduleRange('2026-10-27', state.from, state.to, state.setFrom, state.setTo);
}
beforeEach(() =>
  useDutyUiStore.setState({
    from: '2026-10-27',
    to: '2026-12-07',
    rangeMode: ScheduleRangeModes.UPCOMING,
    rangeInitialized: true,
  }),
);
afterEach(cleanup);
it('selects custom immediately while leaving the previous dates unchanged', () => {
  const {result} = renderHook(useRange);
  expect(result.current.isUpcoming).toBe(true);
  act(() => result.current.toggleCustom());
  expect(result.current.isUpcoming).toBe(false);
  expect(result.current.isThisMonth).toBe(false);
  expect(result.current.isCustom).toBe(true);
  expect(result.current.customOpen).toBe(true);
  expect(useDutyUiStore.getState().from).toBe('2026-10-27');
  expect(useDutyUiStore.getState().to).toBe('2026-12-07');
});
it('unselects month when opening custom and keeps custom selected after closing', () => {
  const {result} = renderHook(useRange);
  act(() => result.current.showThisMonth());
  expect(result.current.isThisMonth).toBe(true);
  act(() => result.current.toggleCustom());
  act(() => result.current.closeCustom());
  expect(result.current.isThisMonth).toBe(false);
  expect(result.current.isCustom).toBe(true);
  expect(result.current.customOpen).toBe(false);
});
it('selects a quick range exclusively and closes the custom editor', () => {
  const {result} = renderHook(useRange);
  act(() => result.current.toggleCustom());
  act(() => result.current.showThisMonth());
  expect(result.current.isThisMonth).toBe(true);
  expect(result.current.isCustom).toBe(false);
  expect(result.current.customOpen).toBe(false);
  expect(useDutyUiStore.getState().to).toBe('2026-10-31');
  act(() => result.current.showUpcoming());
  expect(result.current.isUpcoming).toBe(true);
  expect(result.current.isThisMonth).toBe(false);
});
it('does not infer a preset from a manually entered matching range', () => {
  const {result} = renderHook(useRange);
  act(() => {
    result.current.setCustomFrom('2026-10-01');
    result.current.setCustomTo('2026-10-31');
  });
  expect(result.current.isCustom).toBe(true);
  expect(result.current.isThisMonth).toBe(false);
});
it('preserves custom mode across navigation without reopening the editor', () => {
  const first = renderHook(useRange);
  act(() => first.result.current.toggleCustom());
  first.unmount();
  const next = renderHook(useRange);
  expect(next.result.current.isCustom).toBe(true);
  expect(next.result.current.customOpen).toBe(false);
});

it('keeps an explicit custom selection when the initial health response arrives later', () => {
  useDutyUiStore.setState({rangeInitialized: false});
  const {result} = renderHook(useRange);
  act(() => result.current.toggleCustom());
  act(() => useDutyUiStore.getState().initializeRange('2026-10-27', '2026-12-07'));
  expect(result.current.isCustom).toBe(true);
});
