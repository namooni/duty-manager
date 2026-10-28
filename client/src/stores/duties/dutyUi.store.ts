import {create} from 'zustand';
import {getTokyoToday} from '@/libs/clock';
import {addDays} from '@/utils/format/date';
export const ScheduleRangeModes = {UPCOMING: 'upcoming', MONTH: 'month', CUSTOM: 'custom'} as const;
export type ScheduleRangeMode = (typeof ScheduleRangeModes)[keyof typeof ScheduleRangeModes];
type Selection = number | null;
interface DutyUiState {
  selectedId: Selection;
  from: string;
  to: string;
  rangeInitialized: boolean;
  rangeMode: ScheduleRangeMode;
  setRangeMode: (mode: ScheduleRangeMode) => void;
  busy: boolean;
  error: string;
  notice: string;
  noticeVersion: number;
  revision: number;
  setSelectedId: (next: Selection | ((previous: Selection) => Selection)) => void;
  setFrom: (from: string) => void;
  setTo: (to: string) => void;
  initializeRange: (from: string, to: string) => void;
  setBusy: (busy: boolean) => void;
  setError: (error: string) => void;
  setNotice: (notice: string) => void;
  refreshData: () => void;
}
const today = getTokyoToday();
export const useDutyUiStore = create<DutyUiState>(set => ({
  selectedId: null,
  from: today,
  to: addDays(today, 41),
  rangeInitialized: false,
  rangeMode: ScheduleRangeModes.UPCOMING,
  setRangeMode: rangeMode => set({rangeMode, rangeInitialized: true}),
  busy: false,
  error: '',
  notice: '',
  noticeVersion: 0,
  revision: 0,
  setSelectedId: next =>
    set(state => ({selectedId: typeof next === 'function' ? next(state.selectedId) : next})),
  setFrom: from => set({from, rangeInitialized: true, rangeMode: ScheduleRangeModes.CUSTOM}),
  setTo: to => set({to, rangeInitialized: true, rangeMode: ScheduleRangeModes.CUSTOM}),
  initializeRange: (from, to) =>
    set(state =>
      state.rangeInitialized
        ? state
        : {from, to, rangeInitialized: true, rangeMode: ScheduleRangeModes.UPCOMING},
    ),
  setBusy: busy => set({busy}),
  setError: error => set({error}),
  setNotice: notice => set(state => ({notice, noticeVersion: state.noticeVersion + 1})),
  refreshData: () => set(state => ({revision: state.revision + 1})),
}));
