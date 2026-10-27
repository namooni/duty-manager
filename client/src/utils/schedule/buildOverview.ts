import type {ScheduleResult, WorkOccurrence} from '@/repositories/automatic/automatic.domain';
import {groupOccurrences} from './groupOccurrences';
export type UpcomingDuty = Readonly<{
  event: WorkOccurrence;
  date: string;
  kind: 'handover' | 'meeting';
  previousNames: string | null;
}>;
export function buildOverview(data: ScheduleResult, today: string, through: string) {
  const events = data.occurrences.filter(
    event => event.date === null || (event.date >= today && event.date <= through),
  );
  const rows = groupOccurrences(events);
  const upcoming: UpcomingDuty[] = [];
  for (const config of data.duties) {
    const matching = rows.filter(row => row.dutyId === config.duty.id);
    if (config.schedule.rotationMode === 'CALENDAR') {
      const current = matching.find(
        row =>
          row.periodStart !== null &&
          row.periodEnd !== null &&
          row.periodStart <= today &&
          row.periodEnd >= today,
      );
      const personIds = (event: WorkOccurrence) =>
        event.assignees
          .map(person => person.employeeId)
          .sort((a, b) => a - b)
          .join(',');
      const next = matching
        .filter(
          row => row.periodStart !== null && row.periodStart > today && row.executionCount > 0,
        )
        .sort((a, b) => a.periodStart!.localeCompare(b.periodStart!))
        .find(row => !current || personIds(row) !== personIds(current));
      if (next)
        upcoming.push({
          event: next,
          date: next.periodStart!,
          kind: 'handover',
          previousNames: current?.assignees.map(person => person.name).join('・') || null,
        });
    } else {
      const next = events.find(
        event =>
          event.dutyId === config.duty.id &&
          event.date !== null &&
          event.date > today &&
          !event.holiday,
      );
      if (next)
        upcoming.push({event: next, date: next.date!, kind: 'meeting', previousNames: null});
    }
  }
  return {
    today: events.filter(event => event.date === today && !event.holiday),
    upcoming: upcoming.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6),
    pending: events.filter(event => event.date === null),
    warnings: rows.filter(row => row.warning && row.date !== null),
    dutyCount: data.duties.length,
  };
}
export type DutyOverview = ReturnType<typeof buildOverview>;
