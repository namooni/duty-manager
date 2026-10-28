import type {AutomaticDuty} from '@/repositories/automatic/automatic.domain';
import {useScheduleExtension} from '@/hooks/duties/useScheduleExtension';
import {RotationPreviewList} from './RotationPreviewList';
import * as U from '@/components/ui';
export function ScheduleExtensionDialog({
  config,
  onClose,
  onSaved,
}: {
  config: AutomaticDuty;
  onClose: () => void;
  onSaved: () => void;
}) {
  const m = useScheduleExtension(config, onSaved);
  return (
    <U.Modal title="担当予定を追加" busy={m.busy} onClose={onClose}>
      {m.error && <U.Alert role="alert">{m.error}</U.Alert>}
      {!m.review ? (
        <U.Form
          onSubmit={e => {
            e.preventDefault();
            void m.preview();
          }}
        >
          <U.Text as="strong">{config.duty.name}</U.Text>
          <U.Text>{'現在の担当予定：' + m.through + 'まで'}</U.Text>
          <U.Muted>既存の担当・手動変更を維持し、続きの担当予定だけを追加します。</U.Muted>
          <U.Field>
            <U.Text>担当者を決める期間を延長</U.Text>
            <U.Input
              type="date"
              required
              min={m.through}
              max={m.end ?? undefined}
              value={m.plannedThrough}
              onChange={e => m.setPlannedThrough(e.target.value)}
            />
          </U.Field>
          {config.schedule.recurrence === 'EXPLICIT_DATES' && (
            <U.Field>
              <U.Text>日付未定の開催回を追加</U.Text>
              <U.Input
                type="number"
                min={0}
                max={200}
                value={m.additionalMeetings}
                onChange={e => m.setAdditionalMeetings(Number(e.target.value))}
              />
              <U.Muted>追加した回の開催日は、詳細画面で後から指定できます。</U.Muted>
            </U.Field>
          )}
          <U.InlineActions>
            <U.Button onClick={onClose}>キャンセル</U.Button>
            <U.Button type="submit" variant="primary" disabled={m.busy}>
              追加内容を確認
            </U.Button>
          </U.InlineActions>
        </U.Form>
      ) : (
        <U.Stack>
          <U.Text>
            {'担当予定の終了：' + m.through + ' → ' + m.review.preview.range?.plannedThrough}
          </U.Text>
          <U.Text as="strong">{m.review.preview.turns.length + '回分を追加します。'}</U.Text>
          <U.Muted>
            週・月の担当は期間の終わりまで作成します。当番の終了日を超えて作成することはありません。
          </U.Muted>
          {!m.review.preview.turns.length && (
            <U.Muted>
              この期間に新しい担当枠はありません。担当予定の対象期間だけを延長します。
            </U.Muted>
          )}
          <RotationPreviewList preview={m.review.preview} mode={config.schedule.rotationMode} />
          <U.InlineActions>
            <U.Button disabled={m.busy} onClick={m.back}>
              入力に戻る
            </U.Button>
            {m.stale && (
              <U.Button onClick={() => void m.preview()} disabled={m.busy}>
                追加内容を再確認
              </U.Button>
            )}
            <U.Button variant="primary" disabled={!m.canApply} onClick={() => void m.confirm()}>
              この内容で追加
            </U.Button>
          </U.InlineActions>
        </U.Stack>
      )}
    </U.Modal>
  );
}
