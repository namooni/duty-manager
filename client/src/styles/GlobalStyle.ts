import {createGlobalStyle} from 'styled-components';
export const GlobalStyle = createGlobalStyle`
  * { box-sizing: border-box; }
  body { margin: 0; background: ${({theme}) => theme.semantic.surfaceSecondary}; color: ${({theme}) => theme.semantic.textPrimary};
    font-family: ${({theme}) => theme.typography.family};
    font-variant-numeric: tabular-nums;
    font-size: 13px; line-height: 1.5; }
  button, input, select, textarea { font: inherit; }
  :focus-visible { outline: 2px solid ${({theme}) => theme.palette.primary}; outline-offset: 3px; }
  h1, h2, h3, p { margin: 0; }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition-duration: 0.01ms !important; } }
`;
