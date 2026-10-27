import styled, {type CSSObject} from 'styled-components';
export interface FlexProps {
  flexDirection?: CSSObject['flexDirection'];
  justifyContent?: CSSObject['justifyContent'];
  alignItems?: CSSObject['alignItems'];
  gap?: CSSObject['gap'];
  $grow?: number;
}
const Flex = styled.div.withConfig({
  shouldForwardProp: prop =>
    !['flexDirection', 'justifyContent', 'alignItems', 'gap'].includes(prop),
})<FlexProps>`
  display: flex;
  flex-direction: ${({flexDirection}) => flexDirection ?? 'row'};
  justify-content: ${({justifyContent}) => justifyContent ?? 'flex-start'};
  align-items: ${({alignItems}) => alignItems ?? 'stretch'};
  gap: ${({gap}) => (typeof gap === 'number' ? gap + 'px' : (gap ?? 0))};
  flex-grow: ${({$grow}) => $grow ?? 0};
`;
export default Flex;
