import {expect, it} from 'vitest';
import {meetingDateRange} from './meetingDateRange';
it('restricts a pending meeting to the chosen month after the previous meeting', () => {
  const meetings = [
    {sequence: 0, date: '2027-08-20'},
    {sequence: 1, date: null},
  ];
  expect(meetingDateRange(meetings, 1, '2026-10-27', '2026-11-20', '2027-09')).toEqual({
    min: '2027-09-01',
    max: '2027-09-30',
    available: true,
  });
  expect(meetingDateRange(meetings, 1, '2026-10-27', '2026-11-20', '2027-07').available).toBe(
    false,
  );
});
it('respects today, start date and both neighbouring meetings across years', () => {
  const meetings = [
    {sequence: 0, date: '2026-12-31'},
    {sequence: 1, date: null},
    {sequence: 2, date: '2027-01-10'},
  ];
  expect(meetingDateRange(meetings, 1, '2026-10-27', '2026-11-20', '2027-01')).toEqual({
    min: '2027-01-01',
    max: '2027-01-09',
    available: true,
  });
  expect(meetingDateRange(meetings, 1, '2027-01-10', '2026-11-20', '2027-01').available).toBe(
    false,
  );
  expect(meetingDateRange([], 0, '2026-10-27', '2027-01-15', '2026-12').available).toBe(false);
});
it('uses leap month ends and keeps multiple meetings in a month possible', () => {
  const meetings = [
    {sequence: 0, date: '2028-02-05'},
    {sequence: 1, date: null},
    {sequence: 2, date: '2028-03-01'},
  ];
  expect(meetingDateRange(meetings, 1, '2028-02-10', '2028-01-01', '2028-02')).toEqual({
    min: '2028-02-10',
    max: '2028-02-29',
    available: true,
  });
});
