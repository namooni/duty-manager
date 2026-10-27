import styled from 'styled-components';
import BaseButton from '../foundation/BaseButton';
import {variantSizes, variantStyles} from './theme';
import type {ButtonSize, ButtonVariant} from './types';
export interface ButtonProps {
  size?: ButtonSize;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  radius?: string;
}
const Button = styled(BaseButton).withConfig({
  shouldForwardProp: prop => !['size', 'variant', 'fullWidth', 'radius'].includes(prop),
})<ButtonProps>`
  border: 1px solid;
  font-weight: 600;
  width: ${({fullWidth}) => (fullWidth ? '100%' : 'auto')};
  border-radius: ${({radius, theme}) => radius ?? theme.radius.md};
  ${({size = 'md'}) => variantSizes[size]}
  ${({variant = 'secondary'}) => variantStyles[variant]}
`;
export default Button;
