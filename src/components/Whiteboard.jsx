import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, { 
  useNodesState, 
  useEdgesState,
  Controls
} from 'reactflow';
import 'reactflow/dist/style.css';
import styled from 'styled-components';
import { CustomNode } from './NodeInput';
import Navbar from './Navbar';

const WhiteboardContainer = styled.div`
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: ${props => props.theme.terminal.bg};
`;

// Create an SVG pattern for infinite dots
const DotGrid = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;

  svg {
    position: absolute;
    width: 100%;
    height: 100%;
  }
`;

// Add a component for the initial loading animation
const LoadingGrid = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
`;

const LoadingDot = styled.circle`
  opacity: 0;
  animation: fadeInDot 0.15s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  animation-delay: ${props => props.delay}s;

  @keyframes fadeInDot {
    0% { 
      opacity: 0;
      transform: scale(0.95);
    }
    50% { 
      opacity: 1;
      fill: #0EF928;
      transform: scale(1.1);
    }
    100% { 
      opacity: 0.4;
      fill: #ababab;
      transform: scale(1);
    }
  }
`;

// Add new styled component for ripple effect
const RippleDot = styled.circle`
  animation: rippleEffect 0.5s ease-out forwards;
  animation-delay: ${props => props.delay}s;
  
  @keyframes rippleEffect {
    0% { 
      opacity: 0.2;
      fill: #d2d2d2;
    }
    50% { 
      opacity: 0.5;
      fill: #0EF928;
    }
    100% { 
      opacity: 0.2;
      fill: #d2d2d2;
    }
  }
`;

// Add new styled component for vignette
const VignetteOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  background: radial-gradient(
    circle at center,
    transparent 0%,
    transparent 60%,
    rgba(0, 0, 0, 0.4) 100%
  );
  z-index: 1; // Above canvas but below navbar
`;

const nodeTypes = {
  custom: CustomNode
};

const Whiteboard = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [rippleCenter, setRippleCenter] = useState(null);
  const [showRipple, setShowRipple] = useState(false);

  // Calculate grid dimensions based on viewport
  const gridSize = {
    cols: Math.ceil(window.innerWidth / 24) + 1,
    rows: Math.ceil(window.innerHeight / 24) + 1
  };

  // Create array of dots for loading animation
  const dots = [];
  for (let y = 0; y < gridSize.rows; y++) {
    for (let x = 0; x < gridSize.cols; x++) {
      dots.push({ x, y });
    }
  }

  // Switch to infinite grid after animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, (Math.sqrt(gridSize.cols * gridSize.cols + gridSize.rows * gridSize.rows) * 0.05 + 0.15) * 1000);
    return () => clearTimeout(timer);
  }, [gridSize.cols, gridSize.rows]);

  // Calculate pattern offset based on canvas position
  const patternOffset = {
    x: position.x % (24 * zoom),
    y: position.y % (24 * zoom)
  };

  // Update pattern size based on zoom
  const patternSize = 24 * zoom;
  const dotSize = 1 * zoom;

  const handleDoubleClick = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();

    const reactFlowBounds = event.currentTarget.getBoundingClientRect();
    // Adjust click position based on canvas position and zoom
    const clickX = (event.clientX - reactFlowBounds.left - position.x) / zoom;
    const clickY = (event.clientY - reactFlowBounds.top - position.y) / zoom;

    // Calculate which dot was closest to the click, accounting for dot center
    const dotX = Math.round((clickX - 1) / 24) * 24 + 1;
    const dotY = Math.round((clickY - 1) / 24) * 24 + 1;

    setRippleCenter({ 
      x: (dotX * zoom) + position.x,
      y: (dotY * zoom) + position.y
    });
    setShowRipple(true);

    // Hide ripple after animation
    setTimeout(() => {
      setShowRipple(false);
    }, 500);

    // Create new node
    const newPosition = {
      x: (event.clientX - reactFlowBounds.left - position.x) / zoom,
      y: (event.clientY - reactFlowBounds.top - position.y) / zoom,
    };

    const newNodeId = Date.now().toString();
    const newNode = {
      id: newNodeId,
      type: 'custom',
      position: newPosition,
      data: { 
        content: '',
        onRemove: () => {
          setNodes(nodes => nodes.filter(n => n.id !== newNodeId));
        }
      }
    };

    setNodes(nodes => [...nodes, newNode]);
  }, [position, zoom]);

  const onConnect = useCallback((params) => {
    setEdges(edges => [...edges, params]);
  }, []);

  // Add ripple effect to the grid
  const renderRipple = () => {
    if (!showRipple || !rippleCenter) return null;

    const rippleDots = [];
    for (let y = -3; y <= 2; y++) {
      for (let x = -3; x <= 2; x++) {
        const distance = Math.sqrt(x * x + y * y);
        if (distance <= 3) {
          rippleDots.push(
            <RippleDot
              key={`ripple-${x}-${y}`}
              cx={rippleCenter.x + ((x * 24) * zoom)}
              cy={rippleCenter.y + ((y * 24) * zoom)}
              r={dotSize}
              delay={distance * 0.05}
            />
          );
        }
      }
    }
    return rippleDots;
  };

  return (
    <WhiteboardContainer>
      <VignetteOverlay />
      <Navbar nodeCount={nodes.length} />
      {isLoading ? (
        <LoadingGrid>
          <svg width="100%" height="100%">
            {dots.map(({ x, y }, i) => {
              const distance = Math.sqrt(x * x + y * y);
              return (
                <LoadingDot
                  key={`${x}-${y}`}
                  cx={x * 24 + 1}
                  cy={y * 24 + 1}
                  r={1}
                  fill="#ababab"
                  delay={distance * 0.05}
                />
              );
            })}
          </svg>
        </LoadingGrid>
      ) : (
        <DotGrid>
          <svg>
            <defs>
              <pattern 
                id="dot-pattern" 
                x={patternOffset.x} 
                y={patternOffset.y} 
                width={patternSize} 
                height={patternSize} 
                patternUnits="userSpaceOnUse"
              >
                <circle 
                  cx={dotSize} 
                  cy={dotSize} 
                  r={dotSize} 
                  fill="#ababab" 
                  fillOpacity="0.4"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dot-pattern)" />
            {renderRipple()}
          </svg>
        </DotGrid>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onDoubleClick={handleDoubleClick}
        zoomOnDoubleClick={false}
        fitView={false}
        style={{ width: '100%', height: '100%' }}
        onNodeDragStart={(_, node) => {
          setNodes(nodes => 
            nodes.map(n => 
              n.id === node.id 
                ? { ...n, data: { ...n.data, isDragging: true }}
                : n
            )
          );
        }}
        onNodeDragStop={(_, node) => {
          setNodes(nodes => 
            nodes.map(n => 
              n.id === node.id 
                ? { ...n, data: { ...n.data, isDragging: false }}
                : n
            )
          );
        }}
        onMove={(_, viewState) => {
          setPosition({ x: viewState.x, y: viewState.y });
          setZoom(viewState.zoom);
        }}
      >
        <Controls />
      </ReactFlow>
    </WhiteboardContainer>
  );
};

export default Whiteboard; 