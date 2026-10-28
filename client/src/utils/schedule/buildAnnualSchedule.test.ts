import {expect, it} from 'vitest';
import {buildAnnualSchedule} from './buildAnnualSchedule';
import {occurrence} from '@/test/fixtures/schedule';
it('shows all twelve months without mixing other years or undated meetings', () => {
  const months = buildAnnualSchedule(2028, [
    occurrence({date: '2028-02-29', sequence: 1}),
    occurrence({date: '2027-12-31'}),
    occurrence({date: null, sequence: 2}),
    occurrence({date: '2028-02-01', sequence: 3}),
  ]);
  expect(months).toHaveLength(12);
  expect(months[0].events).toEqual([]);
  expect(months[1].events.map(event => event.date)).toEqual(['2028-02-01', '2028-02-29']);
  expect(months.reduce((sum, month) => sum + month.events.length, 0)).toBe(2);
});
