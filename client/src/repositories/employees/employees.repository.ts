import {employeesApi} from '@/apis/employees/employees.api';
import type {EmployeeDeletionStatus, EmployeeUpdateInput, EmployeeInput} from './employees.domain';
import {toEmployee} from './employees.mapper';
export const employeesRepository = {
  update: (id: number, input: EmployeeUpdateInput) =>
    employeesApi.update(id, {employee: {...input.employee}, expected: {...input.expected}}),
  remove: (id: number) => employeesApi.remove(id),
  deletionStatus: async (id: number, signal?: AbortSignal): Promise<EmployeeDeletionStatus> => ({
    ...(await employeesApi.deletionStatus(id, signal)),
  }),
  list: async (signal?: AbortSignal) => (await employeesApi.list(signal)).map(toEmployee),
  create: (input: EmployeeInput) => employeesApi.create({...input}),
  setActive: (id: number, active: boolean) => employeesApi.setActive(id, active),
};
