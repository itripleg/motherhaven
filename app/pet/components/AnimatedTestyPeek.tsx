// pet/components/AnimatedTestyPeek.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

interface AnimatedTestyPeekProps {
  petIsAlive?: boolean;
  petName?: string;
}

export const AnimatedTestyPeek: React.FC<AnimatedTestyPeekProps> = ({
  petIsAlive = true,
  petName = "Testy",
}) => {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Calculate isStatusTab first
  const isStatusTab = pathname === "/pet" || (pathname?.includes("/pet") && !pathname.includes("community") && !pathname.includes("feeding"));

  // ALL HOOKS MUST BE AT THE TOP - NO CONDITIONAL HOOKS
  useEffect(() => {
    setMounted(true);
    console.log("AnimatedTestyPeek mounted!");
  }, []);

  // Interval effect - always runs but checks conditions inside
  useEffect(() => {    
    if (!mounted) return; // Check condition inside the effect
    
    console.log("Setting up interval, isStatusTab:", isStatusTab);
    
    const interval = setInterval(() => {
      console.log("Interval tick - isStatusTab:", isStatusTab);
      if (!isStatusTab) {
        console.log("Auto-showing peek!");
        setIsVisible(true);
        setTimeout(() => {
          console.log("Auto-hiding peek!");
          setIsVisible(false);
        }, 2000);
      } else {
        console.log("On status tab, skipping auto-peek");
      }
    }, 3000);

    return () => {
      console.log("Cleaning up interval");
      clearInterval(interval);
    };
  }, [mounted, isStatusTab]);

  // Log every render
  console.log("RENDER - Pathname:", pathname);
  console.log("RENDER - Is status tab:", isStatusTab);
  console.log("RENDER - Should show component:", !isStatusTab);
  console.log("RENDER - isVisible:", isVisible);

  // Early returns AFTER all hooks
  if (!mounted) {
    console.log("Not mounted yet");
    return null;
  }

  if (isStatusTab) {
    console.log("On status tab, hiding component");
    return null;
  }

  const showPeek = () => {
    console.log("Showing peek!");
    setIsVisible(true);
    setTimeout(() => {
      console.log("Hiding peek!");
      setIsVisible(false);
    }, 3000);
  };

  return (
    <div>
      {/* Always visible test button */}
      <button
        onClick={showPeek}
        className="fixed top-4 right-4 z-[9999] bg-red-500 text-white px-4 py-2 rounded font-bold"
        style={{ 
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: 9999,
          backgroundColor: 'red',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '4px',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        TEST PEEK
      </button>

      {/* Always visible indicator */}
      <div
        className="fixed top-20 right-4 z-[9999] bg-blue-500 text-white px-2 py-1 rounded text-xs"
        style={{
          position: 'fixed',
          top: '80px',
          right: '16px',
          zIndex: 9999,
          backgroundColor: 'blue',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px'
        }}
      >
        Component Active: {mounted ? 'YES' : 'NO'}
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: "0%", opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            className="fixed right-4 top-1/2 -translate-y-1/2 z-[9998]"
            style={{
              position: 'fixed',
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 9998
            }}
          >
            <div
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl border-2 border-primary max-w-sm"
              style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                border: '2px solid #3b82f6',
                maxWidth: '320px'
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="text-4xl">🐕</div>
                <div>
                  <div className="font-bold text-lg">{petName}</div>
                  <div className="text-sm text-gray-600">
                    {petIsAlive ? "Your pet" : "Needs revival"}
                  </div>
                </div>
              </div>
              <div className="text-sm">
                Hey there! This is a test peek! 👋
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};