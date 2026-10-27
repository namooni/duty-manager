import type {Employee} from '@/repositories/employees/employees.domain';
export const IntervalUnits = {DAY: 'DAY', WEEK: 'WEEK', MONTH: 'MONTH'} as const;
export type IntervalUnit = (typeof IntervalUnits)[keyof typeof IntervalUnits];
export const Strategies = {
  EMPLOYEE_NUMBER: 'EMPLOYEE_NUMBER',
  CUSTOM: 'CUSTOM',
  SHUFFLED_ROUND: 'SHUFFLED_ROUND',
} as const;
export type Strategy = (typeof Strategies)[keyof typeof Strategies];
export type DutyInput = Readonly<{
  name: string;
  description: string;
  anchorDate: string;
  intervalCount: number;
  intervalUnit: IntervalUnit;
  strategy: Strategy;
  assigneeCount: number;
  memberIds: readonly number[];
}>;
export type DutyDraft = Readonly<{duty: DutyInput; from: string; to: string; seed: number}>;
export type Duty = DutyInput & Readonly<{id: number}>;
export type Exclusion = Readonly<{
  id: number;
  dutyId: number;
  employeeId: number;
  startDate: string;
  endDate: string;
  reason: string;
}>;
export type ExclusionInput = Readonly<{
  employeeId: number;
  startDate: string;
  endDate: string;
  reason: string;
}>;
export type Period = Readonly<{
  start: string;
  end: string;
  assignees: readonly Employee[];
  confirmed: boolean;
  warning: string | null;
}>;
export type Preview = Readonly<{token: string; periods: readonly Period[]}>;
