import type {Page} from '@/types/ui';
export const pagePaths: Record<Page, string> = {
  home: '/',
  schedule: '/schedule',
  duties: '/duties',
  employees: '/employees',
};
export const pageTitles: Record<Page, string> = {
  home: 'ホーム',
  schedule: '予定一覧',
  duties: '当番の設定',
  employees: 'メンバー',
};
