"use client";
import React, { useEffect, useRef, useState } from "react";
import NavigationHub from "./NavigationHub";
import OracleHub from "./OracleHub";

interface RadialVideoButtonsProps {
  isNavigationHubOpen: boolean;
  setIsNavigationHubOpen: (open: boolean) => void;
  isScopeOpen: boolean;
  setIsScopeOpen: (open: boolean) => void;
  isOracleHubOpen: boolean;
  setIsOracleHubOpen: (open: boolean) => void;
}

export default function RadialVideoButtons({ isNavigationHubOpen, setIsNavigationHubOpen, isScopeOpen, setIsScopeOpen, isOracleHubOpen, setIsOracleHubOpen }: RadialVideoButtonsProps) {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [rotation, setRotation] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [visibleButtons, setVisibleButtons] = useState<number[]>([]);
  const [isRotationPaused, setIsRotationPaused] = useState(false);
  const animationRef = useRef<number | undefined>(undefined);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [hasButtonsAppeared, setHasButtonsAppeared] = useState(false);

  // Smooth hover handling without jumping
  const handleMouseEnter = (pos: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Set hover state immediately but smoothly
    setHoveredButton(pos);
    setMousePosition({ x: e.clientX, y: e.clientY });
    
    // Pause rotation smoothly
    setIsRotationPaused(true);
    
    // Clear any existing timeout
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Clear hover state immediately
    setHoveredButton(null);
    
    // Resume rotation with minimal delay
    pauseTimeoutRef.current = setTimeout(() => {
      setIsRotationPaused(false);
    }, 50); // Very short delay to prevent interference
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Only update position if hovering and moved significantly
    if (hoveredButton) {
      setMousePosition(prev => {
        const deltaX = Math.abs(e.clientX - prev.x);
        const deltaY = Math.abs(e.clientY - prev.y);
        
        // Only update if mouse moved significantly to prevent micro-jumps
        if (deltaX > 5 || deltaY > 5) {
          return { x: e.clientX, y: e.clientY };
        }
        return prev;
      });
    }
  };

  const BUTTONS = [
    { pos: "top",    color: "#FF6B6B", alt: "Top",    onClick: () => setIsNavigationHubOpen(true), video: "/1.webm" },
    { pos: "right",  color: "#4ECDC4", alt: "Right",  onClick: () => console.log("Right"), video: "/2.webm" },
    { pos: "bottom", color: "#45B7D1", alt: "Bottom", onClick: () => {
      console.log("🎯 BOTTOM BUTTON CLICKED - Setting isScopeOpen to true");
      console.log("🎯 BEFORE: isScopeOpen should be false");
      console.log("🎯 Button click handler executed successfully");
      console.log("🎯 About to call setIsScopeOpen(true)");
      
      try {
        setIsScopeOpen(true);
        console.log("🎯 AFTER: setIsScopeOpen(true) called successfully");
        
        // Force a re-render to see the state change
        setTimeout(() => {
          console.log("🎯 DELAYED CHECK: isScopeOpen should still be true");
        }, 100);
      } catch (error) {
        console.error("🎯 ERROR in button click handler:", error);
      }
    }, video: "/3.webm" },
    { pos: "left",   color: "#96CEB4", alt: "Left",   onClick: () => setIsOracleHubOpen(true), video: "/4.webm" },
  ];

  // Debug: Log when buttons are rendered (but only when state changes to avoid infinite loops)
  useEffect(() => {
    console.log("🎯 BUTTONS STATE CHANGED - isScopeOpen:", isScopeOpen, "isNavigationHubOpen:", isNavigationHubOpen, "isOracleHubOpen:", isOracleHubOpen);
  }, [isScopeOpen, isNavigationHubOpen, isOracleHubOpen]);

  // Removed video loading effect since we're using colored buttons now

  // Check if buttons have appeared before on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const buttonsAppeared = sessionStorage.getItem('buttonsHaveAppeared');
      setHasButtonsAppeared(buttonsAppeared === 'true');
    }
  }, []);

  // Staggered appearance of buttons after zoom animation, or show all immediately if any hub is open
  useEffect(() => {
    // If any hub is open, show all buttons immediately
    if (isNavigationHubOpen || isScopeOpen || isOracleHubOpen) {
      setVisibleButtons([0, 1, 2, 3]);
      return;
    }

    // If buttons have appeared before, show them immediately
    if (hasButtonsAppeared) {
      setVisibleButtons([0, 1, 2, 3]);
      return;
    }

    const timer = setTimeout(() => {
      // Start appearing buttons one by one with 800ms delay between each
      const showButtons = () => {
        setVisibleButtons(prev => {
          if (prev.length < 4) {
            const newButtons = [...prev, prev.length];
            // Mark as appeared when all buttons are shown
            if (newButtons.length === 4) {
              setHasButtonsAppeared(true);
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('buttonsHaveAppeared', 'true');
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
      }, 800);

      return () => clearInterval(interval);
    }, 3500); // Wait for zoom animation to fully complete (zoom takes ~3.5 seconds)

    return () => clearTimeout(timer);
  }, [isNavigationHubOpen, isScopeOpen, isOracleHubOpen, hasButtonsAppeared]);

  useEffect(() => {
    // Start rotation immediately when zoom finishes (when first button appears)
    if (visibleButtons.length > 0) {
      const animate = () => {
        // Only rotate when not paused
        if (!isRotationPaused) {
          // Adjust speed based on which hub is open
          let speed = -0.3; // Slower, smoother speed
          if (isNavigationHubOpen) speed = -0.15;
          if (isOracleHubOpen) speed = -0.2;
          
          setRotation(prev => prev + speed);
        }
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animationRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [visibleButtons.length, isNavigationHubOpen, isOracleHubOpen, isRotationPaused]);

  return (
    <>
      <div className="fixed inset-0 z-[30] pointer-events-none radial-video-buttons">
        <div 
          className={`absolute top-1/2 -translate-y-1/2 pointer-events-auto transition-all duration-500 ease-out rotating-container ${
            isOracleHubOpen ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
          }`}
          style={{
            left: '75%',
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          }}
        >
          {BUTTONS.map(({ pos, color, alt, onClick }, index) => (
            <div
              key={pos}
              className="absolute w-20 h-20 rounded-full pointer-events-auto cursor-pointer overflow-hidden webm-button"
              style={{
                left: pos === "left" ? "-420px" : pos === "right" ? "420px" : "0px",
                top: pos === "top" ? "-420px" : pos === "bottom" ? "420px" : "0px",
                transform: "translate(-50%, -50%)",
                backgroundColor: "transparent",
                opacity: visibleButtons.includes(index) ? 1 : 0,
              }}
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              onMouseEnter={(e) => handleMouseEnter(pos, e)}
              onMouseMove={(e) => handleMouseMove(e)}
              onMouseLeave={(e) => handleMouseLeave(e)}
            >
              <div 
                className="w-full h-full rounded-full overflow-hidden transition-all duration-300 ease-out"
                style={{ 
                  animation: 'pulse 2s infinite',
                  opacity: hoveredButton === pos ? 1 : 0.85,
                  filter: hoveredButton === pos ? 'brightness(1.3) saturate(1.1)' : 'brightness(1) saturate(1)',
                  transform: hoveredButton === pos ? 'scale(1.02)' : 'scale(1)',
                }}
              >
                <video
                  src={BUTTONS[index].video}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Tooltip for Navigation Hub */}
      {hoveredButton === "top" && (
        <div 
          className="fixed z-[60] bg-black/90 border border-white/20 rounded-lg p-4 text-white max-w-xs pointer-events-none"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 10,
            transform: 'translateY(-100%)',
            fontFamily: 'VT323, monospace',
          }}
        >
          <div className="text-lg font-bold mb-2">Retrocausal Lab</div>
          <div className="text-sm text-white/80 leading-relaxed">
            Wallet movements, buyer and seller volume, and trading patterns all feed into one predictive model — explained through the retrocausal lens of the quantum eraser.
          </div>
        </div>
      )}
      
      {/* Tooltip for Scope */}
      {hoveredButton === "bottom" && (
        <div 
          className="fixed z-[60] bg-black/90 border border-white/20 rounded-lg p-4 text-white max-w-xs pointer-events-none"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 10,
            transform: 'translateY(-100%)',
            fontFamily: 'VT323, monospace',
          }}
        >
          <div className="text-lg font-bold mb-2">Scope</div>
          <div className="text-sm text-white/80 leading-relaxed">
            Watch new tokens emerge in real time. Predictions are drawn from wallet flows, trading volume, and zodiac patterns, modeled through retrocausal logic of the quantum eraser.
          </div>
        </div>
      )}
      
      {/* Tooltip for Oracle */}
      {hoveredButton === "left" && (
        <div 
          className="fixed z-[60] bg-black/90 border border-white/20 rounded-lg p-4 text-white max-w-xs pointer-events-none"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 10,
            transform: 'translateY(-100%)',
            fontFamily: 'VT323, monospace',
          }}
        >
          <div className="text-lg font-bold mb-2">Oracle</div>
          <div className="text-sm text-white/80 leading-relaxed">
            Retrocausality made conversational. AI agents debate trades as if tomorrow already happened, weaving time-bent insights into a market outlook.
          </div>
        </div>
      )}
      
      {/* Navigation Hub */}
      <NavigationHub 
        isOpen={isNavigationHubOpen} 
        onClose={() => setIsNavigationHubOpen(false)} 
      />
      
      {/* Oracle Hub */}
      <OracleHub 
        isOpen={isOracleHubOpen} 
        onClose={() => setIsOracleHubOpen(false)} 
      />
    </>
  );
}
