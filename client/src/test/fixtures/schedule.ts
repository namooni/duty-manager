import type {
  AutomaticDuty,
  WorkOccurrence,
  ScheduleResult,
} from '@/repositories/automatic/automatic.domain';
export const employee = {slotId: 1, employeeId: 1, employeeNumber: '001', name: '田中'};
export function occurrence(overrides: Partial<WorkOccurrence> = {}): WorkOccurrence {
  return {
    dutyId: 1,
    dutyName: '朝会',
    sequence: 0,
    date: '2026-10-26',
    rotationMode: 'CALENDAR',
    rotationKey: 'C:0',
    periodStart: '2026-10-26',
    periodEnd: '2026-11-01',
    assignees: [employee],
    warning: null,
    holiday: false,
    ...overrides,
  };
}
export function config(overrides: Partial<AutomaticDuty> = {}): AutomaticDuty {
  return {
    duty: {
      id: 1,
      name: '朝会',
      description: '',
      anchorDate: '2026-10-26',
      intervalCount: 1,
      intervalUnit: 'WEEK',
      strategy: 'CUSTOM',
      assigneeCount: 1,
      memberIds: [1, 2],
    },
    schedule: {
      recurrence: 'WORKDAYS',
      rotationMode: 'CALENDAR',
      weekdays: [1, 2, 3, 4, 5],
      everyDays: 1,
      monthDay: 1,
      monthOrdinal: 1,
      weekday: 1,
    },
    meetings: [],
    ...overrides,
  };
}
export function schedule(events: readonly WorkOccurrence[] = [occurrence()]): ScheduleResult {
  return {duties: [config()], occurrences: events};
}
