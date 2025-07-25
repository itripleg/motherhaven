// pet/components/AnimatedTestyPeek.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AnimatedTestyPeekProps {
  petIsAlive?: boolean;
  petName?: string;
  isOnStatusTab?: boolean;
}

export const AnimatedTestyPeek: React.FC<AnimatedTestyPeekProps> = ({
  petIsAlive = true,
  petName = "Testy",
  isOnStatusTab = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [peekPosition, setPeekPosition] = useState<'left' | 'right'>('right');
  const [peekHeight, setPeekHeight] = useState<number>(50);
  const [mounted, setMounted] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showHearts, setShowHearts] = useState(false);
  const [showGhosts, setShowGhosts] = useState(false);

  // Show everywhere except when explicitly on status tab
  const shouldShow = !isOnStatusTab;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !shouldShow) return;

    let timeoutId: NodeJS.Timeout;

    const scheduleNextPeek = () => {
      const delay = 60000 + Math.random() * 120000; // 1-3 minutes
      timeoutId = setTimeout(() => {
        showRandomPeek();
      }, delay);
    };

    const showRandomPeek = () => {
      if (isVisible) return; // Don't show if already visible
      
      const positions: Array<'left' | 'right'> = ['left', 'right'];
      const randomPosition = positions[Math.floor(Math.random() * positions.length)];
      const randomHeight = 20 + Math.random() * 60;
      
      setPeekPosition(randomPosition);
      setPeekHeight(randomHeight);
      setIsVisible(true);
      
      setTimeout(() => setShowTooltip(true), 300);
      
      const hideDelay = 3000 + Math.random() * 1000;
      setTimeout(() => {
        setShowTooltip(false);
        setTimeout(() => {
          setIsVisible(false);
          // Schedule next peek after this one hides
          scheduleNextPeek();
        }, 200);
      }, hideDelay);
    };

    // Initial delay between 1-3 minutes
    scheduleNextPeek();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [mounted, shouldShow]);

  const triggerPeek = () => {
    if (!shouldShow) return;
    const positions: Array<'left' | 'right'> = ['left', 'right'];
    const randomPosition = positions[Math.floor(Math.random() * positions.length)];
    const randomHeight = 20 + Math.random() * 60;
    setPeekPosition(randomPosition);
    setPeekHeight(randomHeight);
    setIsVisible(true);
    setTimeout(() => setShowTooltip(true), 300);
    setTimeout(() => {
      setShowTooltip(false);
      setTimeout(() => setIsVisible(false), 200);
    }, 3000);
  };

  const handlePetClick = () => {
    setShowTooltip(false);
    
    if (petIsAlive) {
      setShowHearts(true);
      // Hide hearts and then pet after animation, then schedule next peek
      setTimeout(() => {
        setShowHearts(false);
        setTimeout(() => {
          setIsVisible(false);
          // Schedule next peek after clicking
          setTimeout(() => {
            const delay = 60000 + Math.random() * 120000; // 1-3 minutes
            setTimeout(() => {
              if (!isVisible) {
                triggerPeek();
              }
            }, delay);
          }, 100);
        }, 200);
      }, 2000);
    } else {
      // Dead pet shows ghosts instead of hearts
      setShowGhosts(true);
      setTimeout(() => {
        setShowGhosts(false);
        setTimeout(() => {
          setIsVisible(false);
          // Schedule next peek after clicking
          setTimeout(() => {
            const delay = 60000 + Math.random() * 120000;
            setTimeout(() => {
              if (!isVisible) {
                triggerPeek();
              }
            }, delay);
          }, 100);
        }, 200);
      }, 2000);
    }
  };

  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      (window as any).triggerPetPeek = triggerPeek;
    }
  }, [mounted]);

  if (!mounted || !shouldShow) {
    return null;
  }

  const getPositionStyles = () => {
    const baseClasses = "fixed z-[9998]";
    
    if (peekPosition === 'left') {
      return {
        className: `${baseClasses} left-0`,
        style: { top: `${peekHeight}%`, transform: 'translateY(-50%)' },
        initial: { x: "-50%", opacity: 0 },
        animate: { x: "-50%", opacity: 1 },
        exit: { x: "-100%", opacity: 0 }
      };
    } else {
      return {
        className: `${baseClasses} right-0`,
        style: { top: `${peekHeight}%`, transform: 'translateY(-50%)' },
        initial: { x: "50%", opacity: 0 },
        animate: { x: "50%", opacity: 1 },
        exit: { x: "100%", opacity: 0 }
      };
    }
  };

  const positionConfig = getPositionStyles();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={positionConfig.initial}
          animate={positionConfig.animate}
          exit={positionConfig.exit}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 25,
            duration: 0.5
          }}
          className={positionConfig.className}
          style={positionConfig.style}
          onClick={handlePetClick}
        >
          <motion.div
            className="relative cursor-pointer select-none"
            animate={petIsAlive ? { 
              scale: [1, 1.05, 1],
              rotate: [0, 2, 0, -2, 0]
            } : {
              // Dead pet has slower, more eerie movement
              scale: [1, 1.02, 1],
              rotate: [0, 1, 0, -1, 0]
            }}
            transition={petIsAlive ? { 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut" 
            } : {
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Pet emoji */}
            <motion.div
              className="text-6xl"
              initial={{
                rotateY: peekPosition === 'left' ? 180 : 0
              }}
              animate={petIsAlive ? {
                rotate: [0, -5, 0],
                scale: [1, 1.05, 1],
                rotateY: peekPosition === 'left' ? 180 : 0
              } : {
                // Dead pet has subtle floating/flickering effect
                rotate: [0, -2, 0],
                scale: [1, 1.02, 1],
                rotateY: peekPosition === 'left' ? 180 : 0,
                opacity: [0.8, 1, 0.8]
              }}
              transition={petIsAlive ? {
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                rotateY: { duration: 0 }
              } : {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                rotateY: { duration: 0 }
              }}
            >
              {petIsAlive ? "🐕" : "👻"}
            </motion.div>

            {/* Hearts animation for alive pets */}
            <AnimatePresence>
              {showHearts && petIsAlive && (
                <>
                  {/* Heart going right */}
                  <motion.div
                    className="absolute text-2xl top-0 left-8"
                    initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                    animate={{ 
                      opacity: [0, 1, 1, 0], 
                      scale: [0.5, 1.2, 1.2, 0.8],
                      x: 40,
                      y: -20
                    }}
                    transition={{
                      duration: 2,
                      ease: "easeOut"
                    }}
                  >
                    💖
                  </motion.div>
                  
                  {/* Heart going left */}
                  <motion.div
                    className="absolute text-2xl top-0 right-8"
                    initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                    animate={{ 
                      opacity: [0, 1, 1, 0], 
                      scale: [0.5, 1.2, 1.2, 0.8],
                      x: -40,
                      y: -30
                    }}
                    transition={{
                      duration: 2,
                      delay: 0.3,
                      ease: "easeOut"
                    }}
                  >
                    💖
                  </motion.div>
                  
                  {/* Heart going up */}
                  <motion.div
                    className="absolute text-2xl top-0 left-4"
                    initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                    animate={{ 
                      opacity: [0, 1, 1, 0], 
                      scale: [0.5, 1.2, 1.2, 0.8],
                      x: 0,
                      y: -40
                    }}
                    transition={{
                      duration: 2,
                      delay: 0.6,
                      ease: "easeOut"
                    }}
                  >
                    💖
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Ghost animation for dead pets */}
            <AnimatePresence>
              {showGhosts && !petIsAlive && (
                <>
                  {/* Ghost going right */}
                  <motion.div
                    className="absolute text-2xl top-0 left-8"
                    initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                    animate={{ 
                      opacity: [0, 0.8, 0.8, 0], 
                      scale: [0.5, 1.1, 1.1, 0.7],
                      x: 35,
                      y: -25
                    }}
                    transition={{
                      duration: 2.5,
                      ease: "easeOut"
                    }}
                  >
                    👻
                  </motion.div>
                  
                  {/* Ghost going left */}
                  <motion.div
                    className="absolute text-2xl top-0 right-8"
                    initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                    animate={{ 
                      opacity: [0, 0.8, 0.8, 0], 
                      scale: [0.5, 1.1, 1.1, 0.7],
                      x: -35,
                      y: -35
                    }}
                    transition={{
                      duration: 2.5,
                      delay: 0.4,
                      ease: "easeOut"
                    }}
                  >
                    👻
                  </motion.div>
                  
                  {/* Ghost going up */}
                  <motion.div
                    className="absolute text-2xl top-0 left-4"
                    initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                    animate={{ 
                      opacity: [0, 0.8, 0.8, 0], 
                      scale: [0.5, 1.1, 1.1, 0.7],
                      x: 5,
                      y: -45
                    }}
                    transition={{
                      duration: 2.5,
                      delay: 0.8,
                      ease: "easeOut"
                    }}
                  >
                    👻
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Tooltip */}
            <AnimatePresence>
              {showTooltip && !showHearts && !showGhosts && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  className={`absolute whitespace-nowrap px-2 py-1 bg-gray-800 text-white text-sm rounded-lg shadow-lg pointer-events-none ${
                    peekPosition === 'left' ? 'left-full ml-2' : 'right-full mr-2'
                  }`}
                  style={{
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                >
                  {petIsAlive ? "Woof! 🐾" : "...boo? 💀"}
                  
                  <div 
                    className={`absolute w-0 h-0 border-4 border-transparent top-1/2 -translate-y-1/2 ${
                      peekPosition === 'left'
                        ? 'left-0 -translate-x-full border-r-gray-800'
                        : 'right-0 translate-x-full border-l-gray-800'
                    }`}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};