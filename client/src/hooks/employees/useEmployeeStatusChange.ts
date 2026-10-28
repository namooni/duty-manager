import {useState} from 'react';
import type {Employee} from '@/repositories/employees/employees.domain';
import {useDutyUiStore} from '@/stores/duties/dutyUi.store';
import {useAssignmentReview} from '@/hooks/duties/useAssignmentReview';
export function useEmployeeStatusChange() {
  const [target, setTarget] = useState<Employee | null>(null),
    [reason, setReason] = useState('');
  const review = useAssignmentReview(() => setTarget(null));
  return {
    target,
    reason,
    setReason,
    review,
    open: (employee: Employee) => {
      if (useDutyUiStore.getState().busy) return;
      review.back();
      setReason(employee.active ? 'メンバーを無効にする' : 'メンバーを有効にする');
      setTarget(employee);
    },
    close: () => {
      if (!useDutyUiStore.getState().busy) {
        setTarget(null);
        review.back();
      }
    },
    preview: () => {
      if (target)
        return review.preview({
          kind: 'STATUS',
          dutyId: null,
          employeeId: target.id,
          active: !target.active,
          effectiveIndex: null,
          strategy: null,
          assigneeCount: null,
          memberIds: [],
          firstEmployeeId: null,
          reason,
          replacements: {},
        });
    },
  };
}
export type EmployeeStatusChange = ReturnType<typeof useEmployeeStatusChange>;
