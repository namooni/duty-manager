import styled from 'styled-components';
const Checkbox = styled.input.attrs({type: 'checkbox'})`
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  accent-color: ${({theme}) => theme.palette.primary};
  outline: 1px solid transparent;
  outline-offset: 2px;
  &:focus-visible {
    outline-color: ${({theme}) => theme.palette.black};
  }
`;
export default Checkbox;
