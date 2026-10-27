import {Outlet} from 'react-router-dom';
import {useAppNavigation} from '@/hooks/navigation/useAppNavigation';
import * as U from '@/components/ui';
import * as S from './CommonLayout.styles';
export function CommonLayout() {
  const navigation = useAppNavigation();
  return (
    <S.Shell>
      <S.Sidebar>
        <S.Brand>
          <U.Flex flexDirection="column">
            <U.Text>つぎばん</U.Text>
            <U.Text as="small">社内の当番管理</U.Text>
          </U.Flex>
        </S.Brand>
        <S.Navigation aria-label="メインメニュー">
          <S.NavButton
            $active={navigation.page === 'schedule'}
            aria-current={navigation.page === 'schedule' ? 'page' : undefined}
            onClick={() => navigation.setPage('schedule')}
          >
            <U.Text>ホーム</U.Text>
          </S.NavButton>
          <S.NavButton
            $active={navigation.page === 'duties'}
            aria-current={navigation.page === 'duties' ? 'page' : undefined}
            onClick={() => navigation.setPage('duties')}
          >
            <U.Text>当番の設定</U.Text>
          </S.NavButton>
          <S.NavButton
            $active={navigation.page === 'employees'}
            aria-current={navigation.page === 'employees' ? 'page' : undefined}
            onClick={() => navigation.setPage('employees')}
          >
            <U.Text>メンバー</U.Text>
          </S.NavButton>
        </S.Navigation>
        <S.SideNote>
          <U.Text>日付は日本時間で表示</U.Text>
        </S.SideNote>
      </S.Sidebar>
      <S.Main>
        <Outlet />
      </S.Main>
    </S.Shell>
  );
}
