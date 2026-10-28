import {css} from 'styled-components';
import type {SchedulePhase} from '@/utils/schedule/schedulePhase';
export const schedulePhaseStyles = css<{$phase: SchedulePhase}>`
  background: ${p => (p.$phase === 'PAST' ? p.theme.semantic.surfaceSecondary : p.theme.semantic.surfacePrimary)};
  ${p =>
    p.$phase === 'PAST' &&
    css`
      color: ${p.theme.semantic.textSecondary};
      & span,
      & strong {
        color: ${p.theme.semantic.textSecondary};
      }
    `}
  ${p =>
    p.$phase === 'CURRENT' &&
    css`
      box-shadow: inset 3px 0 0 ${p.theme.semantic.textPrimary};
    `}
`;
