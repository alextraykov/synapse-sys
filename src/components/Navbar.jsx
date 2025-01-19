import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const NavContainer = styled(motion.nav)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 80px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: linear-gradient(to bottom, 
    ${props => props.theme.terminal.bg} 60%,
    rgba(0, 0, 0, 0)
  );
  z-index: 1000;
  pointer-events: none;
  & > * {
    pointer-events: auto;
  }
`;

const LeftSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Logo = styled(motion.div)`
  color: #0EF928;
  font-family: 'VT323', monospace;
  font-size: 24px;
`;

const AnimatedNumber = styled(motion.span)`
  display: inline-block;
  color: ${props => props.flashing ? '#0EF928' : 'inherit'};
`;

const NodeLabel = styled(motion.span)`
  display: inline-block;
  color: ${props => props.flashing ? '#0EF928' : 'inherit'};
`;

const StatsContainer = styled.div`
  color: ${props => props.theme.terminal.text}60;
  font-family: 'VT323', monospace;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatsItem = styled(motion.span)`
  display: inline-block;
`;

const UserSection = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #0EF928;
  font-family: 'VT323', monospace;
  font-size: 20px;
  cursor: pointer;

  i {
    font-size: 16px;
    transition: transform 0.2s;
  }

  &:hover i {
    transform: translateY(2px);
  }
`;

const Stats = ({ nodeCount }) => {
  const [prevCount, setPrevCount] = useState(nodeCount);
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    if (nodeCount !== prevCount) {
      setIsFlashing(true);
      setPrevCount(nodeCount);
      setTimeout(() => setIsFlashing(false), 300);
    }
  }, [nodeCount, prevCount]);

  // Format date as DD MMM YYYY
  const formatDate = () => {
    const date = new Date();
    const formattedDate = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(/ /g, ' ').toUpperCase();

    const formattedTime = date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    return `${formattedDate} ${formattedTime}`;
  };

  return (
    <StatsContainer>
      <StatsItem
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          duration: 0.3,
          ease: [0.2, 0.8, 0.2, 1],
          delay: 1.4
        }}
      >
        <NodeLabel
          animate={{ y: isFlashing ? -2 : 0 }}
          transition={{ duration: 0.2 }}
          flashing={isFlashing}
        >
          NUMBER OF NODES:
        </NodeLabel>{' '}
        <AnimatedNumber
          key={nodeCount}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30
          }}
          flashing={isFlashing}
        >
          {nodeCount}
        </AnimatedNumber>
      </StatsItem>

      <span>•</span>

      <StatsItem
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          duration: 0.3,
          ease: [0.2, 0.8, 0.2, 1],
          delay: 1.6
        }}
      >
        LAST UPDATED: {formatDate()}
      </StatsItem>
    </StatsContainer>
  );
};

const Navbar = ({ nodeCount }) => {
  return (
    <NavContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ 
        duration: 0.3,
        delay: 1.2
      }}
    >
      <LeftSection>
        <Logo
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            ease: [0.2, 0.8, 0.2, 1],
            delay: 1.2
          }}
        >
          SYNAPSE-SYS 0.0.1
        </Logo>
        <Stats nodeCount={nodeCount} />
      </LeftSection>
      <UserSection
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          duration: 0.3,
          ease: [0.2, 0.8, 0.2, 1],
          delay: 1.8
        }}
      >
        WELCOME BACK, ALEXANDER
        <i className="hn hn-chevron-down" />
      </UserSection>
    </NavContainer>
  );
};

export default Navbar; 