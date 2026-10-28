import {AssignmentReviewPanel} from './AssignmentReviewPanel';
import {ScheduleDateChangeDialog} from './ScheduleDateChangeDialog';
import type {AutomaticSchedule} from '@/hooks/duties/useAutomaticSchedule';
import * as U from '@/components/ui';
function ExistingScheduleDialogs({m, today}: {m: AutomaticSchedule; today: string}) {
  if (!m.dialog) return null;
  const title =
    m.dialog.kind === 'meeting'
      ? '開催日の登録・変更'
      : m.dialog.kind === 'replace'
        ? '担当者の変更・履歴'
        : '会社休業日';
  return (
    <U.Modal title={title} busy={m.busy} onClose={m.close}>
      {m.error && <U.Alert role="alert">{m.error}</U.Alert>}
      {m.notice && (
        <U.Alert $success role="status">
          {m.notice}
        </U.Alert>
      )}
      {m.dialog.kind === 'holidays' ? (
        <U.Stack>
          <U.Muted>この日は実施なしになります。担当の交代日は変わりません。</U.Muted>
          <U.Form
            onSubmit={event => {
              event.preventDefault();
              void m.saveHoliday();
            }}
          >
            <U.Field>
              <U.Text>休業日</U.Text>
              <U.Input
                type="date"
                required
                min={today}
                value={m.date}
                onChange={e => m.setDate(e.target.value)}
              />
            </U.Field>
            <U.Field>
              <U.Text>名称</U.Text>
              <U.Input
                required
                maxLength={100}
                value={m.holidayName}
                onChange={e => m.setHolidayName(e.target.value)}
                placeholder="例：年末休業"
              />
            </U.Field>
            <U.Button variant="primary" type="submit" disabled={m.busy}>
              休業日を保存
            </U.Button>
          </U.Form>
          {m.holidays.map(day => (
            <U.Between key={day.date}>
              <U.Text>
                {day.date} · {day.name}
              </U.Text>
              <U.Button
                variant="warning"
                disabled={m.busy || day.date < today}
                onClick={() => m.removeHoliday(day.date)}
              >
                解除
              </U.Button>
            </U.Between>
          ))}
        </U.Stack>
      ) : m.dialog.kind === 'meeting' ? (
        <U.Form
          onSubmit={event => {
            event.preventDefault();
            void m.saveMeeting();
          }}
        >
          <U.Text>
            {m.dialog.event.dutyName + ' · 第' + (m.dialog.event.sequence + 1) + '回'}
          </U.Text>
          <U.Muted>
            {'担当：' +
              (m.dialog.event.assignees
                .map(person => person.name + '（' + person.employeeNumber + '）')
                .join('・') || '担当者未定')}
          </U.Muted>
          {m.dialog.month && (
            <U.Muted>{m.dialog.month.replace('-', '年') + '月の開催日を登録します。'}</U.Muted>
          )}
          <U.Field>
            <U.Text>開催日</U.Text>
            <U.Input
              autoFocus
              type="date"
              required
              min={m.meetingRange?.min ?? today}
              max={m.meetingRange?.max}
              value={m.date}
              onChange={e => m.setDate(e.target.value)}
            />
          </U.Field>
          <U.Muted>この回の担当者は変わりません。前後の開催回の順序を保って変更できます。</U.Muted>
          <U.Row>
            <U.Button disabled={m.busy} onClick={m.close}>
              キャンセル
            </U.Button>
            <U.Button
              type="submit"
              variant="primary"
              disabled={m.busy || !m.meetingRange?.available}
            >
              開催日を保存
            </U.Button>
          </U.Row>
        </U.Form>
      ) : (
        <U.Stack>
          <U.Text>
            {m.dialog.event.dutyName} · 現在の担当：{m.dialog.person.name}
          </U.Text>
          <U.Muted>
            {m.dialog.event.rotationMode === 'CALENDAR'
              ? '担当期間：' + m.dialog.event.periodStart + ' 〜 ' + m.dialog.event.periodEnd
              : m.dialog.event.date
                ? '実施日：' + m.dialog.event.date
                : '第' + (m.dialog.event.sequence + 1) + '回（開催日未定）'}
          </U.Muted>
          {m.handover.review ? (
            <AssignmentReviewPanel m={m.handover} />
          ) : (
            m.canReplace(m.dialog.event) && (
              <U.Form
                onSubmit={event => {
                  event.preventDefault();
                  void m.saveReplacement();
                }}
              >
                <U.Field>
                  <U.Text>変更後の担当者</U.Text>
                  <U.Select
                    autoFocus
                    required
                    value={m.employeeId}
                    onChange={e => m.setEmployeeId(e.target.value)}
                  >
                    <option value="">選択してください</option>
                    {m.replaceChoices.map(person => (
                      <option key={person.id} value={person.id}>
                        {person.name}（{person.employeeNumber}）
                      </option>
                    ))}
                  </U.Select>
                </U.Field>
                <U.Field>
                  <U.Text>理由</U.Text>
                  <U.Textarea
                    required
                    maxLength={300}
                    placeholder="例：休暇のため、今回の担当を変更"
                    value={m.reason}
                    onChange={e => m.setReason(e.target.value)}
                  />
                </U.Field>
                <U.Muted>
                  {m.isCurrentReplacement
                    ? '本日から引き継ぎ、次回は後続のメンバーから割り当てます。変更後の順番は次の画面で確認できます。'
                    : m.dialog.event.rotationMode === 'CALENDAR'
                      ? '同じ担当期間内の実施日に適用します。以降の順番は変わりません。'
                      : 'この回だけ変更します。以降の順番は変わりません。'}
                </U.Muted>
                <U.Row>
                  <U.Button disabled={m.busy} onClick={m.close}>
                    閉じる
                  </U.Button>
                  <U.Button
                    type="submit"
                    variant="primary"
                    disabled={m.busy || !m.canReplace(m.dialog.event)}
                  >
                    {m.isCurrentReplacement ? '変更内容を確認' : '担当者を変更'}
                  </U.Button>
                </U.Row>
              </U.Form>
            )
          )}
          <U.Text as="h3" variant="h3">
            変更履歴
          </U.Text>
          {m.historyLoading ? (
            <U.Text role="status">読み込み中…</U.Text>
          ) : m.changes.length ? (
            m.changes.map(change => (
              <U.ListItem key={change.id}>
                <U.Text>
                  {change.previousName} → {change.newName}
                </U.Text>
                <U.Muted>
                  {change.reason} · {change.changedAt}
                </U.Muted>
              </U.ListItem>
            ))
          ) : (
            <U.Muted>変更履歴はありません。</U.Muted>
          )}
          {!!m.dateHistory?.length && (
            <U.Stack>
              <U.Text as="h3" variant="h3">
                日付の変更履歴
              </U.Text>
              {m.dateHistory.map(change => (
                <U.ListItem key={change.id}>
                  <U.Text>
                    {(change.previousStart ?? '開催日未定') +
                      (change.previousEnd && change.previousEnd !== change.previousStart
                        ? ' 〜 ' + change.previousEnd
                        : '') +
                      ' → ' +
                      change.newStart +
                      (change.newEnd !== change.newStart ? ' 〜 ' + change.newEnd : '')}
                  </U.Text>
                  <U.Muted>{change.reason + ' · ' + change.createdAt}</U.Muted>
                </U.ListItem>
              ))}
            </U.Stack>
          )}
          {!m.canReplace(m.dialog.event) && (
            <U.Button onClick={m.close} disabled={m.busy}>
              閉じる
            </U.Button>
          )}
        </U.Stack>
      )}
    </U.Modal>
  );
}

export function AutomaticScheduleDialogs({m, today}: {m: AutomaticSchedule; today: string}) {
  return (
    <>
      {m.dateChange && <ScheduleDateChangeDialog m={m.dateChange} />}
      <ExistingScheduleDialogs m={m} today={today} />
    </>
  );
}
