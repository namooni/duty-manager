import {employeesApi} from '@/apis/employees/employees.api';
import type {EmployeeInput} from './employees.domain';
import {toEmployee} from './employees.mapper';
export const employeesRepository = {
  list: async (signal?: AbortSignal) => (await employeesApi.list(signal)).map(toEmployee),
  create: (input: EmployeeInput) => employeesApi.create({...input}),
  setActive: (id: number, active: boolean) => employeesApi.setActive(id, active),
};
