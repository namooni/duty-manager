import styled from 'styled-components';
import * as U from '@/components/ui';
export const OverviewGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(300px, 1fr);
  gap: 28px;
  align-items: start;
  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;
export const Paper = styled(U.Flex).attrs({as: 'section'})`
  flex-direction: column;
  min-width: 0;
  background: ${({theme}) => theme.palette.white};
  border: 1px solid ${({theme}) => theme.palette.boardLine};
  border-radius: 10px;
`;
export const TodayHeader = styled(U.Row)`
  padding: 28px 30px;
  gap: 24px;
  border-bottom: 1px solid ${({theme}) => theme.palette.boardLine};
  @media (max-width: 600px) {
    padding: 22px;
    gap: 18px;
  }
`;
export const DateStamp = styled(U.Flex)`
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  border-right: 1px solid ${({theme}) => theme.palette.boardLine};
  padding-right: 24px;
  .month {
    font-size: 11px;
    letter-spacing: 0.06em;
    color: ${({theme}) => theme.palette.boardMuted};
  }
  .day {
    font-size: 46px;
    font-weight: 650;
    letter-spacing: -0.06em;
    line-height: 1.15;
    color: ${({theme}) => theme.palette.boardInk};
    font-variant-numeric: tabular-nums;
  }
  .weekday {
    font-size: 12px;
    color: ${({theme}) => theme.palette.boardMuted};
  }
`;
export const Heading = styled(U.Text).attrs({as: 'h2'})`
  color: ${({theme}) => theme.palette.boardInk};
  font-size: 24px;
  font-weight: 650;
  letter-spacing: -0.025em;
`;
export const Caption = styled(U.Text)`
  font-size: 12px;
  color: ${({theme}) => theme.palette.boardMuted};
`;
export const TodayRow = styled(U.Flex)`
  flex-direction: column;
  gap: 10px;
  padding: 24px 30px;
  border-bottom: 1px solid ${({theme}) => theme.palette.gray100};
  &:last-child {
    border-bottom: 0;
  }
  @media (max-width: 600px) {
    padding: 20px 22px;
  }
`;
export const DutyName = styled(U.Text)`
  font-size: 14px;
  font-weight: 600;
  color: ${({theme}) => theme.palette.boardMuted};
`;
export const PersonName = styled(U.Text)`
  font-size: 24px;
  font-weight: 650;
  letter-spacing: 0.02em;
  color: ${({theme}) => theme.palette.boardInk};
`;
export const SectionHead = styled(U.Between)`
  padding: 20px 24px;
  border-bottom: 1px solid ${({theme}) => theme.palette.boardLine};
  h2 {
    font-size: 15px;
    font-weight: 650;
    color: ${({theme}) => theme.palette.boardInk};
  }
`;
export const UpcomingRow = styled(U.Flex)`
  padding: 17px 24px;
  gap: 18px;
  align-items: flex-start;
  border-bottom: 1px solid ${({theme}) => theme.palette.gray100};
  &:last-child {
    border-bottom: 0;
  }
  .when {
    width: 72px;
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
    font-size: 12px;
    color: ${({theme}) => theme.palette.boardMuted};
  }
  .names {
    font-size: 15px;
    font-weight: 600;
    color: ${({theme}) => theme.palette.boardInk};
  }
`;
export const Kind = styled(U.Text)`
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: ${({theme}) => theme.palette.boardAccent};
`;
export const Attention = styled(U.Flex).attrs({as: 'section'})`
  flex-direction: column;
  gap: 14px;
  padding: 20px 24px;
  border-left: 2px solid ${({theme}) => theme.palette.boardLine};
  h2 {
    font-size: 14px;
    font-weight: 650;
    color: ${({theme}) => theme.palette.boardInk};
  }
`;
export const AttentionCount = styled(U.Text)`
  font-size: 11px;
  line-height: 20px;
  min-width: 20px;
  text-align: center;
  border-radius: 4px;
  background: ${({theme}) => theme.palette.boardWarningSoft};
  color: ${({theme}) => theme.palette.boardWarning};
`;
export const AttentionItem = styled(U.Flex)`
  flex-direction: column;
  gap: 4px;
  .reason {
    font-size: 12px;
    color: ${({theme}) => theme.palette.boardWarning};
  }
`;
