import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {ThemeProvider} from 'styled-components';
import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import {theme} from '@/styles/theme';
import {config} from '@/test/fixtures/schedule';
import {ScheduleExportDialog} from './ScheduleExportDialog';
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
  });
});
afterEach(cleanup);
it('renders accessible date and template controls and allows cancelling an undated meeting export', () => {
  const base = config();
  const close = vi.fn();
  render(
    <ThemeProvider theme={theme}>
      <ScheduleExportDialog
        config={{
          ...base,
          schedule: {...base.schedule, recurrence: 'EXPLICIT_DATES', rotationMode: 'OCCURRENCE'},
          meetings: [{sequence: 0, date: null}],
        }}
        from="2026-01-01"
        to="2026-12-31"
        onClose={close}
      />
    </ThemeProvider>,
  );
  expect(screen.getByLabelText('出力開始日')).toBeTruthy();
  expect(screen.getByLabelText('出力終了日')).toBeTruthy();
  const checkbox = screen.getByRole('checkbox', {
    name: '開催日未定の回も含める',
  }) as HTMLInputElement;
  expect(checkbox.checked).toBe(true);
  fireEvent.click(checkbox);
  expect(checkbox.checked).toBe(false);
  fireEvent.click(screen.getByRole('button', {name: 'キャンセル'}));
  expect(close).toHaveBeenCalledOnce();
});
