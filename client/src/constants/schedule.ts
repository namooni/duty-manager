import type {Recurrence} from '@/repositories/automatic/automatic.domain';
export const recurrenceLabels: Readonly<Record<Recurrence, string>> = {
  WORKDAYS: '会社の勤務日（月〜金）',
  WEEKLY: '毎週、曜日を指定',
  DAILY_INTERVAL: '何日かおき',
  MONTHLY_DAY: '毎月、日にちを指定',
  MONTHLY_NTH_WEEKDAY: '毎月、第○曜日を指定',
  EXPLICIT_DATES: '開催日を個別に指定',
};
export const weekdayLabels = ['月', '火', '水', '木', '金', '土', '日'] as const;
