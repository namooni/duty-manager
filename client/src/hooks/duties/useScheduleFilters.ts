import {groupDutyChoices} from '@/utils/schedule/groupDutyChoices';
import type {Duty} from '@/repositories/duties/duties.domain';
import type {Employee} from '@/repositories/employees/employees.domain';
import type {Assignment} from '@/repositories/assignments/assignments.domain';
import type {WorkOccurrence} from '@/repositories/automatic/automatic.domain';
import {useScheduleFilterStore} from '@/stores/duties/scheduleFilter.store';
import {
  matchesPerson,
  matchesSchedule,
  personSearchTokens,
  type SearchableAssignee,
} from '@/utils/schedule/scheduleFilters';
export function useScheduleFilters(employees: readonly Employee[], duties: readonly Duty[] = []) {
  const {dutyId, exactDuty, personId, personQuery, setDutyId, setPersonId, setPersonQuery, reset} =
    useScheduleFilterStore();
  const dutyChoices = groupDutyChoices(duties);
  const selectedDuty = dutyChoices.find(choice => choice.dutyIds.some(id => String(id) === dutyId));
  const filters = {
    dutyId,
    personId,
    personQuery,
    dutyIds: exactDuty ? undefined : selectedDuty?.dutyIds,
  };
  const hasPersonFilter = !!personId || !!personSearchTokens(personQuery).length;
  const selected = employees.find(person => String(person.id) === personId);
  const choices = employees
    .filter(person =>
      matchesPerson(
        {employeeId: person.id, name: person.name, employeeNumber: person.employeeNumber},
        {personId: '', personQuery},
      ),
    )
    .map(person => ({
      id: String(person.id),
      label: person.name + '（' + person.employeeNumber + '）' + (person.active ? '' : ' · 無効'),
    }));
  if (personId && !choices.some(choice => choice.id === personId))
    choices.unshift({id: personId, label: '担当者（ID: ' + personId + '）'});
  return {
    dutyId,
    dutyChoices: exactDuty
      ? [
          {
            id: 'exact:' + dutyId,
            name: (duties.find(d => String(d.id) === dutyId)?.name ?? '当番') + '（個別表示）',
          },
          ...dutyChoices,
        ]
      : dutyChoices,
    selectedDutyValue: exactDuty
      ? 'exact:' + dutyId
      : selectedDuty
        ? String(selectedDuty.id)
        : dutyId,
    personId,
    personQuery,
    hasPersonFilter,
    hasFilters: !!dutyId || hasPersonFilter,
    choices,
    personLabel: personId
      ? selected
        ? selected.name + '（' + selected.employeeNumber + '）'
        : 'ID: ' + personId
      : personQuery.trim()
        ? '検索：' + personQuery.trim()
        : '',
    setDutyId: (id: string) => {
      if (id.startsWith('exact:')) useScheduleFilterStore.getState().focusDuty(Number(id.slice(6)));
      else setDutyId(id);
    },
    setPersonId,
    setPersonQuery,
    reset,
    matchesOccurrence: (event: WorkOccurrence) =>
      matchesSchedule(event.dutyId, event.assignees, filters),
    matchesAssignee: (person: SearchableAssignee) =>
      hasPersonFilter && matchesPerson(person, filters),
    filterLegacy: (assignments: readonly Assignment[]) =>
      assignments.filter(a => {
        const employee = employees.find(person => person.id === a.employeeId);
        return matchesSchedule(
          a.dutyId,
          [
            {
              employeeId: a.employeeId,
              name: a.employeeName,
              employeeNumber: employee?.employeeNumber ?? '',
            },
          ],
          filters,
        );
      }),
  };
}
