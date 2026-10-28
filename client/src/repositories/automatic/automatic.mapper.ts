import type {
  AutomaticDraft,
  AutomaticDuty,
  RotationPreview,
  ScheduleResult,
} from './automatic.domain';
import type {
  AutomaticDraftDto,
  AutomaticDutyDto,
  RotationPreviewDto,
  ScheduleResultDto,
} from './automatic.dto';
import {toDuty, toDutyInputDto} from '@/repositories/duties/duties.mapper';
import {toEmployee} from '@/repositories/employees/employees.mapper';
export const toAutomaticDraftDto = (d: AutomaticDraft): AutomaticDraftDto => ({
  ...d,
  duty: toDutyInputDto(d.duty),
  schedule: {...d.schedule, weekdays: [...d.schedule.weekdays]},
  dates: [...d.dates],
});
export const toAutomaticDuty = (d: AutomaticDutyDto): AutomaticDuty => ({
  duty: toDuty(d.duty),
  schedule: {...d.schedule, weekdays: [...d.schedule.weekdays]},
  meetings: d.meetings.map(m => ({...m})),
  range: d.range ? {...d.range} : null,
});
export const toRotationPreview = (p: RotationPreviewDto): RotationPreview => ({
  token: p.token,
  range: p.range ? {...p.range} : null,
  turns: p.turns.map(t => ({...t, assignees: t.assignees.map(toEmployee)})),
});
export const toScheduleResult = (r: ScheduleResultDto): ScheduleResult => ({
  occurrences: r.occurrences.map(o => ({...o, assignees: o.assignees.map(a => ({...a}))})),
  duties: r.duties.map(toAutomaticDuty),
});
