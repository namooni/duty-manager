import {systemApi} from '@/apis/system/system.api';
import {toSystemInfo} from './system.mapper';
export const systemRepository = {
  info: async (signal?: AbortSignal) => toSystemInfo(await systemApi.info(signal)),
};
