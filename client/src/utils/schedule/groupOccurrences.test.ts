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
