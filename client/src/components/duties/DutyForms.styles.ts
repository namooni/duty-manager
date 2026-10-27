import styled from 'styled-components';
export const Choice = styled.label<{$selected: boolean}>`
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid
    ${p => (p.$selected ? p.theme.palette.selectionBorder : p.theme.palette.gray200)};
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  background: ${p => (p.$selected ? p.theme.palette.selectionSurface : 'white')};
  input {
    accent-color: ${({theme}) => theme.palette.primary};
  }
  small {
    margin-left: auto;
    color: ${({theme}) => theme.palette.selectionCaption};
  }
`;
export const ChoiceGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  max-height: 240px;
  overflow: auto;
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;
