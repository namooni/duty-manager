import {useDutyManager, type DutyManager as Manager} from '@/hooks/duties/useDutyManager';
import {DutyPageLayout} from '@/components/layouts/DutyPageLayout';
import {useDutyCatalog} from '@/hooks/duties/useDutyCatalog';
import {strategyLabel} from '@/constants/duties';
import * as U from '@/components/ui';
import * as S from './DutiesPage.styles';
export function DutiesPage() {
  const m = useDutyManager();
  return (
    <DutyPageLayout m={m}>
      <DutiesPageContent m={m} />
    </DutyPageLayout>
  );
}
function DutiesPageContent({m}: {m: Manager}) {
  const catalog = useDutyCatalog(m);
  return (
    <>
      {catalog.error && <U.Alert role="alert">{catalog.error}</U.Alert>}
      <U.Muted style={{marginTop: 16}}>
        <U.Text>実施する日と、担当者が交代するルールを別々に設定できます。</U.Text>
      </U.Muted>
      {m.loading || catalog.loading ? (
        <U.Empty>
          <U.Text>読み込み中…</U.Text>
        </U.Empty>
      ) : m.duties.length ? (
        <S.Cards>
          {catalog.rows.map(d => (
            <U.Panel key={d.id}>
              <S.DutyCard>
                <U.Badge>{d.rotationText}</U.Badge>
                <U.Text as="h2" variant="h2">
                  {d.name}
                </U.Text>
                <U.Text>{d.scheduleText}</U.Text>
                <U.Muted>{d.description || '説明は登録されていません。'}</U.Muted>
                <U.Flex flexDirection="column" className="members">
                  {d.memberNames}
                </U.Flex>
                <U.Muted>
                  <U.Text>開始日：</U.Text>
                  {d.anchorDate}
                  <br />
                  {strategyLabel[d.strategy]}
                  <U.Text> / 各</U.Text>
                  {d.assigneeCount}
                  <U.Text>人</U.Text>
                </U.Muted>
                <U.Button
                  style={{marginTop: 18}}
                  onClick={() => {
                    m.showDuty(d.id);
                  }}
                >
                  <U.Text>予定を確認 →</U.Text>
                </U.Button>
              </S.DutyCard>
            </U.Panel>
          ))}
        </S.Cards>
      ) : (
        <U.Empty>
          <U.Text as="strong" style={{fontWeight: 700}}>
            チームの当番を作りましょう
          </U.Text>
          <U.Text as="p">朝会の司会、議事録、ゴミ出しなど、好きな名前で登録できます。</U.Text>
          <U.Button variant="primary" onClick={() => m.open('duty')}>
            <U.Text>最初の当番を作成</U.Text>
          </U.Button>
        </U.Empty>
      )}
    </>
  );
}
