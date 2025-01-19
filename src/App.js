import React from 'react';
import Whiteboard from './components/Whiteboard';
import { ThemeProvider } from 'styled-components';
import GlobalStyle from './GlobalStyle';

const theme = {
  terminal: {
    bg: '#000000',
    text: '#00ff00',
    dimText: '#00cc00',
    highlight: '#00ff00',
    border: '#00ff00',
    boxShadow: '0 0 10px #00ff00',
  }
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Whiteboard />
    </ThemeProvider>
  );
}

export default App;
