import {useState} from 'react';
import {addDays} from '@/utils/format/date';
import {ScheduleRangeModes, useDutyUiStore} from '@/stores/duties/dutyUi.store';
export function useScheduleRange(
  today: string,
  from: string,
  to: string,
  setFrom: (value: string) => void,
  setTo: (value: string) => void,
) {
  const rangeMode = useDutyUiStore(state => state.rangeMode),
    setRangeMode = useDutyUiStore(state => state.setRangeMode);
  const [customOpen, setCustomOpen] = useState(false);
  const monthFrom = today.slice(0, 7) + '-01';
  const last = new Date(today + 'T12:00:00Z');
  last.setUTCMonth(last.getUTCMonth() + 1, 1);
  last.setUTCDate(0);
  const monthTo = last.toISOString().slice(0, 10),
    upcomingTo = addDays(today, 41);
  const isUpcoming =
    rangeMode === ScheduleRangeModes.UPCOMING && from === today && to === upcomingTo;
  const isThisMonth =
    rangeMode === ScheduleRangeModes.MONTH && from === monthFrom && to === monthTo;
  return {
    isUpcoming,
    isThisMonth,
    isCustom: !isUpcoming && !isThisMonth,
    customOpen,
    toggleCustom: () => {
      setRangeMode(ScheduleRangeModes.CUSTOM);
      setCustomOpen(open => !open);
    },
    closeCustom: () => setCustomOpen(false),
    setCustomFrom: (value: string) => {
      setFrom(value);
      setRangeMode(ScheduleRangeModes.CUSTOM);
    },
    setCustomTo: (value: string) => {
      setTo(value);
      setRangeMode(ScheduleRangeModes.CUSTOM);
    },
    showUpcoming: () => {
      setFrom(today);
      setTo(upcomingTo);
      setRangeMode(ScheduleRangeModes.UPCOMING);
      setCustomOpen(false);
    },
    showThisMonth: () => {
      setFrom(monthFrom);
      setTo(monthTo);
      setRangeMode(ScheduleRangeModes.MONTH);
      setCustomOpen(false);
    },
  };
}
