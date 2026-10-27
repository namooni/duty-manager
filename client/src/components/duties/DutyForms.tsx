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
    exclusion: '対象外の期間を追加',
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
          <U.Field>
            <U.Text>社員番号</U.Text>
            <U.Input
              required
              maxLength={40}
              autoFocus
              value={m.employeeForm.employeeNumber}
              onChange={e => m.updateEmployee('employeeNumber', e.target.value)}
              placeholder="例：001"
            />
          </U.Field>
          <U.Field>
            <U.Text>名前</U.Text>
            <U.Input
              required
              maxLength={80}
              value={m.employeeForm.name}
              onChange={e => m.updateEmployee('name', e.target.value)}
              placeholder="例：田中 太郎"
            />
          </U.Field>
          <U.Muted>
            <U.Text>
              社員番号順は文字列順です。001、002のように桁数をそろえると並びが安定します。
            </U.Text>
          </U.Muted>
          <Footer m={m} label="メンバーを登録" />
        </U.Form>
      )}
      {m.modal === 'exclusion' && (
        <U.Form
          onSubmit={e => {
            e.preventDefault();
            void m.saveExclusion();
          }}
        >
          <U.Muted>
            {m.selectedDuty?.name}
            <U.Text> の対象外期間を設定します。</U.Text>
          </U.Muted>
          <U.Field>
            <U.Text>メンバー</U.Text>
            <U.Select
              required
              autoFocus
              value={m.exclusionForm.employeeId}
              onChange={e => m.updateExclusion('employeeId', e.target.value)}
            >
              <option value="">選択してください</option>
              {m.memberChoices.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </U.Select>
          </U.Field>
          <U.Row>
            <U.Field>
              <U.Text>開始日</U.Text>
              <U.Input
                required
                type="date"
                value={m.exclusionForm.startDate}
                onChange={e => m.updateExclusion('startDate', e.target.value)}
              />
            </U.Field>
            <U.Field>
              <U.Text>終了日</U.Text>
              <U.Input
                required
                type="date"
                value={m.exclusionForm.endDate}
                onChange={e => m.updateExclusion('endDate', e.target.value)}
              />
            </U.Field>
          </U.Row>
          <U.Field>
            <U.Text>理由</U.Text>
            <U.Textarea
              required
              maxLength={300}
              value={m.exclusionForm.reason}
              onChange={e => m.updateExclusion('reason', e.target.value)}
              placeholder="例：休暇のため"
            />
          </U.Field>
          <U.Muted>
            <U.Text>
              担当期間に1日でも重なると、その期間は割当対象外になります。確定済みの担当期間と重なる場合は、先に担当者を変更してください。
            </U.Text>
          </U.Muted>
          <Footer m={m} label="対象外の期間を追加" />
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
