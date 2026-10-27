import type {DutyDto, DutyInputDto, ExclusionDto, PreviewDto} from './duties.dto';
import type {Duty, DutyInput, Exclusion, Preview} from './duties.domain';
import {toEmployee} from '@/repositories/employees/employees.mapper';
export const toDuty = (dto: DutyDto): Duty => ({...dto, memberIds: [...dto.memberIds]});
export const toDutyInputDto = (input: DutyInput): DutyInputDto => ({
  ...input,
  memberIds: [...input.memberIds],
});
export const toExclusion = (dto: ExclusionDto): Exclusion => ({...dto});
export const toPreview = (dto: PreviewDto): Preview => ({
  token: dto.token,
  periods: dto.periods.map(period => ({...period, assignees: period.assignees.map(toEmployee)})),
});
