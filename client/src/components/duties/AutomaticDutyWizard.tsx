import {RotationPreviewList} from './RotationPreviewList';
import {useAutomaticDutyCreation} from '@/hooks/duties/useAutomaticDutyCreation';
import type {Employee} from '@/repositories/employees/employees.domain';
import type {Recurrence, RotationMode} from '@/repositories/automatic/automatic.domain';
import type {IntervalUnit, Strategy} from '@/repositories/duties/duties.domain';
import {recurrenceLabels, weekdayLabels} from '@/constants/schedule';
import {DutyParticipants} from './DutyParticipants';
import * as U from '@/components/ui';
export function AutomaticDutyWizard({
  employees,
  today,
  onSaved,
  onClose,
}: {
  employees: readonly Employee[];
  today: string;
  onSaved: (id: number, anchorDate: string) => void;
  onClose: () => void;
}) {
  const m = useAutomaticDutyCreation(employees, today, onSaved, onClose);
  return (
    <U.Modal
      title={m.review ? '当番の作成 · 2/2 担当順の確認' : '当番の作成 · 1/2 実施日と担当ルール'}
      busy={m.busy}
      onClose={m.close}
    >
      {m.error && <U.Alert role="alert">{m.error}</U.Alert>}
      {!m.review ? (
        <U.Form
          onSubmit={event => {
            event.preventDefault();
            void m.preview();
          }}
        >
          <U.Field>
            <U.Text>当番の名前</U.Text>
            <U.Input
              autoFocus
              required
              maxLength={100}
              placeholder="例：定例会の議事録"
              value={m.duty.form.name}
              onChange={e => m.duty.update('name', e.target.value)}
            />
          </U.Field>
          <U.Field>
            <U.Text>説明（任意）</U.Text>
            <U.Textarea
              maxLength={1000}
              value={m.duty.form.description}
              onChange={e => m.duty.update('description', e.target.value)}
            />
          </U.Field>
          <U.Field>
            <U.Text>担当開始日</U.Text>
            <U.Input
              type="date"
              required
              value={m.duty.form.anchorDate}
              onChange={e => m.updateStartDate(e.target.value)}
            />
          </U.Field>
          <U.Divider />
          <U.Text as="h3" variant="h3">
            いつ実施しますか？
          </U.Text>
          <U.Field>
            <U.Text>実施する日</U.Text>
            <U.Select
              value={m.rule.recurrence}
              onChange={e => m.updateRule('recurrence', e.target.value as Recurrence)}
            >
              {Object.entries(recurrenceLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </U.Select>
          </U.Field>
          {m.rule.recurrence === 'WEEKLY' && (
            <U.Row>
              {weekdayLabels.map((label, index) => (
                <U.Field
                  key={label}
                  style={{flex: 'initial', flexDirection: 'row', alignItems: 'center'}}
                >
                  <U.Checkbox
                    checked={m.rule.weekdays.includes(index + 1)}
                    onChange={() => m.toggleWeekday(index + 1)}
                  />
                  <U.Text>{label}</U.Text>
                </U.Field>
              ))}
            </U.Row>
          )}
          {m.rule.recurrence === 'DAILY_INTERVAL' && (
            <U.Field>
              <U.Text>実施日の間隔（日）</U.Text>
              <U.Input
                type="number"
                required
                min={1}
                max={365}
                value={m.rule.everyDays}
                onChange={e => m.updateRule('everyDays', Number(e.target.value))}
              />
            </U.Field>
          )}
          {m.rule.recurrence === 'MONTHLY_DAY' && (
            <>
              <U.Field>
                <U.Text>毎月の開催日</U.Text>
                <U.Select
                  value={m.rule.monthDay}
                  onChange={e => m.updateRule('monthDay', Number(e.target.value))}
                >
                  <option value={0}>月末</option>
                  {Array.from({length: 31}, (_, i) => (
                    <option key={i} value={i + 1}>
                      {i + 1}日
                    </option>
                  ))}
                </U.Select>
              </U.Field>
              <U.Muted>指定した日がない月は実施しません。</U.Muted>
            </>
          )}
          {m.rule.recurrence === 'MONTHLY_NTH_WEEKDAY' && (
            <>
              <U.Row>
                <U.Field>
                  <U.Text>何週目</U.Text>
                  <U.Select
                    value={m.rule.monthOrdinal}
                    onChange={e => m.updateRule('monthOrdinal', Number(e.target.value))}
                  >
                    <option value={0}>最終</option>
                    {[1, 2, 3, 4, 5].map(i => (
                      <option key={i} value={i}>
                        第{i}
                      </option>
                    ))}
                  </U.Select>
                </U.Field>
                <U.Field>
                  <U.Text>曜日</U.Text>
                  <U.Select
                    value={m.rule.weekday}
                    onChange={e => m.updateRule('weekday', Number(e.target.value))}
                  >
                    {weekdayLabels.map((day, i) => (
                      <option key={day} value={i + 1}>
                        {day}曜日
                      </option>
                    ))}
                  </U.Select>
                </U.Field>
              </U.Row>
              <U.Muted>第5曜日がない月は実施しません。</U.Muted>
            </>
          )}
          {m.rule.recurrence === 'EXPLICIT_DATES' && (
            <U.Stack>
              <U.Muted>
                毎月日付が変わる定例会などに使います。日付は後から登録・変更できます。
              </U.Muted>
              {m.dates.map((date, index) => (
                <U.Row key={index}>
                  <U.Field>
                    <U.Text>開催日 {index + 1}（未定なら空欄）</U.Text>
                    <U.Input
                      type="date"
                      min={m.duty.form.anchorDate}
                      value={date}
                      onChange={e => m.updateDate(index, e.target.value)}
                    />
                  </U.Field>
                  <U.Button
                    variant="dangerText"
                    aria-label={'開催日' + (index + 1) + 'を除く'}
                    onClick={() => m.removeDate(index)}
                  >
                    削除
                  </U.Button>
                </U.Row>
              ))}
              <U.Button onClick={m.addDate}>開催日を追加</U.Button>
            </U.Stack>
          )}
          <U.Divider />
          <U.Text as="h3" variant="h3">
            担当者はいつ交代しますか？
          </U.Text>
          <U.Field>
            <U.Text>担当の交代</U.Text>
            <U.Select
              disabled={m.rule.recurrence === 'EXPLICIT_DATES'}
              value={m.rule.rotationMode}
              onChange={e => m.updateRule('rotationMode', e.target.value as RotationMode)}
            >
              <option value="CALENDAR">一定期間、同じ人が担当</option>
              <option value="OCCURRENCE">実施1回ごとに交代</option>
            </U.Select>
          </U.Field>
          {m.rule.rotationMode === 'CALENDAR' ? (
            <>
              <U.Row>
                <U.Field>
                  <U.Text>交代する周期</U.Text>
                  <U.Input
                    type="number"
                    min={1}
                    max={365}
                    required
                    value={m.duty.form.intervalCount}
                    onChange={e => m.duty.update('intervalCount', Number(e.target.value))}
                  />
                </U.Field>
                <U.Field>
                  <U.Text>単位</U.Text>
                  <U.Select
                    value={m.duty.form.intervalUnit}
                    onChange={e => m.duty.update('intervalUnit', e.target.value as IntervalUnit)}
                  >
                    <option value="DAY">日ごと</option>
                    <option value="WEEK">週ごと</option>
                    <option value="MONTH">か月ごと</option>
                  </U.Select>
                </U.Field>
              </U.Row>
              <U.Muted>
                例：朝会は毎日実施し、担当者は1週間ずつ交代します。休業日でも交代日は変わりません。
              </U.Muted>
            </>
          ) : (
            <U.Muted>会議なら、1回の会議を担当したら次の人に交代します。</U.Muted>
          )}
          <U.Row>
            <U.Field>
              <U.Text>一度に担当する人数</U.Text>
              <U.Input
                type="number"
                min={1}
                max={20}
                required
                value={m.duty.form.assigneeCount}
                onChange={e => m.duty.update('assigneeCount', Number(e.target.value))}
              />
            </U.Field>
            <U.Field>
              <U.Text>担当する順番</U.Text>
              <U.Select
                value={m.duty.form.strategy}
                onChange={e => m.duty.update('strategy', e.target.value as Strategy)}
              >
                <option value="EMPLOYEE_NUMBER">社員番号順</option>
                <option value="CUSTOM">指定順（選んだ順）</option>
                <option value="SHUFFLED_ROUND">ランダム（全員一巡）</option>
              </U.Select>
            </U.Field>
          </U.Row>
          <DutyParticipants form={m.duty} />
          <U.Divider />
          <U.Text as="h3" variant="h3">
            運用期間と担当予定
          </U.Text>
          <U.Field>
            <U.Text>当番の終了</U.Text>
            <U.Select
              value={m.hasEnd ? 'DATE' : 'NONE'}
              onChange={e => m.setHasEnd(e.target.value === 'DATE')}
            >
              <option value="NONE">終了日なし</option>
              <option value="DATE">終了日を指定</option>
            </U.Select>
          </U.Field>
          {m.hasEnd && (
            <U.Field>
              <U.Text>当番の終了日</U.Text>
              <U.Input
                type="date"
                required
                min={m.duty.form.anchorDate}
                value={m.endDate}
                onChange={e => m.setEndDate(e.target.value)}
              />
            </U.Field>
          )}
          <U.Field>
            <U.Text>担当者を決める期間</U.Text>
            <U.Row>
              <U.Text>{m.duty.form.anchorDate + ' 〜'}</U.Text>
              <U.Input
                type="date"
                required
                aria-label="担当者を決める期間の終了日"
                min={m.duty.form.anchorDate}
                max={m.hasEnd ? m.endDate : undefined}
                value={m.plannedThrough}
                onChange={e => m.setPlannedThrough(e.target.value)}
              />
            </U.Row>
          </U.Field>
          <U.Muted>
            この期間の担当予定を作成します。週・月の途中で区切る場合は、その担当期間の終わりまで作成し、次の画面で実際の期間を確認できます。当番の終了日がある場合は、その日で終了します。
          </U.Muted>

          <U.Row>
            <U.Button disabled={m.busy} onClick={m.close}>
              キャンセル
            </U.Button>
            <U.Button variant="primary" type="submit" disabled={m.busy}>
              {m.busy ? '確認中…' : '次へ：担当順を確認'}
            </U.Button>
          </U.Row>
        </U.Form>
      ) : (
        <U.Stack>
          <U.Text as="h3" variant="h3">
            {m.review.draft.duty.name}
          </U.Text>
          <U.Text>実施日：{m.scheduleText}</U.Text>
          <U.Text>
            担当：{m.rotationText} · 各{m.review.draft.duty.assigneeCount}人 · 参加
            {m.review.draft.duty.memberIds.length}人
          </U.Text>
          <U.Text>当番の終了：{m.review.draft.endDate ?? '終了日なし'}</U.Text>
          <U.Text>
            今回の担当予定：
            {m.review.draft.duty.anchorDate +
              ' 〜 ' +
              (m.review.preview.range?.plannedThrough ?? m.review.draft.plannedThrough)}
          </U.Text>
          <U.Text as="strong">
            {m.review.preview.turns.length +
              '回分の担当を作成します。参加者' +
              m.review.draft.duty.memberIds.length +
              '人で繰り返し担当します。'}
          </U.Text>
          <U.Muted>
            期間外の予定は自動作成しません。続きは当番詳細の「担当予定を追加」から追加できます。
          </U.Muted>
          <RotationPreviewList preview={m.review.preview} mode={m.rule.rotationMode} />
          {m.rule.recurrence === 'EXPLICIT_DATES' && (
            <U.Muted>日付未定の回は、開催日を登録するとスケジュールに反映されます。</U.Muted>
          )}
          <U.Row>
            <U.Button disabled={m.busy} onClick={m.close}>
              キャンセル
            </U.Button>
            <U.Button disabled={m.busy} onClick={m.back}>
              入力に戻る
            </U.Button>
            <U.Button variant="primary" disabled={!m.canStart} onClick={m.activate}>
              {m.busy ? '作成中…' : 'この内容で作成'}
            </U.Button>
          </U.Row>
        </U.Stack>
      )}
    </U.Modal>
  );
}
