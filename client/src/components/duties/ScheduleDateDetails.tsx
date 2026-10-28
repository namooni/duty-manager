import {useId, useState} from 'react';
import type {ScheduleRow} from '@/utils/schedule/groupOccurrences';
import * as U from '@/components/ui';
export function ScheduleDateDetails({row}: {row: ScheduleRow}) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  return (
    <U.Flex flexDirection="column" gap={6} alignItems="flex-start">
      <U.Muted>
        表示範囲内：実施{row.executionCount}回
        {row.holidayCount ? ' · 休業' + row.holidayCount + '日' : ''}
      </U.Muted>
      <U.Button
        size="sm"
        variant="text"
        aria-expanded={expanded}
        aria-controls={id}
        onClick={() => setExpanded(value => !value)}
      >
        {expanded ? '実施日を閉じる' : '実施日を確認'}
      </U.Button>
      {expanded && (
        <U.Flex
          flexDirection="column"
          id={id}
          style={{maxHeight: 240, overflowY: 'auto', width: '100%'}}
        >
          <U.Muted>
            交代の区切り：{row.periodStart}
            {row.periodStart !== row.periodEnd ? ' 〜 ' + row.periodEnd : ''}
          </U.Muted>
          {row.events.map(event => (
            <U.ListItem key={event.sequence}>
              <U.Text>{event.date}</U.Text>
              {event.holiday && <U.Badge $muted>実施なし（会社休業日）</U.Badge>}
              {event.warning && <U.Muted>{event.warning}</U.Muted>}
            </U.ListItem>
          ))}
        </U.Flex>
      )}
    </U.Flex>
  );
}
