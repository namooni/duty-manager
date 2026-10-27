import apiClient from '@/apis/apiClient';
import type {EmployeeDto, EmployeeInputDto} from '@/repositories/employees/employees.dto';
export const employeesApi = {
  list: async (signal?: AbortSignal) =>
    (await apiClient.get<EmployeeDto[]>('/employees', {signal})).data,
  create: async (input: EmployeeInputDto) =>
    (await apiClient.post<{id: number}>('/employees', input)).data,
  setActive: async (id: number, active: boolean) => {
    await apiClient.patch(`/employees/${id}/active`, {active});
  },
};
