import styled from 'styled-components';
const Divider = styled.hr<{$margin?: string}>`
  width: 100%;
  height: 1px;
  border: 0;
  flex-shrink: 0;
  background: ${({theme}) => theme.semantic.borderDefault};
  margin: ${({$margin}) => $margin ?? '0'};
`;
export default Divider;
