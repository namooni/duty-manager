import {useEffect, useId, useRef, type ReactNode} from 'react';
import styled from 'styled-components';
import Button from '../button/Button';
import Text from '../Text/Text';
import {PanelHead, PanelBody} from '../surfaces/Surfaces';
export function Modal({
  title,
  onClose,
  busy,
  children,
}: {
  title: string;
  onClose: () => void;
  busy: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [title]);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <Dialog
      ref={ref}
      aria-labelledby={id}
      onCancel={event => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <PanelHead>
        <Text as="h2" variant="h2" id={id} ref={heading} tabIndex={-1}>
          {title}
        </Text>
        <Button aria-label="閉じる" disabled={busy} onClick={onClose}>
          <Text>×</Text>
        </Button>
      </PanelHead>
      <Body>{children}</Body>
    </Dialog>
  );
}
const Dialog = styled.dialog`
  border: 1px solid ${({theme}) => theme.semantic.borderDefault};
  border-radius: ${({theme}) => theme.radius.md};
  padding: 0;
  width: min(620px, calc(100vw - 32px));
  max-height: 88vh;
  font: inherit;
  box-shadow: ${({theme}) => theme.shadow.subtle};
  color: ${({theme}) => theme.semantic.textPrimary};
  &::backdrop {
    background: ${({theme}) => theme.palette.modalBackdrop};
  }
`;

const Body = styled(PanelBody)({
  '& [role="alert"], & [role="status"]': {margin: 0},
});
