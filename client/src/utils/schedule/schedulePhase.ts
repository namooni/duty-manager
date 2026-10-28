import type {WorkOccurrence} from '@/repositories/automatic/automatic.domain';
export const SchedulePhases = {
  PAST: 'PAST',
  CURRENT: 'CURRENT',
  FUTURE: 'FUTURE',
  UNSCHEDULED: 'UNSCHEDULED',
} as const;
export type SchedulePhase = (typeof SchedulePhases)[keyof typeof SchedulePhases];
export function schedulePhase(
  event: WorkOccurrence,
  today: string,
): Readonly<{state: SchedulePhase; label: string | null}> {
  const start = event.rotationMode === 'CALENDAR' ? event.periodStart : event.date,
    end = event.rotationMode === 'CALENDAR' ? event.periodEnd : event.date;
  if (!start || !end) return {state: SchedulePhases.UNSCHEDULED, label: null};
  if (end < today) return {state: SchedulePhases.PAST, label: '過去'};
  if (start <= today)
    return {
      state: SchedulePhases.CURRENT,
      label: event.rotationMode === 'CALENDAR' ? '担当中' : '本日',
    };
  return {state: SchedulePhases.FUTURE, label: null};
}
