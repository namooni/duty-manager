import {assignmentChangesRepository} from '@/repositories/assignmentChanges/assignmentChanges.repository';
import type {WorkOccurrence, WorkAssignee} from '@/repositories/automatic/automatic.domain';
import {useAssignmentReview} from './useAssignmentReview';
export function useScheduleHandover(today: string, onSaved: () => void) {
  const review = useAssignmentReview(onSaved);
  const isCurrent = (event: WorkOccurrence) =>
    event.rotationMode === 'CALENDAR' &&
    !!event.periodStart &&
    !!event.periodEnd &&
    event.periodStart <= today &&
    event.periodEnd >= today;
  return {
    ...review,
    isCurrent,
    previewHandover: (
      event: WorkOccurrence,
      person: WorkAssignee,
      employeeId: number,
      reason: string,
    ) =>
      review.preview(async () => {
        if (!isCurrent(event) || !employeeId || !reason.trim() || reason.trim().length > 300)
          throw new Error('変更後の担当者と理由を入力してください。');
        const context = await assignmentChangesRepository.context(event.dutyId);
        if (
          !context.currentAssignments?.some(
            current =>
              current.slotId === person.slotId && current.employee.id === person.employeeId,
          )
        )
          throw new Error('現在の担当が変更されています。画面を開き直してください。');
        const boundary = context.boundaries[0];
        if (!boundary)
          throw new Error('引継ぎ後の順番を確認できません。画面を開き直してください。');
        return {
          kind: 'DUTY',
          dutyId: event.dutyId,
          employeeId: null,
          active: null,
          effectiveIndex: boundary.index,
          strategy: context.duty.strategy,
          assigneeCount: context.duty.assigneeCount,
          memberIds: context.duty.memberIds,
          firstEmployeeId: null,
          reason: reason.trim(),
          replacements: {},
          handovers: {[person.slotId]: employeeId},
        };
      }),
  };
}
