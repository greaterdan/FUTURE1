"use client";
import React, { useEffect, useRef, useState } from "react";
import NavigationHub from "./NavigationHub";

interface RadialVideoButtonsProps {
  isNavigationHubOpen: boolean;
  setIsNavigationHubOpen: (open: boolean) => void;
  isScopeOpen: boolean;
  setIsScopeOpen: (open: boolean) => void;
}

export default function RadialVideoButtons({ isNavigationHubOpen, setIsNavigationHubOpen, isScopeOpen, setIsScopeOpen }: RadialVideoButtonsProps) {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [rotation, setRotation] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [visibleButtons, setVisibleButtons] = useState<number[]>([]);
  const animationRef = useRef<number | undefined>(undefined);

  const BUTTONS = [
    { pos: "top",    src: "/1.webm", alt: "Top",    onClick: () => setIsNavigationHubOpen(true) },
    { pos: "right",  src: "/2.webm", alt: "Right",  onClick: () => console.log("Right") },
    { pos: "bottom", src: "/3.webm", alt: "Bottom", onClick: () => setIsScopeOpen(true) },
    { pos: "left",   src: "/4.webm", alt: "Left",   onClick: () => console.log("Left") },
  ];

  useEffect(() => {
    // Force videos to load and play
    videoRefs.current.forEach((video, index) => {
      if (video) {
        video.load();
        video.play().catch(e => console.error(`Video ${index} play error:`, e));
      }
    });
  }, []);

  // Staggered appearance of buttons after zoom animation
  useEffect(() => {
    const timer = setTimeout(() => {
      // Start appearing buttons one by one with 300ms delay between each
      const showButtons = () => {
        setVisibleButtons(prev => {
          if (prev.length < 4) {
            return [...prev, prev.length];
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
  }, []);

  useEffect(() => {
    // Start rotation immediately when zoom finishes (when first button appears)
    if (visibleButtons.length > 0) {
      const animate = () => {
        if (!isHovering) {
          const speed = isNavigationHubOpen ? -0.2 : -0.5; // slower when hub open
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
  }, [isHovering, visibleButtons.length, isNavigationHubOpen]);

  return (
    <>
      <div className="fixed inset-0 z-[30] pointer-events-none">
        <div 
          className="absolute top-1/2 left-[75%] -translate-y-1/2 pointer-events-none"
          style={{
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {BUTTONS.map(({ pos, src, alt, onClick }, index) => (
            <div
              key={pos}
              className="absolute w-20 h-20 rounded-full pointer-events-auto cursor-pointer overflow-hidden transition-opacity duration-500"
              style={{
                left: pos === "left" ? "-420px" : pos === "right" ? "420px" : "0px",
                top: pos === "top" ? "-420px" : pos === "bottom" ? "420px" : "0px",
                transform: "translate(-50%, -50%)",
                backgroundColor: "transparent",
                opacity: visibleButtons.includes(index) ? 1 : 0,
              }}
              onClick={onClick}
              onMouseEnter={(e) => {
                setHoveredButton(pos);
                setMousePosition({ x: e.clientX, y: e.clientY });
              }}
              onMouseMove={(e) => {
                if (hoveredButton === pos) {
                  setMousePosition({ x: e.clientX, y: e.clientY });
                }
              }}
              onMouseLeave={() => setHoveredButton(null)}
            >
              <video
                ref={(el) => {
                  videoRefs.current[index] = el;
                }}
                src={src}
                muted
                playsInline
                autoPlay
                loop
                preload="auto"
                className="w-full h-full object-cover"
                onError={(e) => console.error(`Video ${src} failed:`, e)}
                onLoadStart={() => console.log(`Loading: ${src}`)}
                onCanPlay={() => console.log(`Can play: ${src}`)}
              />
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
      
      {/* Navigation Hub */}
      <NavigationHub 
        isOpen={isNavigationHubOpen} 
        onClose={() => setIsNavigationHubOpen(false)} 
      />
    </>
  );
}
