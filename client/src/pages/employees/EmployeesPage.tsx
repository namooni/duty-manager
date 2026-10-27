import {useDutyManager, type DutyManager as Manager} from '@/hooks/duties/useDutyManager';
import {DutyPageLayout} from '@/components/layouts/DutyPageLayout';
import * as U from '@/components/ui';
export function EmployeesPage() {
  const m = useDutyManager();
  return (
    <DutyPageLayout m={m}>
      <EmployeesPageContent m={m} />
    </DutyPageLayout>
  );
}
function EmployeesPageContent({m}: {m: Manager}) {
  return (
    <U.Panel style={{marginTop: 28}}>
      <U.PanelHead>
        <U.Flex flexDirection="column">
          <U.Text as="h2" variant="h2">
            チームのメンバー
          </U.Text>
          <U.Muted>
            <U.Text>
              無効にしたメンバーは今後の自動割当の対象外になります。確定済みの予定は保持されます。
            </U.Text>
          </U.Muted>
        </U.Flex>
        <U.Badge>
          {m.employees.length}
          <U.Text> 人</U.Text>
        </U.Badge>
      </U.PanelHead>
      {m.loading ? (
        <U.Empty>
          <U.Text>読み込み中…</U.Text>
        </U.Empty>
      ) : m.employees.length ? (
        <U.TableWrap>
          <U.Table>
            <thead>
              <tr>
                <th>
                  <U.Text>社員番号</U.Text>
                </th>
                <th>
                  <U.Text>名前</U.Text>
                </th>
                <th>
                  <U.Text>参加中の当番</U.Text>
                </th>
                <th>
                  <U.Text>状態</U.Text>
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {m.employees.map(e => (
                <tr key={e.id}>
                  <td>
                    <U.Text>{e.employeeNumber}</U.Text>
                  </td>
                  <td>
                    <U.Text>{e.name}</U.Text>
                  </td>
                  <td>
                    <U.Text>{e.dutyCount}</U.Text>
                    <U.Text> 件</U.Text>
                  </td>
                  <td>
                    <U.Badge $muted={!e.active}>{e.active ? '有効' : '無効'}</U.Badge>
                  </td>
                  <td>
                    <U.Button disabled={m.busy} onClick={() => m.toggleActive(e)}>
                      {e.active ? '無効にする' : '有効にする'}
                    </U.Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </U.Table>
        </U.TableWrap>
      ) : (
        <U.Empty>
          <U.Text as="strong" style={{fontWeight: 700}}>
            メンバーがまだいません
          </U.Text>
          <U.Text as="p">社員番号と名前を登録して、チームを準備しましょう。</U.Text>
          <U.Button variant="primary" onClick={() => m.open('employee')}>
            <U.Text>メンバーを追加</U.Text>
          </U.Button>
        </U.Empty>
      )}
    </U.Panel>
  );
}
