import type {ScheduleDateChangeModel} from '@/hooks/duties/useScheduleDateChange';
import * as U from '@/components/ui';
const range = (start: string | null, end: string | null) =>
  start ? start + (end && end !== start ? ' 〜 ' + end : '') : '開催日未定';
export function ScheduleDateChangeDialog({m}: {m: ScheduleDateChangeModel}) {
  if (!m.target) return null;
  return (
    <U.Modal title="開催日の変更" busy={m.busy} onClose={m.close}>
      {m.error && <U.Alert role="alert">{m.error}</U.Alert>}
      {!m.context ? (
        <U.Empty role="status">変更できる日付を読み込み中…</U.Empty>
      ) : m.review ? (
        <U.Stack>
          <U.Text as="h3" variant="h3">
            変更前後の予定を確認
          </U.Text>
          <U.Text>{m.context.dutyName}</U.Text>
          <U.Muted>この回の開催日のみ変更します。担当者と以降の順番は維持します。</U.Muted>
          {m.review.result.warnings.map(text => (
            <U.Alert key={text}>{text}</U.Alert>
          ))}
          {m.review.result.rows.map(row => (
            <U.ListItem key={row.before.rotationKey}>
              <U.Text as="strong">
                {row.before.assignees.map(p => p.name + '（' + p.employeeNumber + '）').join('・')}
              </U.Text>
              <U.Text>変更前：{range(row.before.start, row.before.end)}</U.Text>
              <U.Text as="strong">変更後：{range(row.after.start, row.after.end)}</U.Text>
            </U.ListItem>
          ))}
          <U.Text>理由：{m.review.input.reason}</U.Text>
          <U.InlineActions>
            <U.Button disabled={m.busy} onClick={m.back}>
              入力に戻る
            </U.Button>
            {m.stale && (
              <U.Button disabled={m.busy} onClick={() => void m.preview()}>
                変更内容を再確認
              </U.Button>
            )}
            <U.Button
              variant="primary"
              disabled={m.busy || m.stale}
              onClick={() => void m.confirm()}
            >
              この内容で変更
            </U.Button>
          </U.InlineActions>
        </U.Stack>
      ) : (
        <U.Form
          onSubmit={e => {
            e.preventDefault();
            void m.preview();
          }}
        >
          <U.Text as="strong">{m.context.dutyName}</U.Text>
          {m.context.periods.map(period => (
            <U.ListItem key={period.rotationKey}>
              <U.Text>{range(period.start, period.end)}</U.Text>
              <U.Muted>{period.assignees.map(p => p.name).join('・')}</U.Muted>
            </U.ListItem>
          ))}
          <U.Field>
            <U.Text>変更後の開催日</U.Text>
            <U.Input
              autoFocus
              type="date"
              required
              min={m.context.minimum}
              max={m.context.maximum}
              value={m.date}
              onChange={e => m.setDate(e.target.value)}
            />
          </U.Field>
          <U.Muted>この回だけ変更します。前後の開催順と担当者は変わりません。</U.Muted>
          <U.Field>
            <U.Text>変更理由</U.Text>
            <U.Textarea
              required
              maxLength={300}
              value={m.reason}
              onChange={e => m.setReason(e.target.value)}
            />
          </U.Field>
          <U.InlineActions>
            <U.Button onClick={m.close} disabled={m.busy}>
              キャンセル
            </U.Button>
            <U.Button variant="primary" type="submit" disabled={m.busy}>
              変更内容を確認
            </U.Button>
          </U.InlineActions>
          {!!m.context.history.length && (
            <U.Stack>
              <U.Text as="h3" variant="h3">
                日付の変更履歴
              </U.Text>
              {m.context.history.map(h => (
                <U.ListItem key={h.id}>
                  <U.Text>
                    {range(h.previousStart, h.previousEnd) + ' → ' + range(h.newStart, h.newEnd)}
                  </U.Text>
                  <U.Muted>{h.reason}</U.Muted>
                </U.ListItem>
              ))}
            </U.Stack>
          )}
        </U.Form>
      )}
    </U.Modal>
  );
}
