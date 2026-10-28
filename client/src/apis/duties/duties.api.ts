import apiClient from '@/apis/apiClient';
import type {
  DutyDetailsInputDto,
  DutyDraftDto,
  DutyDto,
  DutyInputDto,
  ExclusionDto,
  ExclusionInputDto,
  PreviewDto,
  ConfirmInputDto,
} from '@/repositories/duties/duties.dto';
export const dutiesApi = {
  find: async (id: number, signal?: AbortSignal) =>
    (await apiClient.get<DutyDto>('/duties/' + id, {signal})).data,
  updateDetails: async (id: number, input: DutyDetailsInputDto) => {
    await apiClient.patch('/duties/' + id, input);
  },
  remove: async (id: number) => {
    await apiClient.delete('/duties/' + id);
  },
  previewDraft: async (draft: DutyDraftDto) =>
    (await apiClient.post<PreviewDto>('/duties/preview', draft)).data,
  createConfirmed: async (draft: DutyDraftDto, token: string) =>
    (await apiClient.post<{id: number}>('/duties/create-confirmed', {draft, token})).data,
  list: async (signal?: AbortSignal) => (await apiClient.get<DutyDto[]>('/duties', {signal})).data,
  create: async (input: DutyInputDto) =>
    (await apiClient.post<{id: number}>('/duties', input)).data,
  preview: async (id: number, from: string, to: string, signal?: AbortSignal) =>
    (await apiClient.get<PreviewDto>(`/duties/${id}/preview`, {params: {from, to}, signal})).data,
  exclusions: async (id: number, signal?: AbortSignal) =>
    (await apiClient.get<ExclusionDto[]>(`/duties/${id}/exclusions`, {signal})).data,
  confirm: async (id: number, input: ConfirmInputDto) => {
    await apiClient.post(`/duties/${id}/confirm`, input);
  },
  addExclusion: async (id: number, input: ExclusionInputDto) => {
    await apiClient.post(`/duties/${id}/exclusions`, input);
  },
};
