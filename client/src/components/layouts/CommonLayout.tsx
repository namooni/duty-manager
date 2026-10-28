import {pageTitles} from '@/constants/navigation';
import type {Page} from '@/types/ui';
import {useGlobalNoticeTimeout} from '@/hooks/common/useGlobalNoticeTimeout';
import {Outlet} from 'react-router-dom';
import {useAppNavigation} from '@/hooks/navigation/useAppNavigation';
import * as U from '@/components/ui';
import * as S from './CommonLayout.styles';
export function CommonLayout() {
  const navigation = useAppNavigation();
  const feedback = useGlobalNoticeTimeout();
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
          {(['home', 'schedule', 'duties', 'employees'] as const satisfies readonly Page[]).map(
            page => (
              <S.NavButton
                key={page}
                $active={navigation.page === page}
                aria-current={navigation.page === page ? 'page' : undefined}
                onClick={() => navigation.setPage(page)}
              >
                <U.Text>{pageTitles[page]}</U.Text>
              </S.NavButton>
            ),
          )}
        </S.Navigation>
        <S.SideNote>
          <U.Text>日付は日本時間で表示</U.Text>
        </S.SideNote>
      </S.Sidebar>
      <S.Main>
        <Outlet />
      </S.Main>
      <U.NoticeToast message={feedback.notice} onClose={feedback.dismiss} />
    </S.Shell>
  );
}
