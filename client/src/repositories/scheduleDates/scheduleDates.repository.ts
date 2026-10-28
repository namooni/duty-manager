import {scheduleDatesApi as api} from '@/apis/scheduleDates/scheduleDates.api';
import {toDateContext, toDateReview} from './scheduleDates.mapper';
import type {ScheduleDateInput} from './scheduleDates.domain';
export const scheduleDatesRepository = {
  history: async (id: number, key: string) => (await api.history(id, key)).map(h => ({...h})),
  context: async (id: number, key: string) => toDateContext(await api.context(id, key)),
  preview: async (id: number, input: ScheduleDateInput) =>
    toDateReview(await api.preview(id, {...input})),
  confirm: (id: number, input: ScheduleDateInput, token: string) =>
    api.confirm(id, {...input}, token),
};
