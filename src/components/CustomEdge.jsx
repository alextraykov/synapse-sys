import React from 'react';
import { getSmoothStepPath } from 'reactflow';

const CustomEdge = ({ 
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

export default CustomEdge; 