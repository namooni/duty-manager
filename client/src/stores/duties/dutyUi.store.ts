import {create} from 'zustand';
import {getTokyoToday} from '@/libs/clock';
import {addDays} from '@/utils/format/date';
type Selection = number | null;
interface DutyUiState {
  selectedId: Selection;
  from: string;
  to: string;
  rangeInitialized: boolean;
  busy: boolean;
  error: string;
  notice: string;
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
  busy: false,
  error: '',
  notice: '',
  revision: 0,
  setSelectedId: next =>
    set(state => ({selectedId: typeof next === 'function' ? next(state.selectedId) : next})),
  setFrom: from => set({from, rangeInitialized: true}),
  setTo: to => set({to, rangeInitialized: true}),
  initializeRange: (from, to) =>
    set(state => (state.rangeInitialized ? state : {from, to, rangeInitialized: true})),
  setBusy: busy => set({busy}),
  setError: error => set({error}),
  setNotice: notice => set({notice}),
  refreshData: () => set(state => ({revision: state.revision + 1})),
}));
