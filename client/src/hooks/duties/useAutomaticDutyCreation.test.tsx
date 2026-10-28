import {act, cleanup, renderHook} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {useAutomaticDutyCreation} from './useAutomaticDutyCreation';
import {automaticRepository} from '@/repositories/automatic/automatic.repository';
import {useDutyUiStore} from '@/stores/duties/dutyUi.store';
vi.mock('@/repositories/automatic/automatic.repository', () => ({
  automaticRepository: {preview: vi.fn(), activate: vi.fn()},
}));
const people = Array.from({length: 5}, (_, i) => ({
  id: i + 1,
  name: '担当' + i,
  employeeNumber: String(i),
  active: true,
}));
const preview = {
  token: 'token',
  turns: people.map((person, i) => ({
    key: 'E:' + i,
    sequence: i,
    start: null,
    end: null,
    assignees: [person],
    warning: null,
  })),
};
beforeEach(() => {
  vi.resetAllMocks();
  useDutyUiStore.setState({busy: false});
  vi.mocked(automaticRepository.preview).mockResolvedValue(preview);
  vi.mocked(automaticRepository.activate).mockResolvedValue({id: 10});
});
afterEach(cleanup);
describe('automatic duty creation', () => {
  it('sends an explicit allocation window and preserves the requested undecided meeting count', async () => {
    const saved = vi.fn(),
      closed = vi.fn();
    const {result} = renderHook(() =>
      useAutomaticDutyCreation(people, '2026-11-20', saved, closed),
    );
    act(() => {
      result.current.duty.update('name', '定例会');
      result.current.updateRule('recurrence', 'EXPLICIT_DATES');
    });
    expect(result.current.rule.rotationMode).toBe('OCCURRENCE');
    await act(async () => {
      await result.current.preview();
    });
    expect(result.current.review?.preview.turns).toHaveLength(5);
    const draft = vi.mocked(automaticRepository.preview).mock.calls[0][0];
    expect(draft.dates).toEqual([null]);
    expect(draft.plannedThrough).toBe('2026-12-31');
    expect(draft.endDate).toBeNull();
    expect(draft).not.toHaveProperty('to');
    expect(draft).not.toHaveProperty('from');
    expect(automaticRepository.activate).not.toHaveBeenCalled();
    act(() => result.current.close());
    expect(closed).toHaveBeenCalledOnce();
  });
  it('sorts explicitly selected dates and blocks duplicates in the hook', async () => {
    const {result} = renderHook(() =>
      useAutomaticDutyCreation(people, '2026-11-20', vi.fn(), vi.fn()),
    );
    act(() => {
      result.current.duty.update('name', '定例会');
      result.current.updateRule('recurrence', 'EXPLICIT_DATES');
      result.current.updateDate(0, '2026-12-18');
      result.current.addDate();
    });
    act(() => result.current.updateDate(1, '2026-11-20'));
    await act(async () => {
      await result.current.preview();
    });
    expect(result.current.review?.draft.dates).toEqual(['2026-11-20', '2026-12-18']);
    act(() => {
      result.current.back();
      result.current.updateDate(1, '2026-12-18');
    });
    await act(async () => {
      await result.current.preview();
    });
    expect(result.current.error).toBe('開催日が重複しています。');
    expect(automaticRepository.preview).toHaveBeenCalledOnce();
  });
  it('keeps execution weekdays separate from a weekly handover', async () => {
    const {result} = renderHook(() =>
      useAutomaticDutyCreation(people, '2026-11-20', vi.fn(), vi.fn()),
    );
    act(() => result.current.duty.update('name', '朝会'));
    await act(async () => {
      await result.current.preview();
    });
    expect(result.current.review?.draft.schedule.recurrence).toBe('WORKDAYS');
    expect(result.current.review?.draft.schedule.rotationMode).toBe('CALENDAR');
    expect(result.current.review?.draft.duty.intervalUnit).toBe('WEEK');
  });
  it('sends only one activation request for the reviewed snapshot', async () => {
    const saved = vi.fn();
    let resolve!: (value: {id: number}) => void;
    vi.mocked(automaticRepository.activate).mockImplementation(
      () =>
        new Promise(done => {
          resolve = done;
        }),
    );
    const {result} = renderHook(() =>
      useAutomaticDutyCreation(people, '2026-11-20', saved, vi.fn()),
    );
    act(() => result.current.duty.update('name', '朝会'));
    await act(async () => {
      await result.current.preview();
    });
    const draft = result.current.review!.draft;
    await act(async () => {
      const first = result.current.activate(),
        second = result.current.activate();
      expect(automaticRepository.activate).toHaveBeenCalledOnce();
      resolve({id: 10});
      await Promise.all([first, second]);
    });
    expect(automaticRepository.activate).toHaveBeenCalledWith(draft, 'token');
    expect(saved).toHaveBeenCalledWith(10, '2026-11-20');
  });
});

it('validates the operating end separately from the allocation window', async () => {
  const {result} = renderHook(() =>
    useAutomaticDutyCreation(people, '2026-11-20', vi.fn(), vi.fn()),
  );
  act(() => {
    result.current.duty.update('name', '朝会');
    result.current.setHasEnd(true);
    result.current.setEndDate('2026-11-30');
  });
  await act(async () => result.current.preview());
  expect(automaticRepository.preview).not.toHaveBeenCalled();
  expect(result.current.error).toContain('当番の終了日まで');
  act(() => result.current.setPlannedThrough('2026-11-30'));
  await act(async () => result.current.preview());
  expect(result.current.review?.draft).toMatchObject({
    endDate: '2026-11-30',
    plannedThrough: '2026-11-30',
  });
});
