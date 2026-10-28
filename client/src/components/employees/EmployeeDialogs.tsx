import type {EmployeeManagement} from '@/hooks/employees/useEmployeeManagement';
import {EmployeeFields} from './EmployeeFields';
import * as U from '@/components/ui';
export function EmployeeDialogs({m}: {m: EmployeeManagement}) {
  if (!m.dialog) return null;
  return (
    <U.Modal
      title={m.dialog.kind === 'edit' ? 'メンバー情報を編集' : 'メンバーを削除'}
      busy={m.busy}
      onClose={m.close}
    >
      {m.error && <U.Alert role="alert">{m.error}</U.Alert>}
      {m.dialog.kind === 'edit' ? (
        <U.Form
          onSubmit={event => {
            event.preventDefault();
            void m.save();
          }}
        >
          <EmployeeFields form={m.form} onChange={m.update} />
          <U.Muted>
            担当者の割当と有効・無効の状態は変わりません。表示名・社員番号は過去の予定や履歴にも反映されます。社員番号順は、まだ保存されていない担当の計算に反映されます。
          </U.Muted>
          <U.Row style={{justifyContent: 'flex-end'}}>
            <U.Button disabled={m.busy} onClick={m.close}>
              キャンセル
            </U.Button>
            <U.Button type="submit" variant="primary" disabled={m.busy}>
              {m.busy ? '保存中…' : '保存する'}
            </U.Button>
          </U.Row>
        </U.Form>
      ) : (
        <U.Stack>
          <U.Text as="strong">
            {'「' +
              m.dialog.employee.name +
              '（' +
              m.dialog.employee.employeeNumber +
              '）」を削除しますか？'}
          </U.Text>
          {m.checking ? (
            <U.Muted role="status">予定・変更履歴との関連を確認中…</U.Muted>
          ) : m.statusLoaded ? (
            m.canDelete ? (
              <U.Text>このメンバーを完全に削除します。この操作は取り消せません。</U.Text>
            ) : (
              <U.Alert role="status">
                当番への参加、担当予定、対象外期間、または変更履歴があるため削除できません。退職などの場合は、一覧の「無効にする」を使用してください。
              </U.Alert>
            )
          ) : (
            <U.Button disabled={m.busy} onClick={m.retryStatus}>
              削除可否を再確認
            </U.Button>
          )}
          <U.Row style={{justifyContent: 'flex-end'}}>
            <U.Button disabled={m.busy} onClick={m.close}>
              キャンセル
            </U.Button>
            <U.Button
              variant="danger"
              disabled={m.busy || m.checking || !m.canDelete}
              onClick={m.remove}
            >
              {m.busy ? '削除中…' : '削除する'}
            </U.Button>
          </U.Row>
        </U.Stack>
      )}
    </U.Modal>
  );
}
