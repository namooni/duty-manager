import {addDays} from '@/utils/format/date';
export function useScheduleRange(
  today: string,
  from: string,
  to: string,
  setFrom: (value: string) => void,
  setTo: (value: string) => void,
) {
  const monthFrom = today.slice(0, 7) + '-01';
  const last = new Date(today + 'T12:00:00Z');
  last.setUTCMonth(last.getUTCMonth() + 1, 1);
  last.setUTCDate(0);
  const monthTo = last.toISOString().slice(0, 10),
    upcomingTo = addDays(today, 41);
  return {
    isUpcoming: from === today && to === upcomingTo,
    isThisMonth: from === monthFrom && to === monthTo,
    showUpcoming: () => {
      setFrom(today);
      setTo(upcomingTo);
    },
    showThisMonth: () => {
      setFrom(monthFrom);
      setTo(monthTo);
    },
  };
}
