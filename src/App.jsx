import React, { useState, useEffect } from 'react';
import ReactFlow, { 
  Background,
  Controls,
  ConnectionMode,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/base.css';  // Make sure this is imported
import { ThemeProvider } from 'styled-components';
import GlobalStyle from './styles/GlobalStyle';
import theme from './styles/theme';
import Navbar from './components/Navbar';
import Whiteboard from './components/Whiteboard';
import CustomConnectionLine from './components/CustomConnectionLine'; // Import from the new file

// Better global styles
const reactFlowStyles = `
  .react-flow__connection-path {
    stroke: #0EF928 !important;
    stroke-width: 2px !important;
    stroke-dasharray: 5,5 !important;
    animation: flowAnimation 1s linear infinite !important;
  }
  
  .react-flow__edge-path {
    stroke: #0EF928 !important;
    stroke-width: 2px !important;
    stroke-dasharray: 5,5 !important;
    animation: flowAnimation 1s linear infinite !important;
  }
  
  @keyframes flowAnimation {
    from {
      stroke-dashoffset: 20;
    }
    to {
      stroke-dashoffset: 0;
    }
  }
  
  /* Ensure handles have minimal visual impact but remain functional */
  .react-flow__handle {
    opacity: 0.5;
    width: 8px;
    height: 8px;
  }
`;

function App() {
  const [nodes, setNodes] = useState([]);
  const [activeHandle, setActiveHandle] = useState(null);

  const onConnectStart = (event, { nodeId, handleId }) => {
    console.log('Connection start:', { nodeId, handleId });
    setActiveHandle(handleId);
  };

  const onConnectEnd = (event) => {
    setActiveHandle(null);
  };

  useEffect(() => {
    // Log all ReactFlow connection line elements
    setTimeout(() => {
      const connectionLines = document.querySelectorAll('.react-flow__connection-line, .react-flow__connection, .react-flow__connection-path');
      console.log('Connection line elements:', connectionLines);
      
      // Log computed styles
      if (connectionLines.length > 0) {
        const computedStyle = window.getComputedStyle(connectionLines[0]);
        console.log('Connection line computed style:', {
          stroke: computedStyle.stroke,
          strokeWidth: computedStyle.strokeWidth,
          color: computedStyle.color,
          backgroundColor: computedStyle.backgroundColor
        });
      }
      
      // Log all styles applied to the document
      const allStyles = Array.from(document.styleSheets);
      console.log('All document styles:', allStyles);
    }, 2000); // Wait for ReactFlow to render
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <style>{reactFlowStyles}</style>
      <Navbar nodeCount={nodes.length} />
      <ReactFlow
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        nodes={nodes.map(node => ({
          ...node,
          data: { ...node.data, activeHandle }
        }))}
        connectionMode={ConnectionMode.Loose}
        snapToGrid={false}
        connectionRadius={50}
        connectionLineComponent={CustomConnectionLine}
        
        // Default edge options for all edges
        defaultEdgeOptions={{
          style: {
            stroke: '#0EF928',
            strokeWidth: 2,
            strokeDasharray: '5,5',
            filter: 'drop-shadow(0 0 8px rgba(14, 249, 40, 0.5))'
          },
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#0EF928',
          }
        }}
      >
        <Whiteboard nodes={nodes} setNodes={setNodes} />
        
        {/* Add SVG defs for custom markers */}
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            <marker
              id="terminal-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#0EF928" />
            </marker>
          </defs>
        </svg>
      </ReactFlow>
    </ThemeProvider>
  );
}

export default App;