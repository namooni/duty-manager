export type ScheduleFilters = Readonly<{
  dutyId: string;
  personId: string;
  personQuery: string;
  dutyIds?: readonly number[];
}>;
export type SearchableAssignee = Readonly<{
  employeeId: number;
  name: string;
  employeeNumber: string;
}>;
function normalize(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase('ja-JP');
}
export function personSearchTokens(query: string): readonly string[] {
  return normalize(query).trim().split(/\s+/).filter(Boolean);
}
export function matchesPerson(
  person: SearchableAssignee,
  filters: Pick<ScheduleFilters, 'personId' | 'personQuery'>,
) {
  if (filters.personId && String(person.employeeId) !== filters.personId) return false;
  const fields = [
    normalize(person.name).replace(/\s+/g, ''),
    normalize(person.employeeNumber).replace(/\s+/g, ''),
  ];
  return personSearchTokens(filters.personQuery).every(token =>
    fields.some(field => field.includes(token)),
  );
}
export function matchesSchedule(
  dutyId: number,
  people: readonly SearchableAssignee[],
  filters: ScheduleFilters,
) {
  if (
    filters.dutyId &&
    (filters.dutyIds?.length
      ? !filters.dutyIds.includes(dutyId)
      : String(dutyId) !== filters.dutyId)
  )
    return false;
  if (!filters.personId && !personSearchTokens(filters.personQuery).length) return true;
  return people.some(person => matchesPerson(person, filters));
}
