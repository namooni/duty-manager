import type {Duty, DutyInput} from '@/repositories/duties/duties.domain';
import type {Employee} from '@/repositories/employees/employees.domain';
export const Recurrences = {
  WORKDAYS: 'WORKDAYS',
  WEEKLY: 'WEEKLY',
  DAILY_INTERVAL: 'DAILY_INTERVAL',
  MONTHLY_DAY: 'MONTHLY_DAY',
  MONTHLY_NTH_WEEKDAY: 'MONTHLY_NTH_WEEKDAY',
  EXPLICIT_DATES: 'EXPLICIT_DATES',
} as const;
export type Recurrence = (typeof Recurrences)[keyof typeof Recurrences];
export const RotationModes = {CALENDAR: 'CALENDAR', OCCURRENCE: 'OCCURRENCE'} as const;
export type RotationMode = (typeof RotationModes)[keyof typeof RotationModes];
export type ScheduleRule = Readonly<{
  recurrence: Recurrence;
  rotationMode: RotationMode;
  weekdays: readonly number[];
  everyDays: number;
  monthDay: number;
  monthOrdinal: number;
  weekday: number;
}>;
export type AutomaticDraft = Readonly<{
  duty: DutyInput;
  schedule: ScheduleRule;
  dates: readonly (string | null)[];
  seed: number;
  endDate?: string | null;
  plannedThrough?: string;
}>;
export type RotationTurn = Readonly<{
  key: string;
  sequence: number;
  start: string | null;
  end: string | null;
  assignees: readonly Employee[];
  warning: string | null;
}>;
export type ScheduleRange = Readonly<{endDate: string | null; plannedThrough: string}>;
export type AllocationExtension = Readonly<{plannedThrough: string; additionalMeetings: number}>;
export type RotationPreview = Readonly<{
  token: string;
  turns: readonly RotationTurn[];
  range?: ScheduleRange | null;
}>;
export type Meeting = Readonly<{sequence: number; date: string | null}>;
export type AutomaticDuty = Readonly<{
  duty: Duty;
  schedule: ScheduleRule;
  meetings: readonly Meeting[];
  range?: ScheduleRange | null;
}>;
export type WorkAssignee = Readonly<{
  slotId: number;
  employeeId: number;
  employeeNumber: string;
  name: string;
}>;
export type WorkOccurrence = Readonly<{
  dutyId: number;
  dutyName: string;
  sequence: number;
  date: string | null;
  rotationMode: RotationMode;
  rotationKey: string;
  periodStart: string | null;
  periodEnd: string | null;
  assignees: readonly WorkAssignee[];
  warning: string | null;
  holiday: boolean;
  dateEditable?: boolean;
  segmented?: boolean;
}>;
export type ScheduleResult = Readonly<{
  occurrences: readonly WorkOccurrence[];
  duties: readonly AutomaticDuty[];
}>;
export type Holiday = Readonly<{date: string; name: string}>;
export type RotationChange = Readonly<{
  id: number;
  previousName: string;
  newName: string;
  reason: string;
  changedAt: string;
}>;
