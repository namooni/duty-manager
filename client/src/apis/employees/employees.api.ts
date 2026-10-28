import apiClient from '@/apis/apiClient';
import type {
  EmployeeDeletionStatusDto,
  EmployeeUpdateInputDto,
  EmployeeDto,
  EmployeeInputDto,
} from '@/repositories/employees/employees.dto';
export const employeesApi = {
  update: async (id: number, input: EmployeeUpdateInputDto) => {
    await apiClient.patch('/employees/' + id, input);
  },
  remove: async (id: number) => {
    await apiClient.delete('/employees/' + id);
  },
  deletionStatus: async (id: number, signal?: AbortSignal) =>
    (
      await apiClient.get<EmployeeDeletionStatusDto>('/employees/' + id + '/deletion-status', {
        signal,
      })
    ).data,
  list: async (signal?: AbortSignal) =>
    (await apiClient.get<EmployeeDto[]>('/employees', {signal})).data,
  create: async (input: EmployeeInputDto) =>
    (await apiClient.post<{id: number}>('/employees', input)).data,
  setActive: async (id: number, active: boolean) => {
    await apiClient.patch(`/employees/${id}/active`, {active});
  },
};
