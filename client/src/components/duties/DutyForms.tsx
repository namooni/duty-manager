import {EmployeeFields} from '@/components/employees/EmployeeFields';
import type {DutyManager as Manager} from '@/hooks/duties/useDutyManager';
import {AutomaticDutyWizard} from './AutomaticDutyWizard';
import * as U from '@/components/ui';
export function DutyForms({m}: {m: Manager}) {
  if (m.modal === 'duty')
    return (
      <AutomaticDutyWizard
        employees={m.employees}
        today={m.today}
        onClose={m.close}
        onSaved={m.finishAutomaticCreation}
      />
    );
  if (!m.modal) return null;
  const titles = {
    employee: 'メンバーを追加',
    replace: '担当者の変更・履歴',
  };
  return (
    <U.Modal key={m.modal} title={titles[m.modal]} busy={m.busy} onClose={m.close}>
      {m.error && <U.Alert role="alert">{m.error}</U.Alert>}
      {m.modal === 'employee' && (
        <U.Form
          onSubmit={e => {
            e.preventDefault();
            void m.saveEmployee();
          }}
        >
          <EmployeeFields form={m.employeeForm} onChange={m.updateEmployee} />
          <U.Muted>
            <U.Text>
              社員番号順は文字列順です。001、002のように桁数をそろえると並びが安定します。
            </U.Text>
          </U.Muted>
          <Footer m={m} label="メンバーを登録" />
        </U.Form>
      )}
      {m.modal === 'replace' && m.editing && (
        <U.Form
          onSubmit={e => {
            e.preventDefault();
            void m.saveReplacement();
          }}
        >
          <U.Flex flexDirection="column">
            <U.Text as="h3" variant="h3">
              {m.editing.dutyName}
            </U.Text>
            <U.Muted>
              {m.editing.periodStart}
              <U.Text> 〜 </U.Text>
              {m.editing.periodEnd}
              <U.Text> / 現在の担当：</U.Text>
              {m.editing.employeeName}
            </U.Muted>
          </U.Flex>
          <U.Field>
            <U.Text>変更後の担当者</U.Text>
            <U.Select
              required
              autoFocus
              value={m.replaceForm.employeeId}
              onChange={e => m.updateReplacement('employeeId', e.target.value)}
            >
              <option value="">選択してください</option>
              {m.replaceChoices.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </U.Select>
          </U.Field>
          <U.Field>
            <U.Text>変更理由</U.Text>
            <U.Textarea
              required
              maxLength={300}
              value={m.replaceForm.reason}
              onChange={e => m.updateReplacement('reason', e.target.value)}
              placeholder="例：出張のため、今回のみ代理"
            />
          </U.Field>
          <U.Muted>
            <U.Text>この担当枠のみ変更します。以降の順番は変更しません。</U.Text>
          </U.Muted>
          <Footer m={m} label="変更を保存" />
          <U.Flex flexDirection="column">
            <U.Text as="h3" variant="h3">
              変更履歴
            </U.Text>
            {m.historyLoading ? (
              <U.Muted role="status">
                <U.Text>読み込み中…</U.Text>
              </U.Muted>
            ) : m.changes.length ? (
              m.changes.map(c => (
                <U.ListItem key={c.id}>
                  <U.Text as="strong" style={{fontWeight: 700}}>
                    {c.previousName} → {c.newName}
                  </U.Text>
                  <U.Muted>{c.reason}</U.Muted>
                  <U.Text as="small" variant="t4">
                    {c.changedAt}
                  </U.Text>
                </U.ListItem>
              ))
            ) : (
              <U.Muted>
                <U.Text>変更履歴はありません。</U.Text>
              </U.Muted>
            )}
          </U.Flex>
        </U.Form>
      )}
    </U.Modal>
  );
}
function Footer({m, label}: {m: Manager; label: string}) {
  return (
    <U.Row style={{justifyContent: 'flex-end'}}>
      <U.Button type="button" disabled={m.busy} onClick={m.close}>
        <U.Text>キャンセル</U.Text>
      </U.Button>
      <U.Button variant="primary" type="submit" disabled={m.busy}>
        {m.busy ? '保存中…' : label}
      </U.Button>
    </U.Row>
  );
}
