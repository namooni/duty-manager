import type {AutomaticDutyCreation} from '@/hooks/duties/useAutomaticDutyCreation';
import * as U from '@/components/ui';
import * as S from './DutyForms.styles';
export function DutyParticipants({form}: {form: AutomaticDutyCreation['duty']}) {
  return (
    <U.Stack>
      <U.Between>
        <U.Text as="h3" variant="h3">
          参加メンバー · {form.form.memberIds.length}人
        </U.Text>
        <U.Row>
          <U.Button onClick={form.selectAll}>全員を選択</U.Button>
          <U.Button onClick={form.clearMembers}>選択を解除</U.Button>
        </U.Row>
      </U.Between>
      <U.Muted>
        {form.form.strategy === 'CUSTOM'
          ? 'チェックした順に担当します。'
          : '初期選択は全員です。参加しない人だけ外してください。'}
      </U.Muted>
      <S.ChoiceGrid style={{maxHeight: 260, overflowY: 'auto'}}>
        {form.choices.map(person => (
          <S.Choice key={person.id} $selected={person.selected}>
            <U.Checkbox checked={person.selected} onChange={() => form.toggleMember(person.id)} />
            <U.Text>{person.name + (person.active ? '' : '（無効・順序を保持）')}</U.Text>
            <U.Text as="small">
              {form.form.strategy === 'CUSTOM' && person.selected ? person.order + '番 · ' : ''}
              {person.employeeNumber}
            </U.Text>
          </S.Choice>
        ))}
      </S.ChoiceGrid>
      {!form.choices.length && <U.Muted>先にメンバーを登録してください。</U.Muted>}
    </U.Stack>
  );
}
