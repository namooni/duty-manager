import type {AssignmentReviewModel} from '@/hooks/duties/useAssignmentReview';
import * as U from '@/components/ui';
export function AssignmentReviewPanel({m}: {m: AssignmentReviewModel}) {
  if (!m.review) return null;
  return (
    <U.Stack>
      <U.Text as="h3" variant="h3">
        変更前後の担当を確認
      </U.Text>
      {m.review.result.summaries.map(text => (
        <U.Text key={text}>{text}</U.Text>
      ))}
      <U.Muted>
        過去の担当と開催日は維持します。現在の担当の引継ぎは本日から適用します。残りの期間と次の担当も確認してください。
      </U.Muted>
      <U.Text>
        {'確認対象 ' +
          m.rows.length +
          '枠 · 変更 ' +
          m.changedCount +
          '枠 · 要確認 ' +
          m.conflictCount +
          '枠'}
      </U.Text>
      {m.review.result.warnings.map(text => (
        <U.Alert role="alert" key={text}>
          {text}
        </U.Alert>
      ))}
      {!!m.rows.length && (
        <U.TableWrap style={{maxHeight: 440}}>
          <U.Table aria-label="担当変更の比較">
            <thead>
              <tr>
                <th>当番・対象</th>
                <th>変更前</th>
                <th>変更後</th>
              </tr>
            </thead>
            <tbody>
              {m.rows.map(row => (
                <tr key={row.key}>
                  <td>
                    <U.Flex flexDirection="column" gap={6}>
                      <U.Text as="strong">{row.dutyName}</U.Text>
                      <U.Text>
                        {row.start
                          ? row.start + (row.end && row.end !== row.start ? ' 〜 ' + row.end : '')
                          : '開催日未定'}
                      </U.Text>
                      <U.Muted>
                        {'第' + (row.sequence + 1) + '担当 · 枠' + (row.slotIndex + 1)}
                      </U.Muted>
                      {row.protectedAssignment && <U.Badge>手動指定を保護</U.Badge>}
                    </U.Flex>
                  </td>
                  <td>
                    <U.Text>
                      {row.before
                        ? row.before.name + '（' + row.before.employeeNumber + '）'
                        : '未保存'}
                    </U.Text>
                  </td>
                  <td>
                    <U.Flex
                      flexDirection="column"
                      gap={8}
                      style={{minWidth: 200, whiteSpace: 'normal'}}
                    >
                      <U.Text as={row.changed ? 'strong' : 'span'}>
                        {row.after
                          ? row.after.name + '（' + row.after.employeeNumber + '）'
                          : '担当枠を削除'}
                      </U.Text>
                      {row.message && (
                        <U.Muted role={row.conflict ? 'alert' : undefined}>{row.message}</U.Muted>
                      )}
                      {(row.protectedAssignment || row.conflict) && !!row.choices.length && (
                        <U.Field>
                          <U.Text>この担当枠の担当者</U.Text>
                          <U.Select
                            aria-label={
                              row.dutyName +
                              ' 第' +
                              (row.sequence + 1) +
                              '担当 枠' +
                              (row.slotIndex + 1) +
                              'の担当者'
                            }
                            disabled={m.busy}
                            value={
                              m.review?.input.replacements[row.key] ??
                              (row.conflict ? '' : (row.after?.id ?? ''))
                            }
                            onChange={event => void m.resolve(row.key, Number(event.target.value))}
                          >
                            <option value="" disabled>
                              選択してください
                            </option>
                            {row.choices.map(person => (
                              <option key={person.id} value={person.id}>
                                {person.name + '（' + person.employeeNumber + '）'}
                              </option>
                            ))}
                          </U.Select>
                        </U.Field>
                      )}
                    </U.Flex>
                  </td>
                </tr>
              ))}
            </tbody>
          </U.Table>
        </U.TableWrap>
      )}
      {!m.rows.length && !m.review.result.warnings.length && (
        <U.Muted>変更する担当予定はありません。メンバーの状態のみ更新します。</U.Muted>
      )}
      <U.InlineActions style={{justifyContent: 'flex-end'}}>
        <U.Button disabled={m.busy} onClick={m.back}>
          入力に戻る
        </U.Button>
        {m.stale && (
          <U.Button disabled={m.busy} onClick={() => void m.retry()}>
            変更内容を再確認
          </U.Button>
        )}
        <U.Button
          variant="primary"
          disabled={m.busy || m.stale || !m.review.result.canApply}
          onClick={() => void m.confirm()}
        >
          {m.busy ? '適用中…' : 'この内容で適用'}
        </U.Button>
      </U.InlineActions>
    </U.Stack>
  );
}
