import {describe, expect, it} from 'vitest';
import {buildOverview} from './buildOverview';
import {config, employee, occurrence, schedule} from '@/test/fixtures/schedule';
describe('home overview', () => {
  it('shows actual work today and keeps holidays out of the duty list', () => {
    const result = buildOverview(
      schedule([
        occurrence(),
        occurrence({dutyId: 2, holiday: true}),
        occurrence({date: '2026-10-27', sequence: 1}),
      ]),
      '2026-10-26',
      '2026-12-06',
    );
    expect(result.today).toHaveLength(1);
    expect(result.today[0].dutyId).toBe(1);
  });
  it('finds the next different owner without repeating every execution date', () => {
    const next = occurrence({
      date: '2026-11-02',
      sequence: 5,
      rotationKey: 'C:1',
      periodStart: '2026-11-02',
      periodEnd: '2026-11-08',
      assignees: [{...employee, slotId: 2, employeeId: 2, name: '鈴木'}],
    });
    const result = buildOverview(
      schedule([occurrence(), next, {...next, date: '2026-11-03', sequence: 6}]),
      '2026-10-26',
      '2026-12-06',
    );
    expect(result.upcoming).toHaveLength(1);
    expect(result.upcoming[0].previousNames).toBe('田中');
    expect(result.upcoming[0].event.assignees[0].name).toBe('鈴木');
  });
  it('does not label an unchanged owner as a handover', () => {
    const result = buildOverview(
      schedule([
        occurrence(),
        occurrence({
          date: '2026-11-02',
          rotationKey: 'C:1',
          periodStart: '2026-11-02',
          periodEnd: '2026-11-08',
        }),
      ]),
      '2026-10-26',
      '2026-12-06',
    );
    expect(result.upcoming).toEqual([]);
  });
  it('keeps undecided meetings actionable and shows the next dated meeting', () => {
    const meeting = config({
      schedule: {...config().schedule, recurrence: 'EXPLICIT_DATES', rotationMode: 'OCCURRENCE'},
    });
    const events = [
      occurrence({date: '2026-11-20', rotationMode: 'OCCURRENCE'}),
      occurrence({date: null, rotationMode: 'OCCURRENCE', sequence: 1, rotationKey: 'E:1'}),
    ];
    const result = buildOverview(
      {duties: [meeting], occurrences: events},
      '2026-10-26',
      '2026-12-06',
    );
    expect(result.pending).toHaveLength(1);
    expect(result.upcoming[0].kind).toBe('meeting');
    expect(result.upcoming[0].date).toBe('2026-11-20');
  });
  it('keeps the overview horizon fixed and combines warnings within a period', () => {
    const events = [
      occurrence({warning: '重複'}),
      occurrence({date: '2026-10-27', sequence: 1, warning: '重複'}),
      occurrence({
        date: '2027-02-01',
        rotationKey: 'C:20',
        periodStart: '2027-02-01',
        periodEnd: '2027-02-07',
      }),
    ];
    const result = buildOverview(schedule(events), '2026-10-26', '2026-12-06');
    expect(result.warnings).toHaveLength(1);
    expect(result.upcoming).toHaveLength(0);
  });
});
