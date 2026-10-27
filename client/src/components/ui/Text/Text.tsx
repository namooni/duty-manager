import styled from 'styled-components';
import {variantStyles} from './theme';
import type {TextVariant} from './types';
export interface TextProps {
  variant?: TextVariant;
  color?: string;
  selectable?: boolean;
  lineClamp?: number;
}
const Text = styled.span.withConfig({
  shouldForwardProp: prop => !['variant', 'color', 'selectable', 'lineClamp'].includes(prop),
})<TextProps>`
  margin: 0;
  font-size: inherit;
  font-weight: inherit;
  ${({variant}) => (variant ? variantStyles[variant] : undefined)};
  color: ${({color}) => color ?? 'inherit'};
  user-select: ${({selectable}) => (selectable === false ? 'none' : 'text')};
  ${({lineClamp}) =>
    lineClamp && lineClamp > 0
      ? `
    display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: ${lineClamp};
    overflow: hidden; text-overflow: ellipsis;
  `
      : ''}
`;
export default Text;
