import React, { useState } from 'react';
import styled from 'styled-components';
import { VscTerminal, VscClose } from 'react-icons/vsc';

const NodeContainer = styled.div`
  position: absolute;
  left: ${props => props.x}px;
  top: ${props => props.y}px;
  min-width: 300px;
  background: ${props => props.theme.terminal.bg};
  border: 2px solid ${props => props.theme.terminal.border};
  border-radius: 4px;
  box-shadow: 0 0 10px ${props => props.theme.terminal.boxShadow};
`;

const NodeHeader = styled.div`
  padding: 8px;
  border-bottom: 2px solid ${props => props.theme.terminal.border};
  display: flex;
  align-items: center;
  gap: 8px;
  
  h3 {
    margin: 0;
    font-size: 14px;
    flex-grow: 1;
  }
`;

const NodeContent = styled.div`
  padding: 12px;
  min-height: 100px;
  font-size: 14px;
  
  &::before {
    content: '>';
    margin-right: 8px;
    color: ${props => props.theme.terminal.dimText};
  }
`;

const Node = ({ title, content, position }) => {
  return (
    <NodeContainer x={position.x} y={position.y}>
      <NodeHeader>
        <VscTerminal />
        <h3>{title}</h3>
        <VscClose style={{ cursor: 'pointer' }} />
      </NodeHeader>
      <NodeContent>
        {content}
      </NodeContent>
    </NodeContainer>
  );
};

export default Node; 