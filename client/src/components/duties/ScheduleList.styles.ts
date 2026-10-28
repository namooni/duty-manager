import {schedulePhaseStyles} from './SchedulePhase.styles';
import type {SchedulePhase} from '@/utils/schedule/schedulePhase';
import styled from 'styled-components';
import {Flex, Table, Text, ItemActionRow} from '@/components/ui';
export const ScheduleTable = styled(Table)({
  tableLayout: 'fixed',
  minWidth: 940,
  '& th:nth-child(1)': {width: '26%'},
  '& th:nth-child(2)': {width: '23%'},
  '& th:nth-child(3)': {width: '37%'},
  '& th:nth-child(4)': {width: '14%'},
});
export const CellContent = styled(Flex)({
  flexDirection: 'column',
  gap: 8,
  minWidth: 0,
  whiteSpace: 'normal',
  overflowWrap: 'anywhere',
  alignItems: 'stretch',
  '& > button': {alignSelf: 'flex-start'},
});
export const DutyTitle = styled(Text)({fontWeight: 600});

export const AssigneeRow = styled(ItemActionRow).attrs({$actionWidth: '112px'})({maxWidth: 284});

export const ScheduleRow = styled.tr<{$phase: SchedulePhase}>`
  ${schedulePhaseStyles}
`;
