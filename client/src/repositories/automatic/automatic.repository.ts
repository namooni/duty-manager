import {toEmployee} from '@/repositories/employees/employees.mapper';
import {automaticApi} from '@/apis/automatic/automatic.api';
import {
  toAutomaticDraftDto,
  toAutomaticDuty,
  toRotationPreview,
  toScheduleResult,
} from './automatic.mapper';
import type {AutomaticDraft, Holiday} from './automatic.domain';
export const automaticRepository = {
  allocationPreview: async (id: number, input: import('./automatic.domain').AllocationExtension) =>
    toRotationPreview(await automaticApi.allocationPreview(id, {...input})),
  allocate: (id: number, input: import('./automatic.domain').AllocationExtension, token: string) =>
    automaticApi.allocate(id, {...input}, token),
  replacementChoices: async (id: number, signal?: AbortSignal, from?: string) =>
    (await automaticApi.replacementChoices(id, signal, from)).map(toEmployee),
  dutySchedule: async (id: number, from: string, to: string, signal?: AbortSignal) =>
    toScheduleResult(await automaticApi.dutySchedule(id, from, to, signal)),
  preview: async (d: AutomaticDraft) =>
    toRotationPreview(await automaticApi.preview(toAutomaticDraftDto(d))),
  activate: (d: AutomaticDraft, token: string) =>
    automaticApi.activate(toAutomaticDraftDto(d), token),
  catalog: async (signal?: AbortSignal) =>
    (await automaticApi.catalog(signal)).map(toAutomaticDuty),
  schedule: async (from: string, to: string, signal?: AbortSignal) =>
    toScheduleResult(await automaticApi.schedule(from, to, signal)),
  meeting: (id: number, sequence: number, date: string) => automaticApi.meeting(id, sequence, date),
  replace: (id: number, employeeId: number, reason: string, from?: string) =>
    automaticApi.replace(id, employeeId, reason, from),
  changes: async (id: number, signal?: AbortSignal) =>
    (await automaticApi.changes(id, signal)).map(c => ({...c})),
  holidays: async (signal?: AbortSignal) =>
    (await automaticApi.holidays(signal)).map(h => ({...h})),
  saveHoliday: (h: Holiday) => automaticApi.saveHoliday({...h}),
  removeHoliday: (date: string) => automaticApi.removeHoliday(date),
};
