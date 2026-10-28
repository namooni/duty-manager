import type {AutomaticSchedule} from '@/hooks/duties/useAutomaticSchedule';
import * as U from '@/components/ui';
export function SchedulePersonFilters({work}: {work: AutomaticSchedule}) {
  return (
    <U.Row style={{alignItems: 'end', gap: 12}}>
      <U.Field style={{flex: '1 1 220px', maxWidth: 360}}>
        <U.Text>氏名・社員番号で検索</U.Text>
        <U.Input
          type="search"
          placeholder="例：田中、001"
          value={work.personQuery}
          onChange={event => work.setPersonQuery(event.target.value)}
        />
      </U.Field>
      <U.Field style={{flex: '1 1 220px', maxWidth: 360}}>
        <U.Text>担当者で絞り込む</U.Text>
        <U.Select value={work.personId} onChange={event => work.setPersonId(event.target.value)}>
          <option value="">すべての担当者</option>
          {work.personChoices.map(person => (
            <option key={person.id} value={person.id}>
              {person.label}
            </option>
          ))}
        </U.Select>
      </U.Field>
      {work.hasFilters && (
        <U.Button variant="text" onClick={work.resetFilters}>
          絞り込みを解除
        </U.Button>
      )}
      {work.personLabel && <U.Badge $muted>{work.personLabel}</U.Badge>}
    </U.Row>
  );
}
