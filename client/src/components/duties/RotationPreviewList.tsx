import type {RotationPreview, RotationMode} from '@/repositories/automatic/automatic.domain';
import * as U from '@/components/ui';
export function RotationPreviewList({
  preview,
  mode,
}: {
  preview: RotationPreview;
  mode: RotationMode;
}) {
  return (
    <U.Flex flexDirection="column" style={{maxHeight: 380, overflowY: 'auto'}}>
      {preview.turns.map(turn => (
        <U.ListItem key={turn.key}>
          <U.Text as="strong">
            {mode === 'CALENDAR'
              ? '担当期間：' + turn.start + ' 〜 ' + turn.end
              : '第' + (turn.sequence + 1) + '回 · ' + (turn.start ?? '開催日未定')}
          </U.Text>
          <U.Row>
            {turn.assignees.map(person => (
              <U.Badge key={person.id}>
                {person.name}（{person.employeeNumber}）
              </U.Badge>
            ))}
          </U.Row>
          {turn.warning && <U.Text role="alert">{turn.warning}</U.Text>}
        </U.ListItem>
      ))}
    </U.Flex>
  );
}
