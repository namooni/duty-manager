import styled from 'styled-components';
import Flex from '@/components/ui/layouts/Flex';
import BaseButton from '@/components/ui/foundation/BaseButton';
export const Shell = styled.div(props => ({
  display: 'grid',
  gridTemplateColumns: '188px minmax(0, 1fr)',
  minHeight: '100vh',
  background: props.theme.palette.boardPaper,
  '@media (max-width:900px)': {gridTemplateColumns: '1fr'},
}));
export const Sidebar = styled(Flex).attrs({as: 'aside'})(props => ({
  position: 'sticky',
  top: 0,
  height: '100dvh',
  flexDirection: 'column',
  gap: 28,
  padding: '24px 16px',
  borderRight: '1px solid ' + props.theme.palette.boardLine,
  '@media (max-width:900px)': {
    position: 'static',
    height: 'auto',
    padding: '16px 20px',
    gap: 18,
    borderRight: 0,
    borderBottom: '1px solid ' + props.theme.palette.boardLine,
  },
}));
export const Brand = styled(Flex)(props => ({
  flexDirection: 'column',
  fontSize: 20,
  fontWeight: 700,
  letterSpacing: '-.04em',
  color: props.theme.palette.boardInk,
  small: {
    display: 'block',
    fontSize: 11,
    fontWeight: 400,
    letterSpacing: '.03em',
    color: props.theme.palette.boardMuted,
    marginTop: 3,
  },
}));
export const Navigation = styled(Flex).attrs({as: 'nav'})({
  flexDirection: 'column',
  gap: 6,
  '@media (max-width:900px)': {flexDirection: 'row', flexWrap: 'wrap'},
});
export const NavButton = styled(BaseButton)<{$active: boolean}>(props => ({
  textAlign: 'left',
  padding: '10px 12px',
  border: 0,
  borderLeft: '2px solid ' + (props.$active ? props.theme.palette.boardAccent : 'transparent'),
  borderRadius: props.theme.radius.sm,
  fontSize: 13,
  fontWeight: props.$active ? 650 : 400,
  color: props.$active ? props.theme.palette.boardInk : props.theme.palette.boardMuted,
  background: props.$active ? props.theme.palette.white : 'transparent',
  '&:hover': {background: props.theme.palette.boardAccentSoft},
}));
export const SideNote = styled(Flex)(props => ({
  marginTop: 'auto',
  fontSize: 11,
  color: props.theme.palette.boardMuted,
  '@media (max-width:900px)': {display: 'none'},
}));
export const Main = styled(Flex).attrs({as: 'main'})({
  flexDirection: 'column',
  padding: '24px 28px 36px',
  maxWidth: 1500,
  width: '100%',
  minWidth: 0,
  margin: '0 auto',
  '@media (max-width:1100px)': {padding: '22px 20px'},
  '@media (max-width:600px)': {padding: '20px 16px'},
});
