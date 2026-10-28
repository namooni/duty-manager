import {cleanup, render, screen} from '@testing-library/react';
import {afterEach, expect, it, vi} from 'vitest';
import {ThemeProvider} from 'styled-components';
import {theme} from '@/styles/theme';
import {DutyDetailsPage} from './DutyDetailsPage';
import {useDutyDetails} from '@/hooks/duties/useDutyDetails';
import {config} from '@/test/fixtures/schedule';
vi.mock('@/hooks/duties/useDutyDetails', () => ({useDutyDetails: vi.fn()}));
afterEach(cleanup);
it('updates the year and loading count even when a translator has wrapped React text nodes', () => {
  const details = {
    m: {busy: false, error: '', notice: '', modal: null, today: '2026-10-27', refresh: vi.fn()},
    work: {loading: false, error: '', notice: '', dialog: null},
    editor: {original: null},
    duty: config().duty,
    config: null,
    loading: false,
    error: '',
    participants: [],
    currentContinuations: [],
    year: 2026,
    from: '2026-01-01',
    to: '2026-12-31',
    scheduledCount: 2,
    legacy: [],
    legacyError: '',
    back: vi.fn(),
    setYear: vi.fn(),
    showCurrentYear: vi.fn(),
  } as unknown as ReturnType<typeof useDutyDetails>;
  vi.mocked(useDutyDetails).mockReturnValue(details);
  const page = () => (
    <ThemeProvider theme={theme}>
      <DutyDetailsPage />
    </ThemeProvider>
  );
  const view = render(page());
  const summary = screen.getByText('2026-01-01 〜 2026-12-31 · 実施予定 2件');
  const heading = screen.getByRole('heading', {name: '2026年の予定'});
  for (const element of [summary, heading]) {
    for (const text of [...element.childNodes].filter(node => node.nodeType === Node.TEXT_NODE)) {
      const font = document.createElement('font');
      text.replaceWith(font);
      font.appendChild(text);
    }
  }
  const next = {
    ...details,
    year: 2027,
    from: '2027-01-01',
    to: '2027-12-31',
    work: {...details.work, loading: true},
  };
  vi.mocked(useDutyDetails).mockReturnValue(next);
  expect(() => view.rerender(page())).not.toThrow();
  expect(screen.getByRole('heading', {name: '2027年の予定'})).toBeTruthy();
  expect(screen.getByText('2027-01-01 〜 2027-12-31')).toBeTruthy();
  vi.mocked(useDutyDetails).mockReturnValue({
    ...next,
    scheduledCount: 8,
    work: {...details.work, loading: false},
  });
  view.rerender(page());
  expect(screen.getByText('2027-01-01 〜 2027-12-31 · 実施予定 8件')).toBeTruthy();
});
