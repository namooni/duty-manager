import type {DutyDto} from '@/repositories/duties/duties.dto';
import type {EmployeeDto} from '@/repositories/employees/employees.dto';
import type {Strategy} from '@/repositories/duties/duties.domain';
export interface AssignmentChangeInputDto {
  kind: 'DUTY' | 'STATUS';
  dutyId: number | null;
  employeeId: number | null;
  active: boolean | null;
  effectiveIndex: number | null;
  strategy: Strategy | null;
  assigneeCount: number | null;
  memberIds: number[];
  firstEmployeeId: number | null;
  reason: string;
  handovers?: Record<number, number>;
  replacements: Record<string, number>;
}
export interface AssignmentContextDto {
  duty: DutyDto;
  currentAssignments?: {
    originalEmployeeId?: number | null;
    slotId: number;
    slotIndex: number;
    start: string;
    end: string;
    employee: EmployeeDto;
  }[];
  nextCandidates?: number[];
  handoverDate?: string;
  boundaries: {index: number; start: string | null; end: string | null}[];
  employees: EmployeeDto[];
  history: {
    id: number;
    startIndex: number;
    strategy: Strategy;
    assigneeCount: number;
    reason: string;
    createdAt: string;
    superseded: boolean;
  }[];
}
export interface AssignmentReviewDto {
  token: string;
  rows: {
    key: string;
    dutyId: number;
    dutyName: string;
    sequence: number;
    slotIndex: number;
    start: string | null;
    end: string | null;
    before: EmployeeDto | null;
    after: EmployeeDto | null;
    protectedAssignment: boolean;
    conflict: boolean;
    choices: EmployeeDto[];
    message: string;
  }[];
  warnings: string[];
  canApply: boolean;
  currentRows?: AssignmentReviewRowDto[];
  summaries: string[];
}

export type AssignmentReviewRowDto = AssignmentReviewDto['rows'][number];
