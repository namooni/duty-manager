import styled from 'styled-components';
const Select = styled.select`
  width: 100%;
  min-height: 42px;
  padding: 10px 12px;
  font: inherit;
  font-weight: 400;
  border: 1px solid ${({theme}) => theme.semantic.borderDefault};
  background: ${({theme}) => theme.semantic.surfacePrimary};
  color: ${({theme}) => theme.semantic.textPrimary};
  border-radius: ${({theme}) => theme.radius.md};
  outline: 1px solid transparent;
  outline-offset: -1px;
  transition:
    outline-color 0.15s ease,
    border-color 0.15s ease;
  &:focus {
    outline-color: ${({theme}) => theme.palette.black};
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;
export default Select;
