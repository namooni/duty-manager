import {forwardRef, type InputHTMLAttributes} from 'react';
import styled from 'styled-components';
import {controlStyles} from '../form/controlStyles';
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
  ${controlStyles}
  border-radius:${({$radius, theme}) => $radius ?? theme.radius.md};
  ${({$error, theme}) => ($error ? {'outline-color': theme.semantic.errorText, 'border-color': theme.semantic.errorText, '&:focus': {outlineColor: theme.semantic.errorText, borderColor: theme.semantic.errorText}} : {})}
`;
export default Input;
