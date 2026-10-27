import {useLocation, useNavigate} from 'react-router-dom';
import {pagePaths} from '@/constants/navigation';
import type {Page} from '@/types/ui';
export function useAppNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const page: Page =
    location.pathname === '/employees'
      ? 'employees'
      : location.pathname === '/duties'
        ? 'duties'
        : 'schedule';
  return {page, setPage: (next: Page) => navigate(pagePaths[next])};
}
