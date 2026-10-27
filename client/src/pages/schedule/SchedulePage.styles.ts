import styled from 'styled-components';
import * as U from '@/components/ui';
export const ScheduleSection = styled(U.Flex).attrs({as: 'section'})`
  flex-direction: column;
  margin-top: 40px;
  gap: 16px;
  min-width: 0;
`;
export const Toolbar = styled(U.Between)`
  gap: 16px;
  h2 {
    font-size: 18px;
    font-weight: 650;
    letter-spacing: -0.02em;
  }
`;
export const RangeText = styled(U.Text)(props => ({
  fontSize: 12,
  color: props.theme.palette.boardMuted,
  fontVariantNumeric: 'tabular-nums',
}));
export const Filters = styled(U.Row)(props => ({
  padding: '18px 20px',
  background: props.theme.palette.white,
  border: '1px solid ' + props.theme.palette.boardLine,
  borderRadius: 8,
  alignItems: 'end',
}));
