import type {ScheduleRule} from '@/repositories/automatic/automatic.domain';
import type {DutyInput} from '@/repositories/duties/duties.domain';
import {weekdayLabels} from '@/constants/schedule';
import {unitLabel} from '@/constants/duties';
export function scheduleLabel(r: ScheduleRule) {
  switch (r.recurrence) {
    case 'WORKDAYS':
      return '会社の勤務日（月〜金・休業日を除く）';
    case 'WEEKLY':
      return '毎週' + r.weekdays.map(day => weekdayLabels[day - 1]).join('・') + '曜日';
    case 'DAILY_INTERVAL':
      return r.everyDays + '日おきに実施';
    case 'MONTHLY_DAY':
      return r.monthDay === 0 ? '毎月末日' : '毎月' + r.monthDay + '日';
    case 'MONTHLY_NTH_WEEKDAY':
      return (
        '毎月' +
        (r.monthOrdinal === 0 ? '最終' : '第' + r.monthOrdinal) +
        weekdayLabels[r.weekday - 1] +
        '曜日'
      );
    case 'EXPLICIT_DATES':
      return '開催日を回ごとに指定';
  }
}
export function rotationLabel(d: DutyInput, r: ScheduleRule) {
  return r.rotationMode === 'OCCURRENCE'
    ? '実施1回ごとに交代'
    : d.intervalCount + unitLabel[d.intervalUnit] + 'ごとに交代';
}
