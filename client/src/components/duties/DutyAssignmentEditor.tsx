import {CurrentHandling} from '@/repositories/assignmentChanges/assignmentChanges.domain';
import type {AssignmentContext} from '@/repositories/assignmentChanges/assignmentChanges.domain';
import type {Strategy} from '@/repositories/duties/duties.domain';
import {useAssignmentContext} from '@/hooks/duties/useAssignmentContext';
import {useAssignmentEditor} from '@/hooks/duties/useAssignmentEditor';
import {useDutyUiStore} from '@/stores/duties/dutyUi.store';
import {DutyParticipants} from './DutyParticipants';
import {AssignmentReviewPanel} from './AssignmentReviewPanel';
import * as U from '@/components/ui';
function Editor({
  context,
  onSaved,
  onClose,
}: {
  context: AssignmentContext;
  onSaved: () => void;
  onClose: () => void;
}) {
  const m = useAssignmentEditor(context, onSaved);
  return (
    <U.Modal title="担当ルール・参加メンバーを編集" busy={m.review.busy} onClose={onClose}>
      {m.review.error && <U.Alert role="alert">{m.review.error}</U.Alert>}
      {m.review.review ? (
        <AssignmentReviewPanel m={m.review} />
      ) : (
        <U.Form
          onSubmit={event => {
            event.preventDefault();
            void m.preview();
          }}
        >
          <U.Text as="h3" variant="h3">
            {context.duty.name}
          </U.Text>
          <U.Muted>
            実施日と交代期間はそのままに、今後の参加者・順番・人数を変更します。適用前に保存済み予定を含む全変更を確認します。
          </U.Muted>
          <U.Field>
            <U.Text>変更を始める担当</U.Text>
            <U.Select
              disabled={m.handoverActive}
              value={m.effectiveIndex}
              onChange={event => m.setEffectiveIndex(Number(event.target.value))}
            >
              {context.boundaries.map(turn => (
                <option key={turn.index} value={turn.index}>
                  {'第' +
                    (turn.index + 1) +
                    '担当 · ' +
                    (turn.start
                      ? turn.start + (turn.end !== turn.start ? ' 〜 ' + turn.end : '')
                      : '開催日未定')}
                </option>
              ))}
            </U.Select>
          </U.Field>
          <U.Row>
            <U.Field>
              <U.Text>担当する順番</U.Text>
              <U.Select
                value={m.duty.form.strategy}
                onChange={event => m.duty.update('strategy', event.target.value as Strategy)}
              >
                <option value="EMPLOYEE_NUMBER">社員番号順</option>
                <option value="CUSTOM">指定順（選んだ順）</option>
                <option value="SHUFFLED_ROUND">ランダム（全員一巡）</option>
              </U.Select>
            </U.Field>
            <U.Field>
              <U.Text>一度に担当する人数</U.Text>
              <U.Input
                required
                type="number"
                min={1}
                max={20}
                value={m.duty.form.assigneeCount}
                onChange={event => m.duty.update('assigneeCount', Number(event.target.value))}
              />
            </U.Field>
          </U.Row>
          <DutyParticipants form={m.duty} />
          {m.restorationRows.map(row => (
            <U.Alert role="status" key={row.slotId}>
              {row.original.name}さんを本日から元の担当に戻します。{row.employee.name}
              さんは次の自動担当に戻ります。変更後の順番は検討画面で確認できます。
            </U.Alert>
          ))}
          {!!m.removedCurrent.length && (
            <U.Panel style={{padding: 16}}>
              <U.Stack>
                <U.Text as="h3" variant="h3">
                  現在の担当をどうしますか？
                </U.Text>
                <U.Text>
                  {m.removedCurrent.map(p => p.employee.name).join('・')}
                  さんは現在の担当です。参加メンバーからは除外します。
                </U.Text>
                <U.Field>
                  <U.Text>残りの担当期間</U.Text>
                  <U.Select
                    value={m.currentHandling}
                    onChange={e => m.setCurrentHandling(e.target.value as CurrentHandling)}
                  >
                    <option value={CurrentHandling.CONTINUE}>今回の担当が終わるまで継続する</option>
                    <option value={CurrentHandling.HANDOVER} disabled={!m.handoverAvailable}>
                      残りの期間を別のメンバーに引き継ぐ
                    </option>
                  </U.Select>
                </U.Field>
                {m.handoverActive ? (
                  <>
                    <U.Muted>
                      {m.handoverDate}
                      から引き継ぎます（本日から適用）。昨日までの担当は変更しません。引き継ぐ人は次の自動担当順に反映します。
                    </U.Muted>
                    {m.handoverRows.map(row => (
                      <U.Field key={row.slotId}>
                        <U.Text>{row.employee.name}さんの引継ぎ先</U.Text>
                        <U.Select
                          value={row.selected}
                          onChange={e => m.setHandover(row.slotId, Number(e.target.value))}
                        >
                          <option value="" disabled>
                            選択してください
                          </option>
                          {m.handoverChoices.map(person => (
                            <option key={person.id} value={person.id}>
                              {person.name + '（' + person.employeeNumber + '）'}
                            </option>
                          ))}
                        </U.Select>
                      </U.Field>
                    ))}
                  </>
                ) : (
                  <U.Muted>
                    現在の担当だけを期間終了まで継続し、以降は変更後の参加メンバーで担当します。
                  </U.Muted>
                )}
              </U.Stack>
            </U.Panel>
          )}
          {!m.handoverActive && (
            <U.Field>
              <U.Text>最初の担当候補</U.Text>
              <U.Select value={m.first} onChange={event => m.setFirst(event.target.value)}>
                <option value="">現在の次の担当から引き継ぐ</option>
                {m.firstChoices.map(person => (
                  <option key={person.id} value={person.id}>
                    {person.name + '（' + person.employeeNumber + '）'}
                  </option>
                ))}
              </U.Select>
            </U.Field>
          )}
          <U.Field>
            <U.Text>変更理由</U.Text>
            <U.Textarea
              required
              maxLength={300}
              value={m.reason}
              onChange={event => m.setReason(event.target.value)}
            />
          </U.Field>
          <U.InlineActions style={{justifyContent: 'flex-end'}}>
            <U.Button disabled={m.review.busy} onClick={onClose}>
              キャンセル
            </U.Button>
            <U.Button type="submit" variant="primary" disabled={m.review.busy}>
              {m.review.busy ? '計算中…' : '変更内容を確認'}
            </U.Button>
          </U.InlineActions>
          {!!context.history.length && (
            <U.Flex flexDirection="column" gap={8}>
              <U.Text as="h3" variant="h3">
                ルールの変更履歴
              </U.Text>
              {context.history.map(item => (
                <U.Muted key={item.id}>
                  {'#' +
                    item.id +
                    ' · 第' +
                    (item.startIndex + 1) +
                    '担当から · ' +
                    item.reason +
                    (item.superseded ? '（変更済み）' : '')}
                </U.Muted>
              ))}
            </U.Flex>
          )}
        </U.Form>
      )}
    </U.Modal>
  );
}
export function DutyAssignmentEditor({
  id,
  onSaved,
  onClose,
}: {
  id: number;
  onSaved: () => void;
  onClose: () => void;
}) {
  const query = useAssignmentContext(id);
  const busy = useDutyUiStore(state => state.busy);
  if (query.data) return <Editor context={query.data} onSaved={onSaved} onClose={onClose} />;
  return (
    <U.Modal title="担当ルールを読み込み" busy={busy} onClose={onClose}>
      {query.error ? (
        <U.Alert role="alert">{query.error}</U.Alert>
      ) : (
        <U.Empty role="status">読み込み中…</U.Empty>
      )}
    </U.Modal>
  );
}
