import apiClient from '@/apis/apiClient';
import type {ScheduleExportInputDto} from '@/repositories/scheduleExports/scheduleExports.dto';
export const scheduleExportsApi = {
  download: async (id: number, input: ScheduleExportInputDto) =>
    (
      await apiClient.post<ArrayBuffer>('/automatic-duties/' + id + '/export', input, {
        responseType: 'arraybuffer',
        headers: {Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'},
      })
    ).data,
};
