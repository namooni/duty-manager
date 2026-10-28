import type {EmployeeDto} from '@/repositories/employees/employees.dto';
export interface DutyInputDto {
  name: string;
  description: string;
  anchorDate: string;
  intervalCount: number;
  intervalUnit: 'DAY' | 'WEEK' | 'MONTH';
  strategy: 'EMPLOYEE_NUMBER' | 'CUSTOM' | 'SHUFFLED_ROUND';
  assigneeCount: number;
  memberIds: number[];
}
export interface DutyDraftDto {
  duty: DutyInputDto;
  from: string;
  to: string;
  seed: number;
}
export interface DutyDto extends DutyInputDto {
  id: number;
}
export interface ExclusionDto {
  id: number;
  dutyId: number;
  employeeId: number;
  startDate: string;
  endDate: string;
  reason: string;
}
export interface ExclusionInputDto {
  employeeId: number;
  startDate: string;
  endDate: string;
  reason: string;
}
export interface PeriodDto {
  start: string;
  end: string;
  assignees: EmployeeDto[];
  confirmed: boolean;
  warning: string | null;
}
export interface PreviewDto {
  token: string;
  periods: PeriodDto[];
}
export interface ConfirmInputDto {
  from: string;
  to: string;
  token: string;
}

export type DutyDetailsInputDto = Readonly<{
  name: string;
  description: string;
  expectedName: string;
  expectedDescription: string;
}>;
