import apiClient from '@/apis/apiClient';
import type {
  AssignmentChangeInputDto,
  AssignmentContextDto,
  AssignmentReviewDto,
} from '@/repositories/assignmentChanges/assignmentChanges.dto';
const root = '/assignment-changes';
export const assignmentChangesApi = {
  context: async (id: number, signal?: AbortSignal) =>
    (await apiClient.get<AssignmentContextDto>(root + '/duties/' + id, {signal})).data,
  preview: async (input: AssignmentChangeInputDto) =>
    (await apiClient.post<AssignmentReviewDto>(root + '/preview', input)).data,
  confirm: async (input: AssignmentChangeInputDto, token: string) => {
    await apiClient.post(root + '/confirm', {input, token});
  },
};
