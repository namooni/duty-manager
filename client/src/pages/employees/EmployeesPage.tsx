import {useEmployeeStatusChange} from '@/hooks/employees/useEmployeeStatusChange';
import {EmployeeStatusDialog} from '@/components/employees/EmployeeStatusDialog';
import * as S from './EmployeesPage.styles';
import {useEmployeeManagement} from '@/hooks/employees/useEmployeeManagement';
import {EmployeeDialogs} from '@/components/employees/EmployeeDialogs';
import {useDutyManager, type DutyManager as Manager} from '@/hooks/duties/useDutyManager';
import {DutyPageLayout} from '@/components/layouts/DutyPageLayout';
import * as U from '@/components/ui';
export function EmployeesPage() {
  const m = useDutyManager(false);
  return (
    <DutyPageLayout m={m}>
      <EmployeesPageContent m={m} />
    </DutyPageLayout>
  );
}
function EmployeesPageContent({m}: {m: Manager}) {
  const management = useEmployeeManagement();
  const statusChange = useEmployeeStatusChange();
  return (
    <>
      <EmployeeDialogs m={management} />
      <EmployeeStatusDialog m={statusChange} />
      <U.Panel style={{marginTop: 8}}>
        <U.PanelHead>
          <U.Flex flexDirection="column">
            <U.Text as="h2" variant="h2">
              チームのメンバー
            </U.Text>
            <U.Muted>
              <U.Text>
                状態変更時に今後の担当を確認します。無効化で後の担当を前に詰め、有効化で元の順序に戻します。
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
            <S.EmployeeTable>
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
                  <th>操作</th>
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
                      <S.MemberActions>
                        <U.Button
                          size="sm"
                          variant="secondary"
                          disabled={m.busy}
                          onClick={() => management.openEdit(e)}
                        >
                          編集
                        </U.Button>
                        <U.Button
                          size="sm"
                          variant={e.active ? 'warning' : 'text'}
                          disabled={m.busy}
                          onClick={() => statusChange.open(e)}
                        >
                          {e.active ? '無効にする' : '有効にする'}
                        </U.Button>
                        <U.Button
                          size="sm"
                          variant="dangerText"
                          disabled={m.busy}
                          onClick={() => management.openDelete(e)}
                        >
                          削除
                        </U.Button>
                      </S.MemberActions>
                    </td>
                  </tr>
                ))}
              </tbody>
            </S.EmployeeTable>
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
    </>
  );
}
