"use client";
import React, { useEffect, useState } from "react";
import QuantumEraserSketch from "./QuantumEraserSketch";
import SolanaTransactions from "./SolanaTransactions";

interface NavigationHubProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NavigationHub({ isOpen, onClose }: NavigationHubProps) {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const id = requestAnimationFrame(() => setAnimateIn(true));
      return () => cancelAnimationFrame(id);
    } else {
      setAnimateIn(false);
    }
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 z-[40] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Navigation Hub */}
      <div 
        className={`fixed left-0 top-0 h-full w-1/2 bg-black/90 border-r border-white/20 z-[50] transition-transform duration-500 ease-out flex flex-col ${
          animateIn ? 'translate-x-0' : '-translate-x-full'
        } ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        style={{
          background: 'radial-gradient(circle at center bottom, #000000, #111111)',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors duration-200 z-50"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Upper half: p5.js Quantum Eraser Sketch */}
        <div className="h-1/2 w-full">
          <QuantumEraserSketch />
        </div>
        
        {/* Bottom half: Solana Transactions */}
        <div className="h-1/2 w-full overflow-auto p-8">
          <SolanaTransactions />
        </div>
      </div>
    </>
  );
}
