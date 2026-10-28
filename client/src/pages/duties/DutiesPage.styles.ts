import styled from 'styled-components';
import {PanelBody, Flex} from '@/components/ui';
export const Cards = styled.div({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,300px),1fr))',
  gap: 16,
  marginTop: 16,
  alignItems: 'stretch',
});
export const DutyCard = styled(PanelBody)({
  height: '100%',
  padding: 20,
  gap: 16,
  minWidth: 0,
  overflowWrap: 'anywhere',
});
export const CardContent = styled(Flex)({
  flexDirection: 'column',
  gap: 8,
  minWidth: 0,
  '& h2': {margin: 0},
  '& > :first-child': {alignSelf: 'flex-start'},
});
export const Members = styled(Flex)(props => ({
  flexDirection: 'column',
  gap: 4,
  borderTop: '1px solid ' + props.theme.semantic.borderDefault,
  paddingTop: 12,
  marginTop: 4,
  fontSize: 12,
  color: props.theme.palette.memberText,
}));
export const CardActions = styled.div(props => ({
  display: 'grid',
  gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
  gap: 8,
  marginTop: 'auto',
  paddingTop: 16,
  borderTop: '1px solid ' + props.theme.semantic.borderDefault,
  '& > button': {minWidth: 0},
  '& > button:last-child': {gridColumn: '1 / -1', justifySelf: 'end'},
}));
