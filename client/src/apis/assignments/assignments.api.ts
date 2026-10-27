import apiClient from '@/apis/apiClient';
import type {AssignmentDto, ChangeDto} from '@/repositories/assignments/assignments.dto';
export const assignmentsApi = {
  list: async (from: string, to: string, signal?: AbortSignal) =>
    (await apiClient.get<AssignmentDto[]>('/assignments', {params: {from, to}, signal})).data,
  changes: async (id: number, signal?: AbortSignal) =>
    (await apiClient.get<ChangeDto[]>(`/assignments/${id}/changes`, {signal})).data,
  replace: async (id: number, employeeId: number, reason: string) => {
    await apiClient.patch(`/assignments/${id}`, {employeeId, reason});
  },
};
