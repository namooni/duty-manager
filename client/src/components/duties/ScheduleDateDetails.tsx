import {useId, useState} from 'react';
import type {ScheduleRow} from '@/utils/schedule/groupOccurrences';
import * as U from '@/components/ui';
export function ScheduleDateDetails({row}: {row: ScheduleRow}) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  return (
    <U.Flex flexDirection="column">
      <U.Muted>
        表示範囲内：実施{row.executionCount}回
        {row.holidayCount ? ' · 休業' + row.holidayCount + '日' : ''}
      </U.Muted>
      <U.Button
        variant="text"
        aria-expanded={expanded}
        aria-controls={id}
        onClick={() => setExpanded(value => !value)}
      >
        {expanded ? '実施日を閉じる' : '実施日を確認'}
      </U.Button>
      {expanded && (
        <U.Flex flexDirection="column" id={id} style={{maxHeight: 240, overflowY: 'auto'}}>
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
