import React from 'react';

const CustomConnectionLine = ({
  fromX,
  fromY,
  toX,
  toY,
  fromNode,
  fromHandle,
}) => {
  return (
    <g>
      {/* Glow effect */}
      <path
        d={`M ${fromX},${fromY} L ${toX},${toY}`}
        style={{
          stroke: 'rgba(14, 249, 40, 0.2)',
          strokeWidth: 6,
          filter: 'blur(4px)',
          strokeLinecap: 'round',
        }}
      />
      {/* Main connection line */}
      <path
        className="react-flow__connection-path"
        d={`M ${fromX},${fromY} L ${toX},${toY}`}
        style={{
          stroke: '#0EF928',
          strokeWidth: 2,
          strokeDasharray: '5,5',
          fill: 'none',
          filter: 'drop-shadow(0 0 8px rgba(14, 249, 40, 0.5))',
          strokeLinecap: 'round',
        }}
      />
    </g>
  );
};

export default CustomConnectionLine; 