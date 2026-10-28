import type {EmployeeStatusChange} from '@/hooks/employees/useEmployeeStatusChange';
import {AssignmentReviewPanel} from '@/components/duties/AssignmentReviewPanel';
import * as U from '@/components/ui';
export function EmployeeStatusDialog({m}: {m: EmployeeStatusChange}) {
  if (!m.target) return null;
  return (
    <U.Modal
      title={m.target.active ? 'メンバーを無効にする' : 'メンバーを有効にする'}
      busy={m.review.busy}
      onClose={m.close}
    >
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
          <U.Text as="strong">{m.target.name + '（' + m.target.employeeNumber + '）'}</U.Text>
          <U.Muted>
            {m.target.active
              ? '今後の担当から外し、後の担当者を前に詰めます。空の担当期間は残しません。'
              : '元の順序を使って今後の担当に戻します。末尾への追加や、新しい参加者としての登録は行いません。'}
          </U.Muted>
          <U.Muted>
            関連する当番の変更内容を確認してから、状態と担当予定を一緒に適用します。
          </U.Muted>
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
            <U.Button disabled={m.review.busy} onClick={m.close}>
              キャンセル
            </U.Button>
            <U.Button
              type="submit"
              variant={m.target.active ? 'warning' : 'primary'}
              disabled={m.review.busy}
            >
              {m.review.busy ? '計算中…' : '担当への影響を確認'}
            </U.Button>
          </U.InlineActions>
        </U.Form>
      )}
    </U.Modal>
  );
}
