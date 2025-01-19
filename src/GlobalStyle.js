import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'VT323', monospace;
  }

  body {
    background-color: ${props => props.theme.terminal.bg};
    color: ${props => props.theme.terminal.text};
    overflow: hidden;
  }

  /* Adjust font sizes for better VT323 readability */
  h1, h2, h3, h4, h5, h6 {
    font-family: 'VT323', monospace;
    letter-spacing: 0.5px;
  }

  button, input, textarea {
    font-family: 'VT323', monospace;
    font-size: 1.1em;
  }
`;

export default GlobalStyle; 