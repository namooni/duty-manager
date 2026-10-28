import type {Duty, Strategy} from '@/repositories/duties/duties.domain';
import type {Employee} from '@/repositories/employees/employees.domain';
export type AssignmentChangeInput = Readonly<{
  kind: 'DUTY' | 'STATUS';
  dutyId: number | null;
  employeeId: number | null;
  active: boolean | null;
  effectiveIndex: number | null;
  strategy: Strategy | null;
  assigneeCount: number | null;
  memberIds: readonly number[];
  firstEmployeeId: number | null;
  reason: string;
  handovers?: Readonly<Record<number, number>>;
  replacements: Readonly<Record<string, number>>;
}>;
export type AssignmentBoundary = Readonly<{
  index: number;
  start: string | null;
  end: string | null;
}>;
export type AssignmentContext = Readonly<{
  duty: Duty;
  currentAssignments?: readonly CurrentAssignment[];
  nextCandidates?: readonly number[];
  handoverDate?: string;
  boundaries: readonly AssignmentBoundary[];
  employees: readonly Employee[];
  history: readonly Readonly<{
    id: number;
    startIndex: number;
    strategy: Strategy;
    assigneeCount: number;
    reason: string;
    createdAt: string;
    superseded: boolean;
  }>[];
}>;
export type AssignmentReviewRow = Readonly<{
  key: string;
  dutyId: number;
  dutyName: string;
  sequence: number;
  slotIndex: number;
  start: string | null;
  end: string | null;
  before: Employee | null;
  after: Employee | null;
  protectedAssignment: boolean;
  conflict: boolean;
  choices: readonly Employee[];
  message: string;
}>;
export type AssignmentReview = Readonly<{
  token: string;
  rows: readonly AssignmentReviewRow[];
  warnings: readonly string[];
  canApply: boolean;
  currentRows?: readonly AssignmentReviewRow[];
  summaries: readonly string[];
}>;

export const CurrentHandling = {CONTINUE: 'CONTINUE', HANDOVER: 'HANDOVER'} as const;
export type CurrentHandling = (typeof CurrentHandling)[keyof typeof CurrentHandling];
export type CurrentAssignment = Readonly<{
  originalEmployeeId?: number | null;
  slotId: number;
  slotIndex: number;
  start: string;
  end: string;
  employee: Employee;
}>;
