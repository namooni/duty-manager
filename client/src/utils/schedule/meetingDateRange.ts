import type {Meeting} from '@/repositories/automatic/automatic.domain';
import {addDays} from '@/utils/format/date';
export function meetingDateRange(
  meetings: readonly Meeting[],
  sequence: number,
  today: string,
  anchorDate: string,
  month?: string,
  plannedThrough?: string,
) {
  const previous = meetings
    .filter(meeting => meeting.sequence < sequence && meeting.date)
    .map(meeting => meeting.date!)
    .sort()
    .at(-1);
  const next = meetings
    .filter(meeting => meeting.sequence > sequence && meeting.date)
    .map(meeting => meeting.date!)
    .sort()[0];
  const lower = [
    today,
    anchorDate,
    ...(previous ? [addDays(previous, 1)] : []),
    ...(month ? [month + '-01'] : []),
  ];
  const upper = [...(next ? [addDays(next, -1)] : []), ...(plannedThrough ? [plannedThrough] : [])];
  if (month) {
    const [year, number] = month.split('-').map(Number);
    const end = new Date(Date.UTC(year, number, 0)).toISOString().slice(0, 10);
    upper.push(end);
  }
  const min = lower.sort().at(-1)!;
  const max = upper.sort()[0];
  return {min, max, available: !max || min <= max};
}
