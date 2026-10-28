import type {ScheduleDateContext, ScheduleDateReview} from './scheduleDates.domain';
import type {
  DatePeriodDto,
  ScheduleDateContextDto,
  ScheduleDateReviewDto,
} from './scheduleDates.dto';
import {toEmployee} from '@/repositories/employees/employees.mapper';
const period = (p: DatePeriodDto) => ({...p, assignees: p.assignees.map(toEmployee)});
export const toDateContext = (c: ScheduleDateContextDto): ScheduleDateContext => ({
  ...c,
  periods: c.periods.map(period),
  history: c.history.map(h => ({...h})),
});
export const toDateReview = (r: ScheduleDateReviewDto): ScheduleDateReview => ({
  ...r,
  rows: r.rows.map(row => ({before: period(row.before), after: period(row.after)})),
  warnings: [...r.warnings],
});
