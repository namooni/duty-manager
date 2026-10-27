import styled from 'styled-components';
const BaseButton = styled.button.attrs(({type}) => ({type: type ?? 'button'}))`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  appearance: none;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  padding: 0;
  border-radius: ${({theme}) => theme.radius.md};
  cursor: pointer;
  user-select: none;
  vertical-align: middle;
  transition:
    opacity 0.1s ease-in-out,
    background-color 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
  &:active:not(:disabled) {
    opacity: 0.7;
  }
`;
export default BaseButton;
