import {useState} from 'react';
import {
  CurrentHandling,
  type AssignmentContext,
} from '@/repositories/assignmentChanges/assignmentChanges.domain';
import {useDutyForm} from './useDutyForm';
import {useAssignmentReview} from './useAssignmentReview';
export function useAssignmentEditor(context: AssignmentContext, onSaved: () => void) {
  const rejoinBefore = Object.fromEntries(
    (context.currentAssignments ?? [])
      .filter(
        a =>
          a.originalEmployeeId &&
          a.originalEmployeeId !== a.employee.id &&
          !context.duty.memberIds.includes(a.originalEmployeeId),
      )
      .map(a => [a.originalEmployeeId!, a.employee.id]),
  );
  const duty = useDutyForm(context.employees, context.duty.anchorDate, context.duty, rejoinBefore);
  const restorationRows = (context.currentAssignments ?? [])
    .filter(
      a =>
        a.originalEmployeeId &&
        rejoinBefore[a.originalEmployeeId] &&
        duty.form.memberIds.includes(a.originalEmployeeId),
    )
    .map(a => ({...a, original: context.employees.find(e => e.id === a.originalEmployeeId)!}));
  const [effectiveIndex, setEffectiveIndex] = useState(context.boundaries[0]?.index ?? 0),
    [reason, setReason] = useState(''),
    [first, setFirst] = useState('');
  const [handling, setHandling] = useState<CurrentHandling>(CurrentHandling.CONTINUE),
    [selected, setSelected] = useState<Readonly<Record<number, number>>>({});
  const review = useAssignmentReview(onSaved);
  const current = context.currentAssignments ?? [];
  const removedCurrent = current.filter(
    person => !duty.form.memberIds.includes(person.employee.id),
  );
  const handoverActive =
    restorationRows.length > 0 ||
    (removedCurrent.length > 0 && handling === CurrentHandling.HANDOVER);
  const blocked = new Set(
    current.filter(person => !removedCurrent.includes(person)).map(person => person.employee.id),
  );
  const choices = duty.choices.filter(
    person => person.selected && person.active && !blocked.has(person.id),
  );
  const order = [...new Set([...(context.nextCandidates ?? []), ...duty.form.memberIds])];
  const used = new Set<number>();
  const handoverRows = removedCurrent.map(person => {
    const valid = choices.some(p => p.id === selected[person.slotId]);
    const chosen = valid
      ? selected[person.slotId]
      : order.find(id => choices.some(p => p.id === id) && !used.has(id));
    if (chosen) used.add(chosen);
    return {...person, selected: chosen ?? ''};
  });
  return {
    duty,
    effectiveIndex,
    setEffectiveIndex,
    reason,
    setReason,
    first,
    setFirst,
    review,
    removedCurrent,
    restorationRows,
    handoverRows,
    handoverChoices: choices,
    handoverActive,
    currentHandling: handling,
    handoverDate: context.handoverDate ?? '',
    handoverAvailable:
      !!context.handoverDate && removedCurrent.every(p => p.end >= context.handoverDate!),
    setCurrentHandling: (value: CurrentHandling) => {
      setHandling(value);
      if (value === CurrentHandling.HANDOVER) {
        setEffectiveIndex(context.boundaries[0]?.index ?? 0);
        setFirst('');
      }
    },
    setHandover: (slotId: number, id: number) =>
      setSelected(previous => ({...previous, [slotId]: id})),
    firstChoices: duty.choices.filter(person => person.selected && person.active),
    preview: () =>
      review.preview(() => {
        const input = duty.input();
        if (!reason.trim() || reason.trim().length > 300)
          throw new Error('変更理由を300文字以内で入力してください。');
        const handovers: Record<number, number> = {};
        if (handoverActive) {
          if (
            !context.handoverDate ||
            handoverRows.some(row => !row.selected || row.end < context.handoverDate!)
          )
            throw new Error('残りの担当期間と引継ぎ先を確認してください。');
          for (const row of handoverRows) handovers[row.slotId] = Number(row.selected);
          if (new Set(Object.values(handovers)).size !== handoverRows.length)
            throw new Error('引継ぎ先が重複しています。別のメンバーを選択してください。');
        }
        return {
          kind: 'DUTY',
          dutyId: context.duty.id,
          employeeId: null,
          active: null,
          effectiveIndex: restorationRows.length ? context.boundaries[0].index : effectiveIndex,
          strategy: input.strategy,
          assigneeCount: input.assigneeCount,
          memberIds: input.memberIds,
          firstEmployeeId: handoverActive ? null : first ? Number(first) : null,
          reason: reason.trim(),
          replacements: {},
          handovers,
        };
      }),
  };
}
