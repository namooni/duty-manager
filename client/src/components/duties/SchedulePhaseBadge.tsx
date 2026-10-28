import type {schedulePhase} from '@/utils/schedule/schedulePhase';
import * as U from '@/components/ui';
export function SchedulePhaseBadge({phase}: {phase: ReturnType<typeof schedulePhase>}) {
  return phase.label ? <U.Badge $muted={phase.state === 'PAST'}>{phase.label}</U.Badge> : null;
}
