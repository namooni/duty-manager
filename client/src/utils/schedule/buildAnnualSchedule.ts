import type {WorkOccurrence} from '@/repositories/automatic/automatic.domain';
export function buildAnnualSchedule(year: number, events: readonly WorkOccurrence[]) {
  const dated = events.filter(event => event.date?.startsWith(year + '-'));
  return Array.from({length: 12}, (_, index) => ({
    month: index + 1,
    events: dated
      .filter(event => Number(event.date!.slice(5, 7)) === index + 1)
      .sort((a, b) => a.date!.localeCompare(b.date!) || a.sequence - b.sequence),
  }));
}
