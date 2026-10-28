import styled from 'styled-components';
import {Alert} from '../surfaces/Surfaces';
import Text from '../Text/Text';
import Button from '../button/Button';
export function NoticeToast({message, onClose}: {message: string; onClose: () => void}) {
  if (!message) return null;
  return (
    <Toast $success role="status">
      <Text>{message}</Text>
      <Button size="sm" variant="text" aria-label="通知を閉じる" onClick={onClose}>
        ×
      </Button>
    </Toast>
  );
}
const Toast = styled(Alert)(props => ({
  position: 'fixed',
  right: 24,
  bottom: 24,
  zIndex: 1000,
  width: 'min(480px, calc(100vw - 32px))',
  margin: 0,
  display: 'grid',
  gridTemplateColumns: 'minmax(0,1fr) auto',
  gap: 12,
  alignItems: 'center',
  boxShadow: props.theme.shadow.subtle,
  '@media(max-width:600px)': {right: 16, bottom: 16},
}));
