import {automaticApi} from '@/apis/automatic/automatic.api';
import {
  toAutomaticDraftDto,
  toAutomaticDuty,
  toRotationPreview,
  toScheduleResult,
} from './automatic.mapper';
import type {AutomaticDraft, Holiday} from './automatic.domain';
export const automaticRepository = {
  preview: async (d: AutomaticDraft) =>
    toRotationPreview(await automaticApi.preview(toAutomaticDraftDto(d))),
  activate: (d: AutomaticDraft, token: string) =>
    automaticApi.activate(toAutomaticDraftDto(d), token),
  catalog: async (signal?: AbortSignal) =>
    (await automaticApi.catalog(signal)).map(toAutomaticDuty),
  schedule: async (from: string, to: string, signal?: AbortSignal) =>
    toScheduleResult(await automaticApi.schedule(from, to, signal)),
  meeting: (id: number, sequence: number, date: string) => automaticApi.meeting(id, sequence, date),
  replace: (id: number, employeeId: number, reason: string) =>
    automaticApi.replace(id, employeeId, reason),
  changes: async (id: number, signal?: AbortSignal) =>
    (await automaticApi.changes(id, signal)).map(c => ({...c})),
  holidays: async (signal?: AbortSignal) =>
    (await automaticApi.holidays(signal)).map(h => ({...h})),
  saveHoliday: (h: Holiday) => automaticApi.saveHoliday({...h}),
  removeHoliday: (date: string) => automaticApi.removeHoliday(date),
};
