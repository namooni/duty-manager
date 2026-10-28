import {css} from 'styled-components';
export const controlStyles = css`
  width: 100%;
  min-height: 36px;
  padding: 7px 10px;
  font: inherit;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
  border: 1px solid ${({theme}) => theme.semantic.borderDefault};
  background: ${({theme}) => theme.semantic.surfacePrimary};
  color: ${({theme}) => theme.semantic.textPrimary};
  border-radius: ${({theme}) => theme.radius.md};
  outline: 1px solid transparent;
  outline-offset: -1px;
  transition:
    outline-color 0.12s ease,
    border-color 0.12s ease;
  &::placeholder {
    color: ${({theme}) => theme.semantic.textTertiary};
  }
  &:focus {
    outline-color: ${({theme}) => theme.semantic.focus};
    border-color: ${({theme}) => theme.semantic.focus};
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;
