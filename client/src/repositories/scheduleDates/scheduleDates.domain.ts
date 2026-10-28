import type {Employee} from '@/repositories/employees/employees.domain';
import type {RotationMode} from '@/repositories/automatic/automatic.domain';
export type ScheduleDateInput = Readonly<{rotationKey: string; date: string; reason: string}>;
export type DatePeriod = Readonly<{
  rotationKey: string;
  start: string | null;
  end: string | null;
  assignees: readonly Employee[];
}>;
export type DateHistory = Readonly<{
  id: number;
  rotationKey: string;
  previousStart: string | null;
  previousEnd: string | null;
  newStart: string;
  newEnd: string;
  reason: string;
  createdAt: string;
}>;
export type ScheduleDateContext = Readonly<{
  dutyName: string;
  mode: RotationMode;
  minimum: string;
  maximum: string;
  currentDate: string | null;
  periods: readonly DatePeriod[];
  history: readonly DateHistory[];
}>;
export type ScheduleDateReview = Readonly<{
  token: string;
  rows: readonly Readonly<{before: DatePeriod; after: DatePeriod}>[];
  warnings: readonly string[];
}>;
