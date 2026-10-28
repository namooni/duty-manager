import {describe, expect, it} from 'vitest';
import type {WorkOccurrence} from '@/repositories/automatic/automatic.domain';
import {groupOccurrences} from './groupOccurrences';
const person = {slotId: 10, employeeId: 1, employeeNumber: '001', name: '田中'};
const event = (sequence: number, overrides: Partial<WorkOccurrence> = {}): WorkOccurrence => ({
  dutyId: 1,
  dutyName: '朝会',
  sequence,
  date: '2026-11-' + String(sequence + 2).padStart(2, '0'),
  rotationMode: 'CALENDAR',
  rotationKey: 'C:0',
  periodStart: '2026-11-02',
  periodEnd: '2026-11-08',
  assignees: [person],
  warning: null,
  holiday: false,
  ...overrides,
});
describe('schedule ownership summaries', () => {
  it('groups a working week while retaining holidays and date-specific warnings', () => {
    const input = [
      event(0),
      event(1, {holiday: true}),
      event(2, {warning: '別の当番と重複'}),
      event(3),
      event(4, {warning: '別の当番と重複'}),
    ];
    const rows = groupOccurrences(input);
    expect(rows).toHaveLength(1);
    expect(rows[0].executionCount).toBe(4);
    expect(rows[0].holidayCount).toBe(1);
    expect(rows[0].warning).toBe('別の当番と重複');
    expect(rows[0].events).toEqual(input);
    expect(rows[0].holiday).toBe(false);
    expect(input[0].warning).toBeNull();
  });
  it('shows one monthly period rather than one row for each day', () => {
    const rows = groupOccurrences(
      Array.from({length: 30}, (_, index) =>
        event(index, {
          date: '2026-11-' + String(index + 1).padStart(2, '0'),
          periodStart: '2026-11-01',
          periodEnd: '2026-11-30',
          rotationKey: 'C:1',
        }),
      ),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].periodEnd).toBe('2026-11-30');
    expect(rows[0].executionCount).toBe(30);
  });
  it('keeps individual meetings separate even with the same assignee', () => {
    const rows = groupOccurrences([
      event(0, {rotationMode: 'OCCURRENCE', rotationKey: 'E:0'}),
      event(1, {rotationMode: 'OCCURRENCE', rotationKey: 'E:1'}),
    ]);
    expect(rows).toHaveLength(2);
    expect(rows.every(row => !row.grouped)).toBe(true);
  });
  it('never merges different duties, periods, or saved assignees', () => {
    const rows = groupOccurrences([
      event(0),
      event(1, {dutyId: 2}),
      event(2, {rotationKey: 'C:1'}),
      event(3, {assignees: [{...person, slotId: 11, employeeId: 2}]}),
    ]);
    expect(rows).toHaveLength(4);
  });
  it('keeps the full ownership period when only two execution dates were queried', () => {
    const rows = groupOccurrences([event(2), event(3)]);
    expect(rows[0].periodStart).toBe('2026-11-02');
    expect(rows[0].periodEnd).toBe('2026-11-08');
    expect(rows[0].events).toHaveLength(2);
  });
  it('does not invent a period for undecided dates or incomplete period data', () => {
    expect(
      groupOccurrences([
        event(0, {date: null, periodStart: null, periodEnd: null}),
        event(1, {periodStart: null}),
      ]),
    ).toHaveLength(2);
  });
});

it('uses real execution dates for the visible range while preserving the calendar rotation period', () => {
  const [row] = groupOccurrences(
    Array.from({length: 5}, (_, i) =>
      event(i, {
        date: '2026-10-' + String(5 + i).padStart(2, '0'),
        periodStart: '2026-10-05',
        periodEnd: '2026-10-11',
      }),
    ),
  );
  expect(row.executionStart).toBe('2026-10-05');
  expect(row.executionEnd).toBe('2026-10-09');
  expect(row.periodStart).toBe('2026-10-05');
  expect(row.periodEnd).toBe('2026-10-11');
});
it('excludes holiday endpoints, handles unsorted data, and limits the range to loaded executions', () => {
  const [row] = groupOccurrences([
    event(4, {holiday: true}),
    event(3),
    event(0, {holiday: true}),
    event(2),
    event(1),
  ]);
  expect(row.executionStart).toBe('2026-11-03');
  expect(row.executionEnd).toBe('2026-11-05');
  const [partial] = groupOccurrences([event(3), event(2)]);
  expect(partial.executionStart).toBe('2026-11-04');
  expect(partial.executionEnd).toBe('2026-11-05');
});
it('does not invent an execution range on all-holiday or undecided rows and retains real weekend work', () => {
  const [holiday] = groupOccurrences([event(0, {holiday: true})]);
  expect(holiday.executionStart).toBeNull();
  expect(holiday.executionEnd).toBeNull();
  const [pending] = groupOccurrences([event(0, {date: null, periodStart: null, periodEnd: null})]);
  expect(pending.executionStart).toBeNull();
  const [weekend] = groupOccurrences([event(6)]);
  expect(weekend.executionStart).toBe('2026-11-08');
  expect(weekend.executionEnd).toBe('2026-11-08');
});
