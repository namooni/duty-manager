import {SchedulePhaseBadge} from './SchedulePhaseBadge';
import type {DutyDetails} from '@/hooks/duties/useDutyDetails';
import type {WorkOccurrence} from '@/repositories/automatic/automatic.domain';
import {dateLabel} from '@/utils/format/date';
import * as U from '@/components/ui';
import * as S from './DutyAnnualSchedule.styles';
function MeetingEntry({event, work}: {event: WorkOccurrence; work: DutyDetails['work']}) {
  return (
    <S.Entry $phase={work.phaseOf(event).state}>
      <U.Row>
        <SchedulePhaseBadge phase={work.phaseOf(event)} />
        <U.Text as="strong">
          {event.date ? dateLabel(event.date) : '第' + (event.sequence + 1) + '回'}
        </U.Text>
        {event.holiday && <U.Badge $muted>実施なし（休業日）</U.Badge>}
      </U.Row>
      {event.assignees.length ? (
        event.assignees.map(person => (
          <U.ItemActionRow key={person.slotId} $actionWidth="112px">
            <U.Text>{person.name}</U.Text>
            <U.Button
              size="sm"
              variant="text"
              disabled={work.busy}
              onClick={() => work.openReplacement(event, person)}
            >
              {work.canReplace(event) ? '担当者を変更' : '変更履歴'}
            </U.Button>
          </U.ItemActionRow>
        ))
      ) : (
        <U.Muted>担当者未定</U.Muted>
      )}
      {event.warning && <U.Muted role="status">{event.warning}</U.Muted>}
      {work.canChangeMeeting(event) && (
        <U.Button size="sm" disabled={work.busy} onClick={() => work.openMeeting(event)}>
          {event.date ? '開催日を変更' : '開催日を登録'}
        </U.Button>
      )}
    </S.Entry>
  );
}
export function DutyAnnualSchedule({details}: {details: DutyDetails}) {
  return (
    <U.Stack>
      <S.Grid>
        {details.months.map(month => (
          <S.Month key={month.month}>
            <U.Text as="h3" variant="h3">
              {month.month}月
            </U.Text>
            {month.events.length ? (
              month.events.map(event => (
                <MeetingEntry key={event.sequence} event={event} work={details.work} />
              ))
            ) : (
              <U.Stack style={{gap: 8, marginTop: 12}}>
                <U.Muted as="p">予定なし</U.Muted>
                {month.registration && (
                  <>
                    <U.Button
                      size="sm"
                      disabled={details.work.busy || !month.registration.available}
                      onClick={month.registration.open}
                      aria-label={month.month + '月の開催日を登録'}
                    >
                      開催日を登録
                    </U.Button>
                    {month.registration.reason && <U.Muted>{month.registration.reason}</U.Muted>}
                  </>
                )}
              </U.Stack>
            )}
          </S.Month>
        ))}
      </S.Grid>
      {!!details.pending.length && (
        <U.Panel style={{padding: 16, gap: 8}}>
          <U.Text as="h3" variant="h3">
            開催日未定
          </U.Text>
          <U.Muted>年が未確定の回です。開催日を登録すると、その年の予定に表示されます。</U.Muted>
          {details.pending.map(event => (
            <MeetingEntry key={event.sequence} event={event} work={details.work} />
          ))}
        </U.Panel>
      )}
    </U.Stack>
  );
}
