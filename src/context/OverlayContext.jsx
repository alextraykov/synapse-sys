import React, { createContext, useContext, useState } from 'react';

const OverlayContext = createContext({
  overlayContent: null,
  showOverlay: () => {},
  hideOverlay: () => {}
});

export const defaultIcon = (
  <svg 
    width="16" 
    height="16" 
    viewBox="0 0 9 12" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    style={{ 
      display: 'block',
      transform: 'scale(1.2)'
    }}
  >
    <path d="M8.5 3V11H8V11.5H0.5V11H0V8H1V10.5H7.5V4H5V1.5H1V8H0V1H0.5V0.5H6V1H6.5V1.5H7V2H7.5V2.5H8V3H8.5Z" fill="#0EF928"/>
  </svg>
);

export const OverlayProvider = ({ children }) => {
  const [overlayContent, setOverlayContent] = useState(null);

  const showOverlay = (content) => {
    setOverlayContent(content);
  };

  const hideOverlay = () => {
    setOverlayContent(null);
  };

  return (
    <OverlayContext.Provider value={{ overlayContent, showOverlay, hideOverlay }}>
      {children}
    </OverlayContext.Provider>
  );
};

export const useOverlay = () => {
  const context = useContext(OverlayContext);
  if (context === undefined) {
    throw new Error('useOverlay must be used within an OverlayProvider');
  }
  return context;
}; 