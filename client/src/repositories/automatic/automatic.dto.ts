import type {DutyDto, DutyInputDto} from '@/repositories/duties/duties.dto';
import type {EmployeeDto} from '@/repositories/employees/employees.dto';
export interface ScheduleRuleDto {
  recurrence:
    | 'WORKDAYS'
    | 'WEEKLY'
    | 'DAILY_INTERVAL'
    | 'MONTHLY_DAY'
    | 'MONTHLY_NTH_WEEKDAY'
    | 'EXPLICIT_DATES';
  rotationMode: 'CALENDAR' | 'OCCURRENCE';
  weekdays: number[];
  everyDays: number;
  monthDay: number;
  monthOrdinal: number;
  weekday: number;
}
export interface AutomaticDraftDto {
  duty: DutyInputDto;
  schedule: ScheduleRuleDto;
  dates: (string | null)[];
  seed: number;
  endDate?: string | null;
  plannedThrough?: string;
}
export interface RotationTurnDto {
  key: string;
  sequence: number;
  start: string | null;
  end: string | null;
  assignees: EmployeeDto[];
  warning: string | null;
}
export interface ScheduleRangeDto {
  endDate: string | null;
  plannedThrough: string;
}
export interface AllocationExtensionDto {
  plannedThrough: string;
  additionalMeetings: number;
}
export interface RotationPreviewDto {
  token: string;
  turns: RotationTurnDto[];
  range?: ScheduleRangeDto | null;
}
export interface AutomaticDutyDto {
  duty: DutyDto;
  schedule: ScheduleRuleDto;
  meetings: {sequence: number; date: string | null}[];
  range?: ScheduleRangeDto | null;
}
export interface WorkAssigneeDto {
  slotId: number;
  employeeId: number;
  employeeNumber: string;
  name: string;
}
export interface WorkOccurrenceDto {
  dutyId: number;
  dutyName: string;
  sequence: number;
  date: string | null;
  rotationMode: 'CALENDAR' | 'OCCURRENCE';
  rotationKey: string;
  periodStart: string | null;
  periodEnd: string | null;
  assignees: WorkAssigneeDto[];
  warning: string | null;
  holiday: boolean;
  dateEditable?: boolean;
  segmented?: boolean;
}
export interface ScheduleResultDto {
  occurrences: WorkOccurrenceDto[];
  duties: AutomaticDutyDto[];
}
export interface HolidayDto {
  date: string;
  name: string;
}
export interface RotationChangeDto {
  id: number;
  previousName: string;
  newName: string;
  reason: string;
  changedAt: string;
}
