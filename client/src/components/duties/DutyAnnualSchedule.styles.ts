import {schedulePhaseStyles} from './SchedulePhase.styles';
import type {SchedulePhase} from '@/utils/schedule/schedulePhase';
import styled from 'styled-components';
import {Panel, Flex} from '@/components/ui';
export const Grid = styled.div({
  display: 'grid',
  gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
  gap: 12,
  '@media(max-width:1100px)': {gridTemplateColumns: 'repeat(2,minmax(0,1fr))'},
  '@media(max-width:600px)': {gridTemplateColumns: '1fr'},
});
export const Month = styled(Panel)({padding: 16, minWidth: 0});
export const Entry = styled(Flex)<{$phase: SchedulePhase}>`
  flex-direction: column;
  gap: 8px;
  padding: 12px 8px;
  border-bottom: 1px solid ${p => p.theme.semantic.borderDefault};
  &:last-child {
    border-bottom: 0;
  }
  ${schedulePhaseStyles}
`;
