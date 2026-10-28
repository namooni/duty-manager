import type {useDutyDeletion} from '@/hooks/duties/useDutyDeletion';
import * as U from '@/components/ui';
export function DeleteDutyDialog({deletion}: {deletion: ReturnType<typeof useDutyDeletion>}) {
  if (!deletion.target) return null;
  return (
    <U.Modal title="当番を削除" busy={deletion.busy} onClose={deletion.close}>
      <U.Stack>
        <U.Text as="strong">「{deletion.target.name}」を削除しますか？</U.Text>
        <U.Muted>
          開始日：{deletion.target.anchorDate} · 参加{deletion.target.memberIds.length}人
        </U.Muted>
        <U.Text>
          この当番の設定、すべての予定・担当割当、対象外の期間、変更履歴を削除します。この操作は取り消せません。
        </U.Text>
        <U.Muted>メンバー情報と、ほかの当番は削除されません。</U.Muted>
        {deletion.error && <U.Alert role="alert">{deletion.error}</U.Alert>}
        <U.Row style={{justifyContent: 'flex-end'}}>
          <U.Button disabled={deletion.busy} onClick={deletion.close}>
            キャンセル
          </U.Button>
          <U.Button variant="danger" disabled={deletion.busy} onClick={deletion.confirm}>
            {deletion.busy ? '削除中…' : '削除する'}
          </U.Button>
        </U.Row>
      </U.Stack>
    </U.Modal>
  );
}
