import apiClient from '@/apis/apiClient';
import type {
  ScheduleDateContextDto,
  ScheduleDateInputDto,
  ScheduleDateReviewDto,
} from '@/repositories/scheduleDates/scheduleDates.dto';
const root = (id: number) => '/automatic-duties/' + id + '/date-changes';
export const scheduleDatesApi = {
  history: async (id: number, key: string) =>
    (
      await apiClient.get<
        import('@/repositories/scheduleDates/scheduleDates.dto').DateHistoryDto[]
      >(root(id) + '/' + encodeURIComponent(key) + '/history')
    ).data,
  context: async (id: number, key: string) =>
    (await apiClient.get<ScheduleDateContextDto>(root(id) + '/' + encodeURIComponent(key))).data,
  preview: async (id: number, input: ScheduleDateInputDto) =>
    (await apiClient.post<ScheduleDateReviewDto>(root(id) + '/preview', input)).data,
  confirm: async (id: number, input: ScheduleDateInputDto, token: string) => {
    await apiClient.post(root(id), {input, token});
  },
};
