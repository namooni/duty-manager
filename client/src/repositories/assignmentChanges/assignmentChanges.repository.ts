import {assignmentChangesApi} from '@/apis/assignmentChanges/assignmentChanges.api';
import {toChangeDto, toContext, toReview} from './assignmentChanges.mapper';
import type {AssignmentChangeInput} from './assignmentChanges.domain';
export const assignmentChangesRepository = {
  context: async (id: number, signal?: AbortSignal) =>
    toContext(await assignmentChangesApi.context(id, signal)),
  preview: async (input: AssignmentChangeInput) =>
    toReview(await assignmentChangesApi.preview(toChangeDto(input))),
  confirm: (input: AssignmentChangeInput, token: string) =>
    assignmentChangesApi.confirm(toChangeDto(input), token),
};
