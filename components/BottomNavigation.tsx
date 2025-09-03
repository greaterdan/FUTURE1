"use client";
import React, { useEffect, useState, useRef } from "react";

interface BottomNavigationProps {
  isNavigationHubOpen?: boolean;
  isOracleHubOpen?: boolean;
}

export default function BottomNavigation({ isNavigationHubOpen = false, isOracleHubOpen = false }: BottomNavigationProps) {
  const [visibleButtons, setVisibleButtons] = useState<number[]>([]);
  const [position, setPosition] = useState({ x: 0, y: 0 }); // 0 = center, 1 = right
  const animationRef = useRef<number | undefined>(undefined);
  const targetPosition = isNavigationHubOpen ? 1 : 0;

  // Check if buttons have appeared before on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const buttonsAppeared = sessionStorage.getItem('bottomNavButtonsHaveAppeared');
      if (buttonsAppeared === 'true') {
        // If buttons have appeared before, show them immediately
        setVisibleButtons([0, 1, 2]);
      }
    }
  }, []);

  // Smooth position animation using requestAnimationFrame
  useEffect(() => {
    const animate = () => {
      setPosition(prev => {
        const diff = targetPosition - prev.x;
        const step = diff * 0.08; // Smooth easing factor
        
        if (Math.abs(diff) < 0.01) {
          return { x: targetPosition, y: prev.y };
        }
        
        return { x: prev.x + step, y: prev.y };
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetPosition]);

  // Staggered appearance after webm icons (which finish at ~6.3s) - ONLY ON FIRST VISIT
  useEffect(() => {
    // If buttons have already appeared, don't animate again
    if (visibleButtons.length === 3) return;

    const timer = setTimeout(() => {
      // Start appearing buttons one by one with 400ms delay between each
      const showButtons = () => {
        setVisibleButtons(prev => {
          if (prev.length < 3) {
            const newButtons = [...prev, prev.length];
            // Mark as appeared when all buttons are shown
            if (newButtons.length === 3) {
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('bottomNavButtonsHaveAppeared', 'true');
              }
            }
            return newButtons;
          }
          return prev;
        });
      };

      // Show first button immediately, then stagger the rest
      showButtons();
      const interval = setInterval(() => {
        showButtons();
      }, 400);

      return () => clearInterval(interval);
    }, 7000); // Wait for webm icons to finish appearing (~6.3s) + buffer

    return () => clearTimeout(timer);
  }, [visibleButtons.length]);

  // Calculate position based on animation state
  const centerX = typeof window !== 'undefined' ? window.innerWidth / 2 : 0;
  const rightX = typeof window !== 'undefined' ? window.innerWidth - 100 : 0; // 100px from right edge for closer positioning
  const currentX = centerX + (rightX - centerX) * position.x;

  // Hide completely when Oracle is open
  if (isOracleHubOpen) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-8 z-50 flex items-center space-x-6"
      style={{
        left: `${currentX}px`,
        transform: 'translateX(-50%)',
      }}
    >
      {/* X (Twitter) Button */}
      <button
        onClick={() => window.open('https://x.com', '_blank')}
        className="w-12 h-12 flex items-center justify-center hover:scale-125 hover:drop-shadow-lg transition-all duration-300"
        style={{
          opacity: visibleButtons.includes(0) ? 1 : 0,
        }}
      >
        <svg 
          className="w-6 h-6 text-white hover:text-white/80 transition-colors duration-300" 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </button>

      {/* GitHub Button */}
      <button
        onClick={() => window.open('https://github.com', '_blank')}
        className="w-12 h-12 flex items-center justify-center hover:scale-125 hover:drop-shadow-lg transition-all duration-300"
        style={{
          opacity: visibleButtons.includes(1) ? 1 : 0,
        }}
      >
        <svg 
          className="w-6 h-6 text-white hover:text-white/80 transition-colors duration-300" 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      </button>

      {/* Document Button */}
      <button
        onClick={() => window.open('/documentation', '_blank')}
        className="w-12 h-12 flex items-center justify-center hover:scale-125 hover:drop-shadow-lg transition-all duration-300"
        style={{
          opacity: visibleButtons.includes(2) ? 1 : 0,
        }}
      >
        <svg 
          className="w-6 h-6 text-white hover:text-white/80 transition-colors duration-300" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </button>
    </div>
  );
}
