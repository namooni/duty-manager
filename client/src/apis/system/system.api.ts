import apiClient from '@/apis/apiClient';
import type {SystemDto} from '@/repositories/system/system.dto';
export const systemApi = {
  info: async (signal?: AbortSignal) => (await apiClient.get<SystemDto>('/health', {signal})).data,
};
