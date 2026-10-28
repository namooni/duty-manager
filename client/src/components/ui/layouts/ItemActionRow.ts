import styled from 'styled-components';
/** A readable label and a stable trailing action column, without truncating names. */
export const ItemActionRow = styled.div<{$actionWidth?: string}>(props => ({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) ' + (props.$actionWidth ?? 'max-content'),
  alignItems: 'center',
  columnGap: 12,
  rowGap: 8,
  minWidth: 0,
  width: '100%',
  '& > :first-child': {minWidth: 0, whiteSpace: 'normal', overflowWrap: 'anywhere'},
  '& > button': {justifySelf: 'end', ...(props.$actionWidth ? {width: '100%'} : {})},
}));
