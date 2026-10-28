import type {EmployeeDto} from '@/repositories/employees/employees.dto';
import type {RotationMode} from '@/repositories/automatic/automatic.domain';
export interface ScheduleDateInputDto {
  rotationKey: string;
  date: string;
  reason: string;
}
export interface DatePeriodDto {
  rotationKey: string;
  start: string | null;
  end: string | null;
  assignees: EmployeeDto[];
}
export interface DateHistoryDto {
  id: number;
  rotationKey: string;
  previousStart: string | null;
  previousEnd: string | null;
  newStart: string;
  newEnd: string;
  reason: string;
  createdAt: string;
}
export interface ScheduleDateContextDto {
  dutyName: string;
  mode: RotationMode;
  minimum: string;
  maximum: string;
  currentDate: string | null;
  periods: DatePeriodDto[];
  history: DateHistoryDto[];
}
export interface ScheduleDateReviewDto {
  token: string;
  rows: {before: DatePeriodDto; after: DatePeriodDto}[];
  warnings: string[];
}
