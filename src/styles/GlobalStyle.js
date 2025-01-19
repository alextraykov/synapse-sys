import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Courier New', Courier, monospace;
  }

  body {
    background-color: ${props => props.theme.terminal.bg};
    color: ${props => props.theme.terminal.text};
    overflow: hidden;
  }
`;

export default GlobalStyle; 