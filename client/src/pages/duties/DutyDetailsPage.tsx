import {ScheduleExportDialog} from '@/components/duties/ScheduleExportDialog';
import {ScheduleExtensionDialog} from '@/components/duties/ScheduleExtensionDialog';
import {DutyAssignmentEditor} from '@/components/duties/DutyAssignmentEditor';
import {useDutyDetails} from '@/hooks/duties/useDutyDetails';
import {DutyMetadataDialog} from '@/components/duties/DutyMetadataDialog';
import {DutyAnnualSchedule} from '@/components/duties/DutyAnnualSchedule';
import {ScheduleList} from '@/components/duties/ScheduleList';
import {LegacySchedule} from '@/components/duties/LegacySchedule';
import {DutyForms} from '@/components/duties/DutyForms';
import {AutomaticScheduleDialogs} from '@/components/duties/AutomaticScheduleDialogs';
import {scheduleLabel, rotationLabel} from '@/utils/format/schedule';
import {strategyLabel} from '@/constants/duties';
import * as U from '@/components/ui';
export function DutyDetailsPage() {
  const d = useDutyDetails();
  const {m, work} = d;
  return (
    <U.Stack style={{gap: 20}}>
      <U.Between>
        <U.Button variant="text" onClick={d.back}>
          ← 当番の設定
        </U.Button>
        <U.Button
          disabled={m.busy || d.loading || work.refreshing || d.refreshing}
          onClick={m.refresh}
        >
          {d.refreshing || work.refreshing ? '更新中…' : '更新'}
        </U.Button>
      </U.Between>
      {d.error && !d.duty ? (
        <U.Alert role="alert">{d.error}</U.Alert>
      ) : d.loading || !d.duty ? (
        <U.Empty>読み込み中…</U.Empty>
      ) : (
        <>
          <U.Between>
            <U.Flex flexDirection="column" gap={6}>
              <U.Text as="h1" variant="h1">
                {d.duty.name}
              </U.Text>
              <U.Muted>{d.duty.description || '説明は登録されていません。'}</U.Muted>
            </U.Flex>
            <U.InlineActions>
              {d.config && (
                <U.Button disabled={m.busy || work.loading} onClick={d.openExport}>
                  Excelをダウンロード
                </U.Button>
              )}
              {d.config && (
                <U.Button disabled={m.busy} onClick={d.openExtension}>
                  担当予定を追加
                </U.Button>
              )}
              <U.Button disabled={m.busy} onClick={() => d.editor.open(d.duty!)}>
                基本情報を編集
              </U.Button>
              <U.Button
                variant="primary"
                disabled={m.busy || work.loading}
                onClick={d.openRuleEditor}
              >
                担当ルールを編集
              </U.Button>
            </U.InlineActions>
          </U.Between>
          {m.error && <U.Alert role="alert">{m.error}</U.Alert>}
          {d.error && <U.Alert role="alert">{d.error}</U.Alert>}
          <U.Panel style={{padding: 20}}>
            <U.Stack>
              <U.Row>
                <U.Badge>開始日 {d.duty.anchorDate}</U.Badge>
                <U.Badge>{strategyLabel[d.duty.strategy]}</U.Badge>
                <U.Badge>各{d.duty.assigneeCount}人</U.Badge>
              </U.Row>
              {d.config && (
                <>
                  {d.config.range && (
                    <>
                      <U.Text>当番の終了：{d.config.range.endDate ?? '終了日なし'}</U.Text>
                      <U.Text>担当予定：{d.config.range.plannedThrough}まで</U.Text>
                      <U.Muted>期間外の担当は「担当予定を追加」から追加できます。</U.Muted>
                    </>
                  )}
                  <U.Text>実施日：{scheduleLabel(d.config.schedule)}</U.Text>
                  <U.Text>担当の交代：{rotationLabel(d.duty, d.config.schedule)}</U.Text>
                </>
              )}
              {!!d.currentContinuations.length && (
                <U.Stack>
                  {d.currentContinuations.map(person => (
                    <U.Muted key={person.id}>{person.label}</U.Muted>
                  ))}
                </U.Stack>
              )}
              <U.Text as="h2" variant="h3">
                参加メンバー（{d.participants.length}人）
              </U.Text>
              <U.Row>
                {d.participants.map(person => (
                  <U.Badge key={person.id}>{person.label}</U.Badge>
                ))}
              </U.Row>
            </U.Stack>
          </U.Panel>
          <U.Between>
            <U.Flex flexDirection="column" gap={4}>
              <U.Text as="h2" variant="h2">
                {d.year + '年の予定'}
              </U.Text>
              <U.Muted>
                {d.from +
                  ' 〜 ' +
                  d.to +
                  (work.loading ? '' : ' · 実施予定 ' + d.scheduledCount + '件')}
              </U.Muted>
            </U.Flex>
            <U.Row style={{alignItems: 'flex-end'}}>
              <U.Button disabled={m.busy || d.year <= 1900} onClick={() => d.setYear(d.year - 1)}>
                前年
              </U.Button>
              <U.Field style={{flex: 'initial'}}>
                <U.Text>表示年</U.Text>
                <U.Select
                  aria-label="表示年"
                  value={d.year}
                  disabled={m.busy}
                  onChange={event => d.setYear(Number(event.target.value))}
                  style={{width: 110}}
                >
                  {Array.from({length: 300}, (_, index) => 1900 + index).map(year => (
                    <option key={year} value={year}>
                      {year}年
                    </option>
                  ))}
                </U.Select>
              </U.Field>
              <U.Button disabled={m.busy} onClick={d.showCurrentYear}>
                今年
              </U.Button>
              <U.Button disabled={m.busy || d.year >= 2199} onClick={() => d.setYear(d.year + 1)}>
                翌年
              </U.Button>
            </U.Row>
          </U.Between>
          {work.error && !work.dialog && <U.Alert role="alert">{work.error}</U.Alert>}
          {work.loading ? (
            <U.Empty role="status">年間予定を読み込み中…</U.Empty>
          ) : d.monthly ? (
            <DutyAnnualSchedule details={d} />
          ) : d.config ? (
            <ScheduleList m={m} work={work} />
          ) : (
            !work.error && (
              <U.Muted>以前の形式で保存された当番です。保存済みの担当期間を表示します。</U.Muted>
            )
          )}
          {d.legacyError && <U.Alert role="alert">{d.legacyError}</U.Alert>}
          <LegacySchedule m={m} assignments={d.legacy} />
        </>
      )}
      {d.exportOpen && d.config && (
        <ScheduleExportDialog config={d.config} from={d.from} to={d.to} onClose={d.closeExport} />
      )}
      {d.extensionOpen && d.config && (
        <ScheduleExtensionDialog
          config={d.config}
          onClose={d.closeExtension}
          onSaved={d.finishExtension}
        />
      )}
      {d.ruleEditorOpen && d.duty && (
        <DutyAssignmentEditor
          id={d.duty.id}
          onSaved={d.finishRuleEdit}
          onClose={d.closeRuleEditor}
        />
      )}
      <DutyMetadataDialog editor={d.editor} />
      <AutomaticScheduleDialogs m={work} today={m.today} />
      <DutyForms m={m} />
    </U.Stack>
  );
}
