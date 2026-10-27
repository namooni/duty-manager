import styled from 'styled-components';
import {PanelBody} from '@/components/ui';
export const Cards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 24px;
`;
export const DutyCard = styled(PanelBody)`
  h2 {
    margin: 12px 0 8px;
  }
  p {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .members {
    border-top: 1px solid ${({theme}) => theme.palette.gray100};
    margin: 18px 0;
    padding-top: 15px;
    font-size: 12px;
    color: ${({theme}) => theme.palette.memberText};
  }
`;
