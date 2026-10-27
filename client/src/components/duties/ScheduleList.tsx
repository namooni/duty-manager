import type {DutyManager} from '@/hooks/duties/useDutyManager';
import type {AutomaticSchedule} from '@/hooks/duties/useAutomaticSchedule';
import {ScheduleDateDetails} from './ScheduleDateDetails';
import * as U from '@/components/ui';
export function ScheduleList({m, work}: {m: DutyManager; work: AutomaticSchedule}) {
  return (
    <U.Panel>
      {work.loading ? (
        <U.Empty role="status">読み込み中…</U.Empty>
      ) : work.error && !work.dialog ? (
        <U.Empty>予定を取得できませんでした。更新して再度お試しください。</U.Empty>
      ) : work.rows.length ? (
        <U.TableWrap>
          <U.Table aria-label="当番の予定一覧">
            <thead>
              <tr>
                <th>実施日 / 担当期間</th>
                <th>当番</th>
                <th>担当者</th>
                <th>担当の交代</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {work.rows.map(event => (
                <tr key={event.key}>
                  <td>
                    {event.grouped ? (
                      <>
                        <U.Text>
                          {event.periodStart}
                          {event.periodStart !== event.periodEnd ? ' 〜 ' + event.periodEnd : ''}
                        </U.Text>
                        <ScheduleDateDetails row={event} />
                      </>
                    ) : (
                      <>
                        <U.Text>{event.date ?? '開催日未定'}</U.Text>
                        {event.date === null && <U.Muted>次回 · 第{event.sequence + 1}回</U.Muted>}
                        {event.holiday && <U.Badge $muted>実施なし（会社休業日）</U.Badge>}
                      </>
                    )}
                  </td>
                  <td>
                    <U.Text>{event.dutyName}</U.Text>
                    {event.warning && <U.Muted role="status">{event.warning}</U.Muted>}
                  </td>
                  <td>
                    <U.Stack>
                      {event.assignees.map(person => (
                        <U.Row key={person.slotId}>
                          <U.Text>
                            {person.name}（{person.employeeNumber}）
                          </U.Text>
                          <U.Button
                            disabled={m.busy}
                            onClick={() => work.openReplacement(event, person)}
                          >
                            変更・履歴
                          </U.Button>
                        </U.Row>
                      ))}
                    </U.Stack>
                  </td>
                  <td>
                    <U.Text>
                      {event.rotationMode === 'OCCURRENCE' ? '実施1回ごと' : '期間ごと'}
                    </U.Text>
                  </td>
                  <td>
                    <U.Row>
                      {work.canChangeMeeting(event) && (
                        <U.Button disabled={m.busy} onClick={() => work.openMeeting(event)}>
                          {event.date ? '開催日を変更' : '開催日を登録'}
                        </U.Button>
                      )}
                      <U.Button
                        disabled={m.busy}
                        onClick={() => {
                          m.setSelectedId(event.dutyId);
                          m.open('exclusion');
                        }}
                      >
                        対象外期間
                      </U.Button>
                    </U.Row>
                  </td>
                </tr>
              ))}
            </tbody>
          </U.Table>
        </U.TableWrap>
      ) : (
        <U.Empty>
          <U.Text>表示期間に実施予定がありません。</U.Text>
          <U.Button
            variant="primary"
            onClick={() => m.open(m.employees.length ? 'duty' : 'employee')}
          >
            {m.employees.length ? '当番を作成' : 'メンバーを追加'}
          </U.Button>
        </U.Empty>
      )}
    </U.Panel>
  );
}
