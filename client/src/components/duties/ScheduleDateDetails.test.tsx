import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {ThemeProvider} from 'styled-components';
import {afterEach, expect, it} from 'vitest';
import {theme} from '@/styles/theme';
import {groupOccurrences} from '@/utils/schedule/groupOccurrences';
import {ScheduleDateDetails} from './ScheduleDateDetails';
afterEach(cleanup);
it('keeps individual dates collapsed and exposes holidays when expanded', () => {
  const base = {
    dutyId: 1,
    dutyName: '朝会',
    rotationMode: 'CALENDAR' as const,
    rotationKey: 'C:0',
    periodStart: '2026-11-02',
    periodEnd: '2026-11-08',
    assignees: [],
    warning: null,
  };
  const [row] = groupOccurrences([
    {...base, sequence: 0, date: '2026-11-02', holiday: false},
    {...base, sequence: 1, date: '2026-11-03', holiday: true},
  ]);
  render(
    <ThemeProvider theme={theme}>
      <ScheduleDateDetails row={row} />
    </ThemeProvider>,
  );
  expect(screen.queryByText('2026-11-03')).toBeNull();
  expect(screen.getByText('表示範囲内：実施1回 · 休業1日')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', {name: '実施日を確認'}));
  expect(screen.getByText('2026-11-03')).toBeTruthy();
  expect(screen.getByText('実施なし（会社休業日）')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', {name: '実施日を閉じる'}));
  expect(screen.queryByText('2026-11-03')).toBeNull();
});
