import {act, cleanup, renderHook} from '@testing-library/react';
import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import {useScheduleExport} from './useScheduleExport';
import {scheduleExportsRepository as repo} from '@/repositories/scheduleExports/scheduleExports.repository';
import {downloadFile} from '@/libs/files/download';
import {config} from '@/test/fixtures/schedule';
import {useDutyUiStore} from '@/stores/duties/dutyUi.store';
vi.mock('@/repositories/scheduleExports/scheduleExports.repository', () => ({
  scheduleExportsRepository: {download: vi.fn()},
}));
vi.mock('@/libs/files/download', () => ({downloadFile: vi.fn()}));
beforeEach(() => {
  vi.resetAllMocks();
  useDutyUiStore.setState({busy: false});
});
afterEach(cleanup);
it('defaults to the detail year and calendar template and reports uncovered periods before downloading', () => {
  const saved = {...config(), range: {endDate: null, plannedThrough: '2026-11-30'}};
  const {result} = renderHook(() => useScheduleExport(saved, '2026-01-01', '2026-12-31', vi.fn()));
  expect(result.current.format).toBe('PERIOD');
  expect(result.current.notices.join(' ')).toContain('未割当');
  expect(result.current.notices.join(' ')).toContain('当番開始前');
  expect(repo.download).not.toHaveBeenCalled();
});
it('downloads exactly the selected meeting options without changing duty data', async () => {
  const base = config();
  const meeting = {
    ...base,
    schedule: {
      ...base.schedule,
      recurrence: 'EXPLICIT_DATES' as const,
      rotationMode: 'OCCURRENCE' as const,
    },
    meetings: [{sequence: 0, date: null}],
  };
  const close = vi.fn();
  const file = {blob: new Blob(['xlsx']), filename: 'meeting.xlsx'};
  vi.mocked(repo.download).mockResolvedValue(file);
  const {result} = renderHook(() => useScheduleExport(meeting, '2026-01-01', '2026-12-31', close));
  expect(result.current.format).toBe('MEETING');
  expect(result.current.hasUndated).toBe(true);
  act(() => {
    result.current.setIncludeUndated(false);
    result.current.setFrom('2026-11-01');
  });
  await act(async () => result.current.download());
  expect(repo.download).toHaveBeenCalledExactlyOnceWith(1, '朝会', {
    from: '2026-11-01',
    to: '2026-12-31',
    format: 'MEETING',
    includeUndated: false,
  });
  expect(downloadFile).toHaveBeenCalledExactlyOnceWith(file);
  expect(close).toHaveBeenCalledOnce();
});
it('blocks invalid dates before HTTP and keeps failed downloads open with a retryable error', async () => {
  const close = vi.fn();
  const {result} = renderHook(() => useScheduleExport(config(), '2026-12-31', '2026-01-01', close));
  await act(async () => result.current.download());
  expect(repo.download).not.toHaveBeenCalled();
  expect(result.current.error).toBeTruthy();
  act(() => result.current.setFrom('2026-01-01'));
  vi.mocked(repo.download).mockRejectedValueOnce(new Error('Excelを作成できません。'));
  await act(async () => result.current.download());
  expect(result.current.error).toBe('Excelを作成できません。');
  expect(downloadFile).not.toHaveBeenCalled();
  expect(close).not.toHaveBeenCalled();
});
