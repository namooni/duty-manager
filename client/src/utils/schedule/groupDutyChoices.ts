import type {Duty} from '@/repositories/duties/duties.domain';
export type DutyFilterChoice = Readonly<{id: number; name: string; dutyIds: readonly number[]}>;
/** Names are filter categories, not identities: retain every underlying duty ID. */
export function groupDutyChoices(duties: readonly Duty[]): readonly DutyFilterChoice[] {
  const groups = new Map<string, {id: number; name: string; dutyIds: number[]}>();
  for (const duty of new Map(duties.map(d => [d.id, d])).values()) {
    const name = duty.name.trim(),
      key = name.normalize('NFC');
    const group = groups.get(key);
    if (group) group.dutyIds.push(duty.id);
    else groups.set(key, {id: duty.id, name, dutyIds: [duty.id]});
  }
  return [...groups.values()];
}
