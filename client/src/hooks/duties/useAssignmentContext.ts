import {useCallback} from 'react';
import {useRetainedRequest} from '@/hooks/common/useRetainedRequest';
import {assignmentChangesRepository} from '@/repositories/assignmentChanges/assignmentChanges.repository';
export function useAssignmentContext(id: number) {
  const load = useCallback(
    (signal: AbortSignal) => assignmentChangesRepository.context(id, signal),
    [id],
  );
  return useRetainedRequest('assignment-edit:' + id, load);
}
