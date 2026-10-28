import {cleanup, renderHook, waitFor} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {useDutyOverview} from './useDutyOverview';
import {automaticRepository} from '@/repositories/automatic/automatic.repository';
import {occurrence, schedule} from '@/test/fixtures/schedule';
vi.mock('@/repositories/automatic/automatic.repository', () => ({
  automaticRepository: {schedule: vi.fn()},
}));
beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);
const source = {
  from: '2026-10-26',
  to: '2026-12-06',
  loadedRange: '2026-10-26:2026-12-06',
  data: schedule(),
  loading: false,
  error: '',
};
describe('overview query isolation', () => {
  it('reuses the loaded view when it covers the overview period', () => {
    const {result} = renderHook(() => useDutyOverview('2026-10-26', 0, 0, source));
    expect(automaticRepository.schedule).not.toHaveBeenCalled();
    expect(result.current.today).toHaveLength(1);
  });
  it('fetches today separately when the user browses a future range', async () => {
    vi.mocked(automaticRepository.schedule).mockResolvedValue(schedule());
    const {result} = renderHook(() =>
      useDutyOverview('2026-10-26', 0, 0, {
        ...source,
        from: '2027-01-01',
        to: '2027-02-01',
        loadedRange: '2027-01-01:2027-02-01',
        data: schedule([occurrence({date: '2027-01-01'})]),
      }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(automaticRepository.schedule).toHaveBeenCalledWith(
      '2026-10-26',
      '2026-12-06',
      expect.any(AbortSignal),
    );
    expect(result.current.today).toHaveLength(1);
  });
  it('reports an overview error instead of presenting missing data as an empty day', async () => {
    vi.mocked(automaticRepository.schedule).mockRejectedValue(new Error('接続できません。'));
    const {result} = renderHook(() =>
      useDutyOverview('2026-10-26', 0, 0, {...source, from: '2027-01-01'}),
    );
    await waitFor(() => expect(result.current.error).toBe('接続できません。'));
    expect(result.current.loading).toBe(false);
  });
});

it('identifies a company holiday independently of schedule events and the viewed range', () => {
  const {result} = renderHook(() =>
    useDutyOverview('2026-10-26', 0, 0, {
      ...source,
      data: schedule([]),
      holidays: [{date: '2026-10-26', name: '創立記念日'}],
    }),
  );
  expect(result.current.today).toEqual([]);
  expect(result.current.todayHoliday).toEqual({date: '2026-10-26', name: '創立記念日'});
});
it('keeps holiday-enabled duties visible and does not label other dates a holiday', () => {
  const {result} = renderHook(() =>
    useDutyOverview('2026-10-26', 0, 0, {
      ...source,
      holidays: [{date: '2026-10-27', name: '会社休業'}],
    }),
  );
  expect(result.current.today).toHaveLength(1);
  expect(result.current.todayHoliday).toBeNull();
});
