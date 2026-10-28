import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {ThemeProvider} from 'styled-components';
import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import {theme} from '@/styles/theme';
import {AutomaticDutyWizard} from './AutomaticDutyWizard';
import {automaticRepository} from '@/repositories/automatic/automatic.repository';
import {useDutyUiStore} from '@/stores/duties/dutyUi.store';
vi.mock('@/repositories/automatic/automatic.repository', () => ({
  automaticRepository: {preview: vi.fn(), activate: vi.fn()},
}));
beforeEach(() => {
  useDutyUiStore.setState({busy: false});
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
  });
});
afterEach(cleanup);
it('renders all five meeting turns as individual dates or undecided dates', async () => {
  const people = Array.from({length: 5}, (_, i) => ({
    id: i + 1,
    name: '担当' + i,
    employeeNumber: String(i),
    active: true,
  }));
  vi.mocked(automaticRepository.preview).mockResolvedValue({
    token: 'token',
    turns: people.map((person, i) => ({
      key: 'E:' + i,
      sequence: i,
      start: i === 0 ? '2026-11-20' : null,
      end: i === 0 ? '2026-11-20' : null,
      assignees: [person],
      warning: null,
    })),
  });
  render(
    <ThemeProvider theme={theme}>
      <AutomaticDutyWizard
        employees={people}
        today="2026-11-20"
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    </ThemeProvider>,
  );
  fireEvent.change(screen.getByLabelText('当番の名前'), {target: {value: '定例会'}});
  fireEvent.change(screen.getByLabelText('実施する日'), {target: {value: 'EXPLICIT_DATES'}});
  fireEvent.click(screen.getByRole('button', {name: '次へ：担当順を確認'}));
  await waitFor(() => expect(screen.getByText('第5回 · 開催日未定')).toBeTruthy());
  expect(screen.getByText('第1回 · 2026-11-20')).toBeTruthy();
  expect(
    screen.queryByText(/6週間|最初に予定を確定する終了日|担当者を決める期間の最終日/),
  ).toBeNull();
  expect(screen.getByRole('button', {name: 'この内容で作成'})).toBeTruthy();
});
