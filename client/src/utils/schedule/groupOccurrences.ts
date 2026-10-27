import type {WorkOccurrence} from '@/repositories/automatic/automatic.domain';
export type ScheduleRow = WorkOccurrence &
  Readonly<{
    key: string;
    grouped: boolean;
    events: readonly WorkOccurrence[];
    executionCount: number;
    holidayCount: number;
  }>;
/** Group ownership periods, never individual meeting turns or distinct saved assignments. */
export function groupOccurrences(occurrences: readonly WorkOccurrence[]): readonly ScheduleRow[] {
  const groups = new Map<string, WorkOccurrence[]>();
  for (const event of occurrences) {
    const grouped =
      event.rotationMode === 'CALENDAR' && event.periodStart !== null && event.periodEnd !== null;
    const key = grouped
      ? JSON.stringify([
          event.dutyId,
          event.rotationKey,
          event.periodStart,
          event.periodEnd,
          event.assignees
            .map(person => [person.slotId, person.employeeId])
            .sort((a, b) => a[0] - b[0]),
        ])
      : JSON.stringify(['event', event.dutyId, event.sequence]);
    const group = groups.get(key);
    if (group) group.push(event);
    else groups.set(key, [event]);
  }
  return Array.from(groups, ([key, events]) => {
    const first = events[0];
    const warnings = [
      ...new Set(
        events.map(event => event.warning).filter((warning): warning is string => !!warning),
      ),
    ];
    return {
      ...first,
      key,
      grouped:
        first.rotationMode === 'CALENDAR' && first.periodStart !== null && first.periodEnd !== null,
      events: [...events],
      executionCount: events.filter(event => !event.holiday).length,
      holidayCount: events.filter(event => event.holiday).length,
      warning: warnings.length ? warnings.join(' / ') : null,
      holiday: events.every(event => event.holiday),
    };
  });
}
