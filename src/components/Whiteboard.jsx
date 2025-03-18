import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import ReactFlow, { 
  useNodesState, 
  useEdgesState,
  Controls,
  MarkerType,
  getSmoothStepPath
} from 'reactflow';
import 'reactflow/dist/style.css';
import styled from 'styled-components';
import { CustomNode } from './NodeInput';
import Navbar from './Navbar';
import CustomEdge from './CustomEdge';
import CustomConnectionLine from './CustomConnectionLine';

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

// Fix styled component using a transient prop
const AnimatedComponent = styled.div`
  animation: ${props => props.$delay ? `fadeIn ${props.$delay}s` : 'none'};
  // other styles...
`;

// Fix the edge implementation (rename or replace the existing one)
const TerminalEdge = ({ 
  id, 
  source, 
  target, 
  sourceX, 
  sourceY, 
  targetX, 
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style = {} 
}) => {
  // Calculate the path
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  });

  return (
    <>
      {/* Optional glow effect layer */}
      <path
        style={{
          stroke: 'rgba(14, 249, 40, 0.2)',
          strokeWidth: 6,
          filter: 'blur(4px)',
        }}
        d={edgePath}
        fill="none"
      />
      {/* Main edge path */}
      <path
        id={id}
        style={{
          stroke: '#0EF928',
          strokeWidth: 2,
          strokeDasharray: '5,5',
          ...style,
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd="url(#terminal-arrow)"
        fill="none"
      />
      
      {/* Optional label */}
      {data?.label && (
        <foreignObject
          width={100}
          height={40}
          x={labelX - 50}
          y={labelY - 20}
          className="edgebutton-foreignobject"
          requiredExtensions="http://www.w3.org/1999/xhtml"
        >
          <div
            style={{
              background: '#000',
              color: '#0EF928',
              padding: '4px 8px',
              borderRadius: '4px',
              fontFamily: 'VT323, monospace',
              fontSize: '14px',
              border: '1px solid #0EF928',
              textAlign: 'center',
              boxShadow: '0 0 8px rgba(14, 249, 40, 0.5)',
            }}
          >
            {data.label}
          </div>
        </foreignObject>
      )}
    </>
  );
};

const Whiteboard = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [rippleCenter, setRippleCenter] = useState(null);
  const [showRipple, setShowRipple] = useState(false);
  const [selectedEdges, setSelectedEdges] = useState([]);

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

  // Define edge types with our renamed component
  const edgeTypes = useMemo(() => ({
    terminal: TerminalEdge
  }), []);
  
  // Updated onConnect to use the renamed edge type
  const onConnect = useCallback((params) => {
    setEdges(edges => [
      ...edges,
      {
        ...params,
        type: 'terminal', // Use renamed edge type
        animated: true,
        data: {
          label: 'connection'
        },
        style: {
          stroke: '#0EF928',
          strokeDasharray: '5,5',
        },
      }
    ]);
  }, []);

  // Memoize nodeTypes and edgeTypes to prevent recreation on each render
  const nodeTypes = useMemo(() => ({ 
    custom: CustomNode 
  }), []);

  // Handle edge click
  const onEdgeClick = useCallback((event, edge) => {
    event.stopPropagation();
    setSelectedEdges(prev => 
      prev.includes(edge.id) 
        ? prev.filter(id => id !== edge.id) 
        : [...prev, edge.id]
    );
  }, []);
  
  // Process edges with selection state
  const processedEdges = useMemo(() => {
    return edges.map(edge => {
      const isSelected = selectedEdges.includes(edge.id);
      return {
        ...edge,
        style: {
          ...edge.style,
          stroke: isSelected ? '#ffffff' : '#0EF928',
          strokeWidth: isSelected ? 3 : 2,
          filter: isSelected 
            ? 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.7))' 
            : 'drop-shadow(0 0 8px rgba(14, 249, 40, 0.5))',
        },
      };
    });
  }, [edges, selectedEdges]);
  
  // Handle canvas click to clear selection
  const onPaneClick = useCallback(() => {
    setSelectedEdges([]);
  }, []);

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
          </svg>
        </DotGrid>
      )}
      <ReactFlow
        nodes={nodes}
        edges={processedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
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
        connectionLineComponent={CustomConnectionLine}
      >
        <Controls />
        
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
        
        {/* Add keyframe animation */}
        <style>
          {`
            @keyframes flowAnimation {
              from {
                stroke-dashoffset: 20;
              }
              to {
                stroke-dashoffset: 0;
              }
            }
            
            .react-flow__edge-path {
              animation: flowAnimation 1s linear infinite;
            }
          `}
        </style>
      </ReactFlow>
    </WhiteboardContainer>
  );
};

export default Whiteboard; 