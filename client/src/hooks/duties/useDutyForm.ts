import {useState} from 'react';
import type {DutyInput} from '@/repositories/duties/duties.domain';
import type {Employee} from '@/repositories/employees/employees.domain';
export function useDutyForm(
  employees: readonly Employee[],
  today: string,
  initial?: DutyInput,
  rejoinBefore: Readonly<Record<number, number>> = {},
) {
  const active = employees.filter(
    employee => employee.active || !!initial?.memberIds.includes(employee.id),
  );
  const empty = (): DutyInput => ({
    name: '',
    description: '',
    anchorDate: today,
    intervalCount: 1,
    intervalUnit: 'WEEK',
    strategy: 'EMPLOYEE_NUMBER',
    assigneeCount: 1,
    memberIds: [],
  });
  const [values, setValues] = useState<DutyInput>(() => initial ?? empty());
  // null means all current active employees, including employees loaded asynchronously.
  const [selection, setSelection] = useState<readonly number[] | null>(initial?.memberIds ?? null);
  const memberIds =
    selection === null
      ? active.map(e => e.id)
      : selection.filter(id => active.some(e => e.id === id));
  const form = {...values, memberIds};
  function update<K extends keyof DutyInput>(key: K, value: DutyInput[K]) {
    if (!initial && key === 'strategy' && value !== values.strategy) {
      setSelection(value === 'CUSTOM' ? [] : null);
    }
    setValues(previous => ({...previous, [key]: value}));
  }
  function toggleMember(id: number) {
    setSelection(previous => {
      const current = (previous ?? active.map(person => person.id)).filter(member =>
        active.some(person => person.id === member),
      );
      if (current.includes(id)) return current.filter(member => member !== id);
      const at = current.indexOf(rejoinBefore[id]);
      return at < 0 ? [...current, id] : [...current.slice(0, at), id, ...current.slice(at)];
    });
  }
  function input(): DutyInput {
    if (!form.name.trim()) throw new Error('当番の名前を入力してください。');
    if (!form.anchorDate) throw new Error('最初の担当期間の開始日を選択してください。');
    if (form.memberIds.length < form.assigneeCount)
      throw new Error('担当人数以上の参加メンバーを選択してください。');
    if (form.memberIds.length > 200) throw new Error('参加メンバーは200人以内で選択してください。');
    if (!Number.isInteger(form.intervalCount) || form.intervalCount < 1 || form.intervalCount > 365)
      throw new Error('担当者の交代周期は1〜365の整数で入力してください。');
    if (!Number.isInteger(form.assigneeCount) || form.assigneeCount < 1 || form.assigneeCount > 20)
      throw new Error('担当人数は1〜20人で入力してください。');
    return {...form, name: form.name.trim(), description: form.description.trim()};
  }
  return {
    form,
    update,
    toggleMember,
    input,
    selectAll: () => setSelection(null),
    clearMembers: () => setSelection([]),
    reset: () => {
      setValues(empty());
      setSelection(null);
    },
    choices: active.map(employee => ({
      ...employee,
      selected: memberIds.includes(employee.id),
      order: memberIds.indexOf(employee.id) + 1,
    })),
  };
}
