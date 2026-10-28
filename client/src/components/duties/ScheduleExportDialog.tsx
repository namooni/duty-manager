import type {AutomaticDuty} from '@/repositories/automatic/automatic.domain';
import {ExportFormat} from '@/repositories/scheduleExports/scheduleExports.domain';
import {useScheduleExport} from '@/hooks/duties/useScheduleExport';
import * as U from '@/components/ui';
export function ScheduleExportDialog({
  config,
  from,
  to,
  onClose,
}: {
  config: AutomaticDuty;
  from: string;
  to: string;
  onClose: () => void;
}) {
  const m = useScheduleExport(config, from, to, onClose);
  return (
    <U.Modal title="Excelをダウンロード" busy={m.busy} onClose={onClose}>
      <U.Form
        onSubmit={event => {
          event.preventDefault();
          void m.download();
        }}
      >
        <U.Text as="strong">{config.duty.name}</U.Text>
        <U.Muted>
          保存済みの担当予定を出力します。ダウンロードで新しい担当は割り当てません。
        </U.Muted>
        {m.error && <U.Alert role="alert">{m.error}</U.Alert>}
        <U.Row>
          <U.Field>
            <U.Text>出力開始日</U.Text>
            <U.Input
              autoFocus
              type="date"
              required
              value={m.from}
              min="1900-01-01"
              max="2199-12-31"
              onChange={e => m.setFrom(e.target.value)}
            />
          </U.Field>
          <U.Field>
            <U.Text>出力終了日</U.Text>
            <U.Input
              type="date"
              required
              value={m.to}
              min={m.from || '1900-01-01'}
              max="2199-12-31"
              onChange={e => m.setTo(e.target.value)}
            />
          </U.Field>
        </U.Row>
        <U.Field>
          <U.Text>出力形式</U.Text>
          <U.Select value={m.format} onChange={e => m.setFormat(e.target.value as ExportFormat)}>
            <option value={ExportFormat.PERIOD}>
              期間別担当表{m.recommended === ExportFormat.PERIOD ? '（おすすめ）' : ''}
            </option>
            <option value={ExportFormat.MEETING}>
              開催日一覧{m.recommended === ExportFormat.MEETING ? '（おすすめ）' : ''}
            </option>
          </U.Select>
        </U.Field>
        <U.Panel style={{padding: 16}}>
          <U.Stack>
            <U.Text as="strong">
              {m.format === ExportFormat.PERIOD
                ? '実施日 / 担当者'
                : '回 / 開催日 / 曜日 / 担当者 / 備考'}
            </U.Text>
            <U.Muted>
              {m.format === ExportFormat.PERIOD
                ? '年は上部にまとめ、8月3日～8月7日のように表示します。休業日や交代の区切りは詳細シートで確認できます。'
                : '開催順に、日付と担当者を一回ずつ表示します。'}
            </U.Muted>
            <U.Muted>
              どちらの形式にも、休業日を確認できる「実施日一覧」シートが付きます。A4印刷・見出し固定に対応しています。
            </U.Muted>
          </U.Stack>
        </U.Panel>
        {m.hasUndated && (
          <U.Stack>
            <U.Field style={{flexDirection: 'row', alignItems: 'center'}}>
              <U.Checkbox
                checked={m.includeUndated}
                onChange={e => m.setIncludeUndated(e.target.checked)}
              />
              <U.Text>開催日未定の回も含める</U.Text>
            </U.Field>
            <U.Muted>未定の回は対象年が未確定のため、保存済みの未定回をすべて含めます。</U.Muted>
          </U.Stack>
        )}
        {m.notices.map(text => (
          <U.Alert role="status" key={text}>
            {text}
          </U.Alert>
        ))}
        <U.Muted>出力期間は最大367日です。日付や担当者はダウンロード時点の内容です。</U.Muted>
        <U.InlineActions style={{justifyContent: 'flex-end'}}>
          <U.Button disabled={m.busy} onClick={onClose}>
            キャンセル
          </U.Button>
          <U.Button type="submit" variant="primary" disabled={m.busy}>
            {m.busy ? '作成中…' : 'Excelをダウンロード'}
          </U.Button>
        </U.InlineActions>
      </U.Form>
    </U.Modal>
  );
}
