import styled from 'styled-components';
export const Choice = styled.label<{$selected: boolean}>`
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 8px 10px;
  border: 1px solid
    ${p => (p.$selected ? p.theme.palette.selectionBorder : p.theme.palette.gray200)};
  border-radius: ${({theme}) => theme.radius.sm};
  cursor: pointer;
  font-size: 13px;
  background: ${p => (p.$selected ? p.theme.palette.selectionSurface : p.theme.palette.surface)};
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
