import {forwardRef, type InputHTMLAttributes} from 'react';
import styled from 'styled-components';
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  radius?: string;
}
const Input = forwardRef<HTMLInputElement, InputProps>(({error, radius, ...props}, ref) => (
  <Element
    {...props}
    ref={ref}
    $error={error}
    $radius={radius}
    aria-invalid={error || props['aria-invalid']}
  />
));
Input.displayName = 'Input';
const Element = styled.input<{$error?: boolean; $radius?: string}>`
  width: 100%;
  min-height: 42px;
  padding: 10px 12px;
  border: 1px solid ${({theme}) => theme.semantic.borderDefault};
  background: ${({theme}) => theme.semantic.surfacePrimary};
  border-radius: ${({$radius, theme}) => $radius ?? theme.radius.md};
  color: ${({theme}) => theme.semantic.textPrimary};
  font: inherit;
  font-weight: 400;
  outline: 1px solid ${({$error, theme}) => ($error ? theme.semantic.errorText : 'transparent')};
  outline-offset: -1px;
  transition:
    outline-color 0.15s ease,
    border-color 0.15s ease;
  &::placeholder {
    color: ${({theme}) => theme.semantic.textTertiary};
  }
  &:focus {
    outline-color: ${({theme}) => theme.palette.black};
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;
export default Input;
