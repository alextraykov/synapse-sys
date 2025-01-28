import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    background: #000000;
    font-family: 'VT323', monospace;
    overflow: hidden;
  }
`;

export default GlobalStyle; 