import type {Page} from '@/types/ui';
export const pagePaths: Record<Page, string> = {
  schedule: '/',
  duties: '/duties',
  employees: '/employees',
};
export const pageTitles: Record<Page, string> = {
  schedule: 'ホーム',
  duties: '当番の設定',
  employees: 'メンバー',
};
