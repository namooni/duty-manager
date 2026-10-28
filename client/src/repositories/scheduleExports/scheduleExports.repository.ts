import {scheduleExportsApi} from '@/apis/scheduleExports/scheduleExports.api';
import {toDownloadFile} from './scheduleExports.mapper';
import type {ScheduleExportInput} from './scheduleExports.domain';
export const scheduleExportsRepository = {
  download: async (id: number, name: string, input: ScheduleExportInput) =>
    toDownloadFile(await scheduleExportsApi.download(id, {...input}), name, input),
};
