import styled from 'styled-components';
import * as U from '@/components/ui';
export const OverviewGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(300px, 1fr);
  gap: 16px;
  align-items: start;
  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;
export const Paper = styled(U.Flex).attrs({as: 'section'})`
  flex-direction: column;
  min-width: 0;
  background: ${({theme}) => theme.palette.white};
  border: 1px solid ${({theme}) => theme.palette.boardLine};
  border-radius: ${({theme}) => theme.radius.md};
`;
export const TodayHeader = styled(U.Between)`
  padding: 16px 20px;
  gap: 16px;
  border-bottom: 1px solid ${({theme}) => theme.palette.boardLine};
  @media (max-width: 600px) {
    padding: 16px;
    gap: 12px;
  }
`;
export const Heading = styled(U.Text).attrs({as: 'h2'})`
  color: ${({theme}) => theme.palette.boardInk};
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.025em;
`;
export const Caption = styled(U.Text)`
  font-size: 12px;
  color: ${({theme}) => theme.palette.boardMuted};
`;
export const TodayRow = styled(U.Flex)`
  flex-direction: column;
  gap: 10px;
  padding: 20px;
  border-bottom: 1px solid ${({theme}) => theme.palette.gray100};
  &:last-child {
    border-bottom: 0;
  }
  @media (max-width: 600px) {
    padding: 14px 16px;
  }
`;
export const DutyName = styled(U.Text)`
  font-size: 16px;
  font-weight: 650;
  color: ${({theme}) => theme.palette.textMain};
`;
export const PersonName = styled(U.Text)`
  font-size: 28px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: 0.02em;
  color: ${({theme}) => theme.palette.boardInk};
`;
export const SectionHead = styled(U.Between)`
  padding: 14px 16px;
  border-bottom: 1px solid ${({theme}) => theme.palette.boardLine};
  h2 {
    font-size: 15px;
    font-weight: 650;
    color: ${({theme}) => theme.palette.boardInk};
  }
`;
export const UpcomingRow = styled(U.Flex)`
  padding: 12px 16px;
  gap: 12px;
  align-items: flex-start;
  border-bottom: 1px solid ${({theme}) => theme.palette.gray100};
  &:last-child {
    border-bottom: 0;
  }
  .when {
    width: 72px;
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
    font-size: 14px;
    font-weight: 600;
    color: ${({theme}) => theme.palette.textMain};
  }
  .names {
    font-size: 20px;
    font-weight: 700;
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
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid ${({theme}) => theme.palette.boardLine};
  border-radius: ${({theme}) => theme.radius.md};
  background: ${({theme}) => theme.palette.surface};
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
  font-variant-numeric: tabular-nums;
  border: 1px solid ${({theme}) => theme.palette.accent};
  text-align: center;
  border-radius: 4px;
  background: ${({theme}) => theme.palette.boardWarningSoft};
  color: ${({theme}) => theme.palette.textMain};
`;
export const AttentionItem = styled(U.Flex)`
  flex-direction: column;
  gap: 4px;
  .reason {
    font-size: 12px;
    color: ${({theme}) => theme.palette.textMain};
  }
`;

export const PreviousName = styled(U.Text)`
  font-size: 14px;
  color: ${({theme}) => theme.palette.textMuted};
`;
export const HandoverArrow = styled(U.Text)`
  font-size: 18px;
  color: ${({theme}) => theme.palette.textMain};
`;
