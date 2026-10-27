import {assignmentsApi} from '@/apis/assignments/assignments.api';
import {toAssignment, toChange} from './assignments.mapper';
export const assignmentsRepository = {
  list: async (from: string, to: string, signal?: AbortSignal) =>
    (await assignmentsApi.list(from, to, signal)).map(toAssignment),
  changes: async (id: number, signal?: AbortSignal) =>
    (await assignmentsApi.changes(id, signal)).map(toChange),
  replace: (id: number, employeeId: number, reason: string) =>
    assignmentsApi.replace(id, employeeId, reason),
};
