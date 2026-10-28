import type {
  AssignmentChangeInput,
  AssignmentContext,
  AssignmentReview,
} from './assignmentChanges.domain';
import type {
  AssignmentChangeInputDto,
  AssignmentContextDto,
  AssignmentReviewDto,
} from './assignmentChanges.dto';
import {toDuty} from '@/repositories/duties/duties.mapper';
import {toEmployee} from '@/repositories/employees/employees.mapper';
export const toChangeDto = (input: AssignmentChangeInput): AssignmentChangeInputDto => ({
  ...input,
  memberIds: [...input.memberIds],
  replacements: {...input.replacements},
  handovers: {...input.handovers},
});
export const toContext = (dto: AssignmentContextDto): AssignmentContext => ({
  ...dto,
  duty: toDuty(dto.duty),
  boundaries: dto.boundaries.map(item => ({...item})),
  employees: dto.employees.map(toEmployee),
  currentAssignments: (dto.currentAssignments ?? []).map(item => ({
    ...item,
    employee: toEmployee(item.employee),
  })),
  nextCandidates: [...(dto.nextCandidates ?? [])],
  history: dto.history.map(item => ({...item})),
});
export const toReview = (dto: AssignmentReviewDto): AssignmentReview => ({
  ...dto,
  rows: dto.rows.map(toRow),
  currentRows: (dto.currentRows ?? []).map(toRow),
  warnings: [...dto.warnings],
  summaries: [...dto.summaries],
});

const toRow = (row: import('./assignmentChanges.dto').AssignmentReviewRowDto) => ({
  ...row,
  before: row.before ? toEmployee(row.before) : null,
  after: row.after ? toEmployee(row.after) : null,
  choices: row.choices.map(toEmployee),
});
