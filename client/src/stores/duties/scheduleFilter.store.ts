import {create} from 'zustand';
type ScheduleFilterState = {
  dutyId: string;
  exactDuty: boolean;
  focusDuty: (id: number) => void;
  personId: string;
  personQuery: string;
  setDutyId: (id: string) => void;
  setPersonId: (id: string) => void;
  setPersonQuery: (query: string) => void;
  reset: () => void;
};
const empty = {exactDuty: false, dutyId: '', personId: '', personQuery: ''};
export const useScheduleFilterStore = create<ScheduleFilterState>(set => ({
  ...empty,
  setDutyId: dutyId => set({dutyId, exactDuty: false}),
  focusDuty: id => set({...empty, dutyId: String(id), exactDuty: true}),
  setPersonId: personId => set({personId, personQuery: ''}),
  setPersonQuery: personQuery => set({personQuery, personId: ''}),
  reset: () => set(empty),
}));
