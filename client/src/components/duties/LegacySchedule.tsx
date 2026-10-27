import {useState} from 'react';
import type {DutyManager} from '@/hooks/duties/useDutyManager';
import * as U from '@/components/ui';
export function LegacySchedule({m}: {m: DutyManager}) {
  const [open, setOpen] = useState(false);
  if (!m.assignments.length) return null;
  return (
    <U.Flex flexDirection="column" style={{marginTop: 24}}>
      <U.Button
        variant="text"
        aria-expanded={open}
        aria-controls="legacy-schedule"
        onClick={() => setOpen(value => !value)}
      >
        以前の形式の担当期間（{m.assignments.length}件）{open ? 'を閉じる' : 'を表示'}
      </U.Button>
      {open && (
        <U.Stack id="legacy-schedule" style={{padding: 16}}>
          <U.Muted>実施日が設定される前の担当期間と変更履歴です。</U.Muted>
          {m.assignments.map(a => (
            <U.Between key={a.id}>
              <U.Text>
                {a.dutyName} · {a.periodStart} 〜 {a.periodEnd} · {a.employeeName}
              </U.Text>
              <U.Button disabled={m.busy} onClick={() => m.openReplace(a)}>
                変更・履歴
              </U.Button>
            </U.Between>
          ))}
        </U.Stack>
      )}
    </U.Flex>
  );
}
