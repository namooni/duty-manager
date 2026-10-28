import {useState} from 'react';
import type {Assignment} from '@/repositories/assignments/assignments.domain';
import type {DutyManager} from '@/hooks/duties/useDutyManager';
import * as U from '@/components/ui';
export function LegacySchedule({
  m,
  assignments,
}: {
  m: DutyManager;
  assignments: readonly Assignment[];
}) {
  const [open, setOpen] = useState(false);
  if (!assignments.length) return null;
  return (
    <U.Flex flexDirection="column" gap={12} style={{marginTop: 24}}>
      <U.Button
        variant="text"
        aria-expanded={open}
        aria-controls="legacy-schedule"
        onClick={() => setOpen(value => !value)}
      >
        以前の形式の担当期間（{assignments.length}件）{open ? 'を閉じる' : 'を表示'}
      </U.Button>
      {open && (
        <U.Stack id="legacy-schedule" style={{padding: 16}}>
          <U.Muted>実施日が設定される前の担当期間と変更履歴です。</U.Muted>
          {assignments.map(a => (
            <U.ItemActionRow key={a.id}>
              <U.Text>
                {a.dutyName} · {a.periodStart} 〜 {a.periodEnd} · {a.employeeName}
              </U.Text>
              <U.Button size="sm" disabled={m.busy} onClick={() => m.openReplace(a)}>
                担当者の変更・履歴
              </U.Button>
            </U.ItemActionRow>
          ))}
        </U.Stack>
      )}
    </U.Flex>
  );
}
