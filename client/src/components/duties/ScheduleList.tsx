import {SchedulePhaseBadge} from './SchedulePhaseBadge';
import * as S from './ScheduleList.styles';
import type {DutyManager} from '@/hooks/duties/useDutyManager';
import type {AutomaticSchedule} from '@/hooks/duties/useAutomaticSchedule';
import {ScheduleDateDetails} from './ScheduleDateDetails';
import * as U from '@/components/ui';
export function ScheduleList({m, work}: {m: DutyManager; work: AutomaticSchedule}) {
  return (
    <U.Panel>
      {work.loading ? (
        <U.Empty role="status">読み込み中…</U.Empty>
      ) : work.error && !work.dialog && !work.hasData ? (
        <U.Empty>予定を取得できませんでした。更新して再度お試しください。</U.Empty>
      ) : work.rows.length ? (
        <U.TableWrap>
          <S.ScheduleTable aria-label="当番の予定一覧">
            <thead>
              <tr>
                <th>実施日</th>
                <th>当番</th>
                <th>担当者</th>
                <th>担当の交代</th>
              </tr>
            </thead>
            <tbody>
              {work.rows.map(event => (
                <S.ScheduleRow
                  key={event.key}
                  $phase={work.phaseOf(event).state}
                  data-phase={work.phaseOf(event).state}
                >
                  <td>
                    <S.CellContent>
                      {work.phaseOf(event).label && (
                        <U.Row>
                          <SchedulePhaseBadge phase={work.phaseOf(event)} />
                        </U.Row>
                      )}
                      {event.grouped ? (
                        <>
                          <U.Text>
                            {event.executionStart ?? '実施なし（会社休業日）'}
                            {event.executionStart && event.executionStart !== event.executionEnd
                              ? ' 〜 ' + event.executionEnd
                              : ''}
                          </U.Text>
                          <ScheduleDateDetails row={event} />
                        </>
                      ) : (
                        <>
                          <U.Text>{event.date ?? '開催日未定'}</U.Text>
                          {event.date === null && (
                            <U.Muted>次回 · 第{event.sequence + 1}回</U.Muted>
                          )}
                          {event.holiday && <U.Badge $muted>実施なし（会社休業日）</U.Badge>}
                        </>
                      )}
                    </S.CellContent>
                  </td>
                  <td>
                    <S.CellContent>
                      <S.DutyTitle>{event.dutyName}</S.DutyTitle>
                      {event.warning && <U.Muted role="status">{event.warning}</U.Muted>}
                      {work.canChangeMeeting(event) && (
                        <U.Button
                          size="sm"
                          disabled={m.busy || work.busy}
                          onClick={() => work.openMeeting(event)}
                        >
                          {event.date ? '開催日を変更' : '開催日を登録'}
                        </U.Button>
                      )}
                    </S.CellContent>
                  </td>
                  <td>
                    <S.CellContent>
                      <U.Flex flexDirection="column" gap={8}>
                        {event.assignees.map(person => (
                          <S.AssigneeRow key={person.slotId}>
                            <U.Text style={{fontWeight: work.isAssigneeMatch(person) ? 700 : 400}}>
                              {person.name}（{person.employeeNumber}）
                            </U.Text>
                            <U.Button
                              size="sm"
                              disabled={m.busy || work.busy}
                              onClick={() => work.openReplacement(event, person)}
                            >
                              {work.canReplace(event) ? '担当者を変更' : '変更履歴'}
                            </U.Button>
                          </S.AssigneeRow>
                        ))}
                      </U.Flex>
                    </S.CellContent>
                  </td>
                  <td>
                    <S.CellContent>
                      <U.Text>
                        {event.rotationMode === 'OCCURRENCE' ? '実施1回ごと' : '期間ごと'}
                      </U.Text>
                    </S.CellContent>
                  </td>
                </S.ScheduleRow>
              ))}
            </tbody>
          </S.ScheduleTable>
        </U.TableWrap>
      ) : (
        <U.Empty>
          <U.Text>
            {work.hasFilters
              ? '条件に一致する担当はありません。'
              : '表示期間に実施予定がありません。'}
          </U.Text>
          {work.hasFilters ? (
            <U.Button onClick={work.resetFilters}>絞り込みを解除</U.Button>
          ) : (
            <U.Button
              variant="primary"
              onClick={() => m.open(m.employees.length ? 'duty' : 'employee')}
            >
              {m.employees.length ? '当番を作成' : 'メンバーを追加'}
            </U.Button>
          )}
        </U.Empty>
      )}
    </U.Panel>
  );
}
