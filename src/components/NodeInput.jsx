import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, { 
  Handle, 
  Position,
  useNodesState,
  useEdgesState,
  getCenter
} from 'reactflow';
import 'reactflow/dist/style.css';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useOverlay } from '../context/OverlayContext';
import { defaultIcon } from '../context/OverlayContext';

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

  &:hover {
    .handle {
      opacity: 0.5;
    }
  }
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

const handleJitterKeyframes = `
  @keyframes handleJitter {
    0% { transform: translate(0, 0); }
    25% { transform: translate(0.5px, 0.5px); }
    50% { transform: translate(-0.5px, -0.5px); }
    75% { transform: translate(-0.5px, 0.5px); }
    100% { transform: translate(0.5px, -0.5px); }
  }
`;

// First, let's define our constants for the handle positions
const HANDLE_PADDING = 32; // The default padding of the handle from the node
const HANDLE_SIZE = 8;    // The width/height of the handle dot

const CustomHandle = styled(Handle)`
  width: ${HANDLE_SIZE}px;
  height: ${HANDLE_SIZE}px;
  background: ${props => props.theme.terminal.text};
  border: 2px solid ${props => props.theme.terminal.border};
  opacity: 0;
  transition: all 0.1s cubic-bezier(0.2, 0.8, 0.2, 1);
  position: absolute;

  // Add connection line styling
  .react-flow__connection-path {
    stroke: #0EF928 !important;
    strokeWidth: 2;
    filter: drop-shadow(0 0 8px #0EF928);
    strokeLinecap: round;
  }

  &.top {
    top: -${HANDLE_PADDING}px;
    left: 50%;
    transform: translateX(-50%);
    
    &.connecting {
      top: 0;
      transform: translate(-50%, -50%);
      background: #000;
      border: 2px solid #0EF928;
      opacity: 1;
      z-index: 1000;
    }
  }
  
  &.right {
    right: -72px;
    top: 50%;
    transform: translateY(-50%);
    
    &.connecting {
      right: 0;
      transform: translate(50%, -50%);
      background: #000;
      border: 2px solid #0EF928;
      opacity: 1;
      z-index: 1000;
    }
  }
  
  &.bottom {
    bottom: -72px;
    left: 50%;
    transform: translateX(-50%);
    
    &.connecting {
      bottom: 0;
      transform: translate(-50%, 50%);
      background: #000;
      border: 2px solid #0EF928;
      opacity: 1;
      z-index: 1000;
    }
  }
  
  &.left {
    left: -32px;
    top: 50%;
    transform: translateY(-50%);
    
    &.connecting {
      left: 0;
      transform: translate(-50%, -50%);
      background: #000;
      border: 2px solid #0EF928;
      opacity: 1;
      z-index: 1000;
    }
  }

  &:hover {
    background: #0EF928;
    opacity: 1 !important;
  }
`;

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  padding-left: 32px;  // Space for icon
`;

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

const ParagraphInput = styled(Input)`
  font-size: 16px;  // Smaller than header
  margin-top: 8px;
  padding-left: 0;  // Remove left padding since it's full width
  width: 100%;
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

const PreviewPanel = styled(motion.div)`
  margin-top: 12px;
  border-top: 1px solid ${props => props.theme.terminal.border};
  overflow: hidden;
`;

const PreviewContent = styled.div`
  padding: 12px 0;
  color: ${props => props.theme.terminal.text}80;
  font-size: 14px;
  max-height: 200px;
  overflow-y: auto;
`;

const ViewContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ViewIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
`;

const ViewHeading = styled.h3`
  margin: 0;
  font-size: 20px;
  font-weight: normal;
  color: ${props => props.theme.terminal.text};
`;

const ViewParagraph = styled.p`
  margin: 8px 0 0 40px;
  color: ${props => props.theme.terminal.text};
  opacity: 0.5;
`;

const SlidePanel = styled(motion.div)`
  position: fixed;
  bottom: 0;
  right: 0;
  width: 400px;
  max-height: 70vh;
  background: ${props => props.theme.terminal.bg};
  border-top: 2px solid ${props => props.theme.terminal.border};
  border-left: 2px solid ${props => props.theme.terminal.border};
  padding: 24px;
  z-index: 1000;
  overflow-y: auto;
  box-shadow: -8px -8px 0 -2px #000, -8px -8px 0 0 #05FD11;
`;

const OverlayHeading = styled.h2`
  font-size: 24px;
  color: ${props => props.theme.terminal.text};
  margin-bottom: 16px;
`;

const OverlayParagraph = styled.p`
  font-size: 16px;
  color: ${props => props.theme.terminal.text}80;
  line-height: 1.5;
  white-space: pre-wrap;
`;

const OverlayActions = styled.div`
  position: absolute;
  top: 24px;
  right: 24px;
  display: flex;
  gap: 16px;

  i {
    font-size: 20px;
    color: ${props => props.theme.terminal.text};
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s;

    &:hover {
      opacity: 1;
    }
  }
`;

const EditIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  position: absolute;
  left: 0;
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
  const [hoveredArea, setHoveredArea] = useState(null);
  const [isHovering, setIsHovering] = useState(false);
  const [pastedContent, setPastedContent] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [paragraphs, setParagraphs] = useState([]);
  const { showOverlay } = useOverlay();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingHandle, setConnectingHandle] = useState(null);
  const connectingRef = useRef(false);
  const handleRefs = useRef({});  // Store refs for each handle

  // Update hover detection with larger area
  const handleMouseMove = useCallback((e) => {
    if (isEditing) return;
    setIsHovering(true);  // Show all dots when hovering over node
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

    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Add new paragraph
        e.preventDefault();
        setParagraphs([...paragraphs, '']);
      } else if (inputValue.trim()) {
        e.preventDefault();
        setIsEditing(false);
      }
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

    // Check if the new focused element is within our node
    setTimeout(() => {
      const newFocusedElement = document.activeElement;
      const isWithinNode = nodeRef.current?.contains(newFocusedElement);
      
      if (!isWithinNode && inputValue.trim()) {
        setIsEditing(false);
      }
    }, 0);
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

  const handleAreaHover = (area) => {
    setHoveredArea(area);
    setIsHovering(true);
  };

  const handleAreaLeave = () => {
    setHoveredArea(null);
    setIsHovering(false);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    
    // Get clipboard content as HTML
    const clipboardData = e.clipboardData;
    const html = clipboardData.getData('text/html');
    const text = clipboardData.getData('text');

    if (html) {
      // Parse the HTML content
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Look for headings
      const heading = doc.querySelector('h1, h2, h3, h4, h5, h6');
      const title = heading ? heading.textContent : '';
      
      // Get remaining content
      const content = text.replace(title, '').trim();
      
      // Update node with structured content
      setPastedContent({
        title,
        content,
        originalHtml: html
      });

      // Set the title as the input value
      setInputValue(title);
      
      // Show preview panel with content
      setShowPreview(true);
    } else {
      // Just plain text, use as is
      setInputValue(text);
    }
  };

  // Add paragraph change handler
  const handleParagraphChange = (index, value) => {
    const newParagraphs = [...paragraphs];
    newParagraphs[index] = value;
    setParagraphs(newParagraphs);
  };

  const handleShowOverlay = () => {
    showOverlay({
      title: inputValue,
      paragraphs,
      onEdit: () => setIsEditing(true)
    });
  };

  const handleMouseDown = (event, position) => {
    event.stopPropagation();
    setIsConnecting(true);
    setConnectingHandle(position);
    connectingRef.current = true;
  };

  const handleMouseUp = (event) => {
    if (connectingRef.current) {
      setIsConnecting(false);
      setConnectingHandle(null);
      connectingRef.current = false;
    }
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Add this function to calculate connection point
  const getConnectionPoint = useCallback((handle) => {
    if (!isConnecting || connectingHandle !== handle) return null;
    
    // Return coordinates based on handle position
    switch (handle) {
      case 'top':
        return { x: '50%', y: 0 }; // At the node's top border
      case 'right':
        return { x: '100%', y: '50%' }; // At the node's right border
      case 'bottom':
        return { x: '50%', y: '100%' }; // At the node's bottom border
      case 'left':
        return { x: 0, y: '50%' }; // At the node's left border
      default:
        return null;
    }
  }, [isConnecting, connectingHandle]);

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
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          setIsHovering(false);
          setHoveredArea(null);
        }}
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
                <HeaderRow>
                  <EditIconWrapper>
                    {defaultIcon}
                  </EditIconWrapper>
                  <Input 
                    autoFocus
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onBlur={handleInputBlur}
                    placeholder="Heading (⇧↵ for paragraph)"
                    onPaste={handlePaste}
                  />
                </HeaderRow>
                {paragraphs.map((paragraph, index) => (
                  <ParagraphInput
                    key={index}
                    value={paragraph}
                    onChange={(e) => handleParagraphChange(index, e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Continue writing..."
                  />
                ))}
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
              <ViewContent>
                <ViewIconWrapper>
                  {defaultIcon}
                </ViewIconWrapper>
                <ViewHeading>{inputValue}</ViewHeading>
                {paragraphs.length > 0 && (
                  <ViewParagraph>{paragraphs[0]}</ViewParagraph>
                )}
              </ViewContent>
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
                  className="hn hn-eye"
                  onClick={handleShowOverlay}
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
              className={`top ${isConnecting && connectingHandle === 'top' ? 'connecting' : ''}`}
              style={{ 
                opacity: (isHovering && !isDragging) || (isConnecting && connectingHandle === 'top') ? 1 : 0
              }}
              isConnectable={!isEditing}
              id={`${data.id}-top`}
              ref={(el) => handleRefs.current['top'] = el}
              onMouseDown={(e) => handleMouseDown(e, 'top')}
              onConnect={(connection) => {
                const handleElement = handleRefs.current['top'];
                if (handleElement && isConnecting) {
                  const rect = handleElement.getBoundingClientRect();
                  connection.sourceX = rect.left + (rect.width / 2);
                  connection.sourceY = rect.top;
                }
              }}
            />
            <CustomHandle 
              type="source" 
              position={Position.Right}
              className={`right ${data.activeHandle === `${data.id}-right` ? 'dragging' : ''}`}
              style={{ 
                opacity: isHovering && !isDragging ? (hoveredArea === 'right' ? 1 : 0.5) : 0
              }}
              isConnectable={!isEditing}
              id={`${data.id}-right`}
              onMouseEnter={() => handleAreaHover('right')}
              onMouseLeave={handleAreaLeave}
            />
            <CustomHandle 
              type="target" 
              position={Position.Left}
              className="left" 
              style={{ 
                opacity: isHovering && !isDragging ? (hoveredArea === 'left' ? 1 : 0.5) : 0
              }}
              isConnectable={!isEditing}
              id={`${data.id}-left`}
              onMouseEnter={() => handleAreaHover('left')}
              onMouseLeave={handleAreaLeave}
            />
            <CustomHandle 
              type="source" 
              position={Position.Bottom}
              className="bottom" 
              style={{ 
                opacity: isHovering && !isDragging ? (hoveredArea === 'bottom' ? 1 : 0.5) : 0
              }}
              isConnectable={!isEditing}
              id={`${data.id}-bottom`}
              onMouseEnter={() => handleAreaHover('bottom')}
              onMouseLeave={handleAreaLeave}
            />
          </>
        )}
      </NodeContainer>

      {showPreview && pastedContent && (
        <PreviewPanel
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
        >
          <PreviewContent>
            {pastedContent.content}
          </PreviewContent>
        </PreviewPanel>
      )}
    </>
  );
};

export const CustomNode = CustomNodeComponent;