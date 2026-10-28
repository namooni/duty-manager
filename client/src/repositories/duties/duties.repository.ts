import {dutiesApi} from '@/apis/duties/duties.api';
import {toDuty, toDutyInputDto, toExclusion, toPreview} from './duties.mapper';
import type {DutyDetailsInput, DutyDraft, DutyInput, ExclusionInput} from './duties.domain';
const toDraftDto = (draft: DutyDraft) => ({...draft, duty: toDutyInputDto(draft.duty)});
export const dutiesRepository = {
  find: async (id: number, signal?: AbortSignal) => toDuty(await dutiesApi.find(id, signal)),
  updateDetails: (id: number, input: DutyDetailsInput) => dutiesApi.updateDetails(id, {...input}),
  remove: (id: number) => dutiesApi.remove(id),
  previewDraft: async (draft: DutyDraft) =>
    toPreview(await dutiesApi.previewDraft(toDraftDto(draft))),
  createConfirmed: (draft: DutyDraft, token: string) =>
    dutiesApi.createConfirmed(toDraftDto(draft), token),
  list: async (signal?: AbortSignal) => (await dutiesApi.list(signal)).map(toDuty),
  create: (input: DutyInput) => dutiesApi.create(toDutyInputDto(input)),
  preview: async (id: number, from: string, to: string, signal?: AbortSignal) =>
    toPreview(await dutiesApi.preview(id, from, to, signal)),
  exclusions: async (id: number, signal?: AbortSignal) =>
    (await dutiesApi.exclusions(id, signal)).map(toExclusion),
  confirm: (id: number, from: string, to: string, token: string) =>
    dutiesApi.confirm(id, {from, to, token}),
  addExclusion: (id: number, input: ExclusionInput) => dutiesApi.addExclusion(id, {...input}),
};
