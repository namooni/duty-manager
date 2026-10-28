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
  background: ${({theme}) => theme.semantic.surfacePrimary};
  border: 1px solid ${({theme}) => theme.palette.gray200};
  border-radius: ${({theme}) => theme.radius.md};
  overflow: hidden;
  min-width: 0;
`;
export const PanelHead = styled(Between)`
  padding: 12px 16px;
  border-bottom: 1px solid ${({theme}) => theme.palette.gray100};
  h2 {
    margin-bottom: 3px;
  }
`;
export const PanelBody = styled(Flex)`
  flex-direction: column;
  gap: 16px;
  padding: 16px;
`;
export const Stack = styled(Flex)`
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  font-variant-numeric: tabular-nums;
  th {
    text-transform: uppercase;
    letter-spacing: 0.02em;
    font-size: 11px;
    font-weight: 600;
    color: ${({theme}) => theme.palette.gray500};
    background: ${({theme}) => theme.palette.tableHeader};
    padding: 12px 16px;
  }
  td {
    padding: 14px 16px;
    vertical-align: top;
    border-bottom: 1px solid ${({theme}) => theme.palette.mutedSurface};
    font-size: 13px;
  }
  tbody tr:hover {
    background: ${({theme}) => theme.palette.subtle};
  }
  tbody tr:last-child td {
    border: 0;
  }
  td small {
    display: block;
    color: ${({theme}) => theme.palette.tableCaption};
    font-size: 11px;
  }
`;
export const Badge = styled(Text)<{$muted?: boolean}>`
  display: inline-block;
  background: ${p => (p.$muted ? p.theme.palette.subtle : p.theme.palette.surface)};
  color: ${p => (p.$muted ? p.theme.palette.textMuted : p.theme.palette.textMain)};
  padding: 2px 6px;
  border: 1px solid ${({theme}) => theme.palette.border};
  border-radius: ${({theme}) => theme.radius.sm};
  font-size: 11px;
  font-weight: 600;
`;
export const Empty = styled(Flex)`
  align-items: center;
  flex-direction: column;
  padding: 24px 16px;
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
  gap: 6px;
  color: ${({theme}) => theme.palette.fieldLabel};
  font-size: 12px;
  font-weight: 600;
  flex: 1;
  min-width: 0;
`;
export const Form = styled(Flex).attrs({as: 'form'})`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;
export const Alert = styled(Flex)<{$success?: boolean}>`
  border: 1px solid ${p => (p.$success ? p.theme.palette.successBorder : p.theme.palette.red300)};
  background: ${p => (p.$success ? p.theme.palette.successSurface : p.theme.palette.red100)};
  color: ${p => (p.$success ? p.theme.palette.successText : p.theme.palette.red700)};
  padding: 10px 12px;
  border-radius: ${({theme}) => theme.radius.md};
  margin: 12px 0;
  font-size: 13px;
`;
export const ListItem = styled(Flex)`
  flex-direction: column;
  gap: 6px;
  padding: 12px 0;
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
    gap: 6px;
    flex-wrap: wrap;
  }
  .warning {
    color: ${({theme}) => theme.palette.red700};
    font-size: 12px;
    margin-top: 6px;
  }
`;
