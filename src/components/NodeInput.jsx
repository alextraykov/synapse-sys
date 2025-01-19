import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, { 
  Handle, 
  Position,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const jitterKeyframes = `
  @keyframes jitter {
    0% { transform: translate(0, 0) rotate(0deg); }
    25% { transform: translate(1px, 1px) rotate(0.5deg); }
    50% { transform: translate(-1px, -1px) rotate(-0.5deg); }
    75% { transform: translate(-1px, 1px) rotate(0.5deg); }
    100% { transform: translate(1px, -1px) rotate(-0.5deg); }
  }
`;

const ShadowLayer = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: -1;
`;

const NodeContainer = styled(motion.div)`
  ${jitterKeyframes}
  background: ${props => props.theme.terminal.bg};
  border: 2px solid ${props => props.theme.terminal.border};
  padding: 12px;
  min-width: 300px;
  position: relative;
  cursor: ${props => props.isDragging ? 'grabbing' : 'grab'};
  z-index: 1000;
`;

const EditModeContent = styled(motion.div)`
  width: 100%;
`;

const ViewModeActions = styled(motion.div)`
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 12px;
  opacity: 0;
  transition: opacity 0.2s;

  i {
    font-size: 16px;
    color: #0EF928;
    cursor: pointer;
    opacity: ${props => props.isDragging ? 0.5 : 1};
    transition: opacity 0.2s;
    
    &.hn-times {
      color: #ff0000;
    }

    &.hn-pencil {
      margin-right: 4px;
    }
  }
`;

const CustomHandle = styled(Handle)`
  width: 8px;
  height: 8px;
  background: ${props => props.theme.terminal.text};
  border: 2px solid ${props => props.theme.terminal.border};
  opacity: 0;
  transition: all 0.2s;
  position: absolute;

  &.top {
    top: -24px;
    left: 50%;
    transform: translateX(-50%);
  }
  &.right {
    right: -24px;
    top: 50%;
    transform: translateY(-50%);
  }
  &.bottom {
    bottom: -24px;
    left: 50%;
    transform: translateX(-50%);
  }
  &.left {
    left: -24px;
    top: 50%;
    transform: translateY(-50%);
  }

  &:hover {
    background: #0EF928;
    transform: scale(1.2);
  }
`;

const InputWrapper = styled.div``;

const Input = styled.input`
  background: none;
  border: none;
  border-bottom: 2px solid ${props => props.theme.terminal.text};
  color: ${props => props.theme.terminal.text};
  font-family: 'VT323', monospace;
  font-size: 20px;
  width: 100%;
  padding: 4px 4px 6px 4px;
  
  &:focus {
    outline: none;
    border-bottom-color: #0EF928;
  }

  &::placeholder {
    color: ${props => props.theme.terminal.text}80;
  }
`;

const ActionBar = styled.div`
  display: flex;
  align-items: center;
  margin-top: 8px;
`;

const ActionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  opacity: ${props => props.active ? '1' : '0.7'};
  transition: all 0.2s;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;

  &:hover {
    opacity: 1;
    transform: scale(1.1);
  }

  i {
    font-size: 20px;
    color: ${props => props.theme.terminal.text};
  }
`;

const Tooltip = styled.div`
  position: absolute;
  bottom: -24px;
  left: 50%;
  transform: translateX(-50%);
  background: #000000;
  border: 2px solid #0EF928;
  padding: 4px 8px;
  font-size: 12px;
  color: #0EF928;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
  font-family: 'VT323', monospace;
  z-index: 1001;

  ${ActionButton}:hover & {
    opacity: 1;
  }
`;

// Custom Node Component
const CustomNodeComponent = ({ data }) => {
  const [isEditing, setIsEditing] = useState(true);
  const [inputValue, setInputValue] = useState(data.content || '');
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredConnector, setHoveredConnector] = useState(null);
  const [inputType, setInputType] = useState('text');
  const nodeRef = useRef(null);
  const isDraggingRef = useRef(false);

  // Update hover detection with larger area
  const handleMouseMove = useCallback((e) => {
    if (isEditing) return;
    
    const rect = nodeRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const padding = 60; // Increased detection area

    if (y < 0 && Math.abs(x - rect.width/2) < padding) {
      setHoveredConnector('top');
    } else if (x > rect.width && Math.abs(y - rect.height/2) < padding) {
      setHoveredConnector('right');
    } else if (y > rect.height && Math.abs(x - rect.width/2) < padding) {
      setHoveredConnector('bottom');
    } else if (x < 0 && Math.abs(y - rect.height/2) < padding) {
      setHoveredConnector('left');
    } else {
      setHoveredConnector(null);
    }
  }, [isEditing]);

  // Update click outside handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Don't handle click outside if we're dragging
      if (isDragging) return;

      if (nodeRef.current && !nodeRef.current.contains(e.target)) {
        if (inputValue.trim()) {
          setIsEditing(false); // Save on click outside if there's content
        } else {
          data.onRemove?.(); // Remove if empty
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inputValue, data.onRemove, isDragging]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    data.onChange?.(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (isDragging) return;

    if (e.key === 'Enter' && !e.shiftKey && inputValue.trim()) {
      e.preventDefault();
      setIsEditing(false);
    }
    if (e.key === 'Escape') {
      if (inputValue.trim()) {
        setIsEditing(false);
      }
    }
  };

  const handleTypeChange = (type) => {
    setInputType(type);
  };

  const handleInputBlur = (e) => {
    // Don't handle blur if we're dragging
    if (isDragging) return;

    if (inputValue.trim()) {
      setIsEditing(false);
    }
  };

  // When local editing state changes, update parent
  useEffect(() => {
    data.setIsEditing?.(isEditing);
  }, [isEditing, data.setIsEditing]);

  // Update the drag state effect to use the ref
  useEffect(() => {
    isDraggingRef.current = !!data.isDragging;
    setIsDragging(!!data.isDragging);
  }, [data.isDragging]);

  return (
    <>
      <ShadowLayer
        initial={false}
        animate={{ 
          filter: isDragging 
            ? 'drop-shadow(32px 32px 0px #000000) drop-shadow(48px 48px 0px #05FD11)'
            : 'drop-shadow(0px 0px 0px #000000) drop-shadow(0px 0px 0px #05FD11)',
          transition: { 
            duration: 0.3,
            ease: "easeOut",
            delay: isDragging ? 0.2 : 0 // Add delay only when dragging
          }
        }}
      />
      <NodeContainer
        ref={nodeRef}
        initial={{ scale: 1 }}
        animate={{ 
          scale: isDragging ? 1.05 : 1,
          boxShadow: isDragging 
            ? '16px 16px 0 -2px #000, 16px 16px 0 0 #05FD11'
            : '0px 0px 0 -2px #000, 0px 0px 0 0 #05FD11',
          transition: { 
            duration: 0.3, 
            ease: [0.2, 0.8, 0.2, 1],
            boxShadow: { duration: 0.3 }
          }
        }}
        whileHover={{ 
          scale: isDragging ? 1.05 : 1.02,
          boxShadow: isDragging 
            ? '16px 16px 0 -2px #000, 16px 16px 0 0 #05FD11'
            : '8px 8px 0 -2px #000, 8px 8px 0 0 #05FD11',
          transition: { 
            duration: 0.3,
            ease: [0.2, 0.8, 0.2, 1],
            boxShadow: { duration: 0.3 }
          }
        }}
        style={{
          animation: isDragging ? 'jitter 0.3s infinite' : 'none',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        isDragging={isDragging}
      >
        <AnimatePresence mode="wait">
          {isEditing ? (
            <EditModeContent
              key="edit"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              style={{ cursor: isDragging ? 'grabbing' : 'text' }}
            >
              <InputWrapper>
                <Input 
                  autoFocus
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onBlur={(e) => {
                    // Prevent blur if we're dragging
                    if (isDraggingRef.current) {
                      e.preventDefault();
                      e.target.focus(); // Keep focus on the input
                      return;
                    }
                    handleInputBlur(e);
                  }}
                  placeholder="Type your note..."
                />
              </InputWrapper>
              <ActionBar>
                <ActionGroup>
                  <ActionButton 
                    aria-label="Upload Document"
                    active={inputType === 'document'}
                    onClick={() => handleTypeChange('document')}
                  >
                    <i className="hn hn-file-import"></i>
                    <Tooltip>upload file</Tooltip>
                  </ActionButton>
                  <ActionButton 
                    aria-label="Upload Image"
                    active={inputType === 'image'}
                    onClick={() => handleTypeChange('image')}
                  >
                    <i className="hn hn-image"></i>
                    <Tooltip>upload image</Tooltip>
                  </ActionButton>
                  <ActionButton 
                    aria-label="External Link"
                    active={inputType === 'link'}
                    onClick={() => handleTypeChange('link')}
                  >
                    <i className="hn hn-external-link"></i>
                    <Tooltip>external link</Tooltip>
                  </ActionButton>
                  <ActionButton 
                    aria-label="Save"
                    onClick={() => setIsEditing(false)}
                    style={{ marginLeft: 'auto' }}
                  >
                    <i className="hn hn-check"></i>
                    <Tooltip>save (enter)</Tooltip>
                  </ActionButton>
                  <ActionButton 
                    aria-label="Cancel"
                    onClick={() => data.onRemove?.()}
                  >
                    <i className="hn hn-times"></i>
                    <Tooltip>cancel (esc)</Tooltip>
                  </ActionButton>
                </ActionGroup>
              </ActionBar>
            </EditModeContent>
          ) : (
            <motion.div
              key="view"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              whileHover="hover"
            >
              <div className="node-content">{inputValue}</div>
              <ViewModeActions
                variants={{
                  hover: { 
                    opacity: 1,
                    transition: { duration: 0.1 }
                  }
                }}
                isDragging={isDragging}
              >
                <i 
                  className="hn hn-pencil"
                  onClick={() => setIsEditing(true)}
                />
                <i 
                  className="hn hn-times"
                  onClick={() => data.onRemove?.()}
                />
              </ViewModeActions>
            </motion.div>
          )}
        </AnimatePresence>

        {!isEditing && (
          <>
            <CustomHandle 
              type="target" 
              position={Position.Top} 
              className="top"
              style={{ opacity: hoveredConnector === 'top' ? 1 : 0 }}
            />
            <CustomHandle 
              type="target" 
              position={Position.Left}
              className="left" 
              style={{ opacity: hoveredConnector === 'left' ? 1 : 0 }}
            />
            <CustomHandle 
              type="source" 
              position={Position.Right}
              className="right" 
              style={{ opacity: hoveredConnector === 'right' ? 1 : 0 }}
            />
            <CustomHandle 
              type="source" 
              position={Position.Bottom}
              className="bottom" 
              style={{ opacity: hoveredConnector === 'bottom' ? 1 : 0 }}
            />
          </>
        )}
      </NodeContainer>
    </>
  );
};

export const CustomNode = CustomNodeComponent;