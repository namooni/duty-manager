import apiClient from '@/apis/apiClient';
import type {
  AutomaticDraftDto,
  AutomaticDutyDto,
  RotationPreviewDto,
  ScheduleResultDto,
  HolidayDto,
  RotationChangeDto,
} from '@/repositories/automatic/automatic.dto';
const root = '/automatic-duties';
export const automaticApi = {
  preview: async (draft: AutomaticDraftDto) =>
    (await apiClient.post<RotationPreviewDto>(root + '/preview', draft)).data,
  activate: async (draft: AutomaticDraftDto, token: string) =>
    (await apiClient.post<{id: number}>(root, {draft, token})).data,
  catalog: async (signal?: AbortSignal) =>
    (await apiClient.get<AutomaticDutyDto[]>(root, {signal})).data,
  schedule: async (from: string, to: string, signal?: AbortSignal) =>
    (await apiClient.post<ScheduleResultDto>(root + '/schedule', {from, to}, {signal})).data,
  meeting: async (id: number, sequence: number, date: string) => {
    await apiClient.put(root + '/' + id + '/meetings/' + sequence, {date});
  },
  replace: async (id: number, employeeId: number, reason: string) => {
    await apiClient.patch(root + '/slots/' + id, {employeeId, reason});
  },
  changes: async (id: number, signal?: AbortSignal) =>
    (await apiClient.get<RotationChangeDto[]>(root + '/slots/' + id + '/changes', {signal})).data,
  holidays: async (signal?: AbortSignal) =>
    (await apiClient.get<HolidayDto[]>(root + '/holidays', {signal})).data,
  saveHoliday: async (input: HolidayDto) => {
    await apiClient.put(root + '/holidays', input);
  },
  removeHoliday: async (date: string) => {
    await apiClient.delete(root + '/holidays/' + date);
  },
};
