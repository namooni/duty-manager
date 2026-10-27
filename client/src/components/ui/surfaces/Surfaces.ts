import styled from 'styled-components';
import Flex from '@/components/ui/layouts/Flex';
import Text from '@/components/ui/Text/Text';
export const Row = styled(Flex)`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;
export const Between = styled(Row)`
  justify-content: space-between;
`;
export const Muted = styled(Text).attrs({as: 'p'})`
  color: ${({theme}) => theme.palette.gray500};
  font-size: 13px;
`;
export const Panel = styled(Flex).attrs({as: 'section'})`
  flex-direction: column;
  background: white;
  border: 1px solid ${({theme}) => theme.palette.gray200};
  border-radius: 13px;
  overflow: hidden;
  min-width: 0;
`;
export const PanelHead = styled(Between)`
  padding: 21px 24px;
  border-bottom: 1px solid ${({theme}) => theme.palette.gray100};
  h2 {
    margin-bottom: 3px;
  }
`;
export const PanelBody = styled(Flex)`
  flex-direction: column;
  padding: 22px 24px;
`;
export const Stack = styled(Flex)`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;
export const TableWrap = styled(Flex)`
  flex-direction: column;
  width: 100%;
  overflow-x: auto;
`;
export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  white-space: nowrap;
  th {
    font-size: 11px;
    font-weight: 600;
    color: ${({theme}) => theme.palette.gray500};
    background: ${({theme}) => theme.palette.tableHeader};
    padding: 12px 23px;
  }
  td {
    padding: 17px 23px;
    border-bottom: 1px solid ${({theme}) => theme.palette.mutedSurface};
    font-size: 13px;
  }
  tbody tr:last-child td {
    border: 0;
  }
  td small {
    display: block;
    color: ${({theme}) => theme.palette.tableCaption};
    font-size: 11px;
  }
  button {
    min-height: 32px;
    padding: 5px 10px;
    font-size: 12px;
  }
`;
export const Badge = styled(Text)<{$muted?: boolean}>`
  display: inline-block;
  background: ${p => (p.$muted ? p.theme.palette.mutedSurface : p.theme.palette.green100)};
  color: ${p => (p.$muted ? p.theme.palette.gray500 : p.theme.palette.green700)};
  padding: 3px 9px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 600;
`;
export const Empty = styled(Flex)`
  align-items: center;
  flex-direction: column;
  padding: 44px 24px;
  text-align: center;
  color: ${({theme}) => theme.palette.emptyText};
  strong {
    display: block;
    color: ${({theme}) => theme.palette.textHeadingMuted};
    margin-bottom: 8px;
    font-size: 15px;
  }
  p {
    font-size: 13px;
    margin: 0 auto 18px;
    max-width: 380px;
  }
`;
export const Field = styled(Flex).attrs({as: 'label'})`
  display: flex;
  flex-direction: column;
  gap: 7px;
  color: ${({theme}) => theme.palette.fieldLabel};
  font-size: 12px;
  font-weight: 600;
  flex: 1;
  min-width: 0;
`;
export const Form = styled(Flex).attrs({as: 'form'})`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;
export const Alert = styled(Flex)<{$success?: boolean}>`
  border: 1px solid ${p => (p.$success ? p.theme.palette.successBorder : p.theme.palette.red300)};
  background: ${p => (p.$success ? p.theme.palette.successSurface : p.theme.palette.red100)};
  color: ${p => (p.$success ? p.theme.palette.successText : p.theme.palette.red700)};
  padding: 12px 16px;
  border-radius: 8px;
  margin: 16px 0;
  font-size: 13px;
`;
export const ListItem = styled(Flex)`
  flex-direction: column;
  padding: 17px 0;
  border-bottom: 1px solid ${({theme}) => theme.palette.gray100};
  &:last-child {
    border: 0;
  }
  strong {
    font-size: 13px;
  }
  small {
    font-size: 11px;
    color: ${({theme}) => theme.palette.listCaption};
  }
  .names {
    margin-top: 8px;
    display: flex;
    gap: 7px;
    flex-wrap: wrap;
  }
  .warning {
    color: ${({theme}) => theme.palette.red700};
    font-size: 12px;
    margin-top: 6px;
  }
`;
