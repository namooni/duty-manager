import {expect, it} from 'vitest';
import {schedulePhase} from './schedulePhase';
import {occurrence} from '@/test/fixtures/schedule';
it('uses the full ownership period even if the displayed execution day is past', () => {
  const event = occurrence({
    date: '2026-10-26',
    periodStart: '2026-10-26',
    periodEnd: '2026-11-01',
  });
  expect(schedulePhase(event, '2026-10-27')).toEqual({state: 'CURRENT', label: '担当中'});
  expect(schedulePhase(event, '2026-11-02')).toEqual({state: 'PAST', label: '過去'});
});
it('distinguishes past, today and future meetings without assuming completion', () => {
  const event = occurrence({rotationMode: 'OCCURRENCE', date: '2026-10-27'});
  expect(schedulePhase(event, '2026-10-28')).toEqual({state: 'PAST', label: '過去'});
  expect(schedulePhase(event, '2026-10-27')).toEqual({state: 'CURRENT', label: '本日'});
  expect(schedulePhase(event, '2026-10-26')).toEqual({state: 'FUTURE', label: null});
});
it('does not mistake an undated meeting for a completed or current event', () => {
  expect(
    schedulePhase(
      occurrence({rotationMode: 'OCCURRENCE', date: null, periodStart: null, periodEnd: null}),
      '2026-10-27',
    ),
  ).toEqual({state: 'UNSCHEDULED', label: null});
});
