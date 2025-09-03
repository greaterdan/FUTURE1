"use client";
import React, { useEffect, useState } from "react";

interface OracleHubProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OracleHub({ isOpen, onClose }: OracleHubProps) {
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
      {/* No backdrop - removed to prevent any dimming of the left geometry */}
      
      {/* Oracle Hub - STRICTLY constrained to right half only */}
      <div 
        className={`fixed right-0 top-0 h-full w-1/2 bg-black border-l border-white/20 z-[60] transition-all duration-700 ease-in-out flex flex-col overflow-hidden ${
          animateIn ? 'translate-x-0' : 'translate-x-full'
        } ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        style={{
          backgroundColor: '#000000', // Fully opaque solid black base
          maxWidth: '50vw', // Ensure it never exceeds 50% viewport width
          boxSizing: 'border-box', // Ensure padding/borders don't extend beyond bounds
        }}
      >
        <button
          onClick={onClose}
          className="hub-close-button absolute top-6 left-6 text-white/60 hover:text-white transition-colors duration-200 z-50"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Header */}
        <div className="p-8 border-b border-white/20">
          <h1 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'VT323, monospace' }}>
            Oracle
          </h1>
          <p className="text-white/80 text-lg leading-relaxed" style={{ fontFamily: 'VT323, monospace' }}>
            Retrocausality made conversational. AI agents debate trades as if tomorrow already happened, weaving time-bent insights into a market outlook.
          </p>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 p-8 overflow-auto">
          <div className="space-y-8">
            {/* AI Agents Section */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'VT323, monospace' }}>
                AI Agents
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/20 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'VT323, monospace' }}>
                    Bull Agent
                  </h3>
                  <p className="text-white/70 text-sm" style={{ fontFamily: 'VT323, monospace' }}>
                    Optimistic AI that sees upward potential in every market movement.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/20 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'VT323, monospace' }}>
                    Bear Agent
                  </h3>
                  <p className="text-white/70 text-sm" style={{ fontFamily: 'VT323, monospace' }}>
                    Cautious AI that identifies risks and downward trends.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/20 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'VT323, monospace' }}>
                    Quantum Agent
                  </h3>
                  <p className="text-white/70 text-sm" style={{ fontFamily: 'VT323, monospace' }}>
                    AI that operates in superposition, considering all possible outcomes simultaneously.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/20 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'VT323, monospace' }}>
                    Retrocausal Agent
                  </h3>
                  <p className="text-white/70 text-sm" style={{ fontFamily: 'VT323, monospace' }}>
                    AI that reasons backwards from future outcomes to present decisions.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Market Insights Section */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'VT323, monospace' }}>
                Time-Bent Insights
              </h2>
              <div className="bg-white/5 border border-white/20 rounded-lg p-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                    <div>
                      <h4 className="text-white font-bold" style={{ fontFamily: 'VT323, monospace' }}>
                        Future Market Sentiment
                      </h4>
                      <p className="text-white/70 text-sm" style={{ fontFamily: 'VT323, monospace' }}>
                        AI agents debate the emotional state of tomorrow's traders.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                    <div>
                      <h4 className="text-white font-bold" style={{ fontFamily: 'VT323, monospace' }}>
                        Quantum Price Probabilities
                      </h4>
                      <p className="text-white/70 text-sm" style={{ fontFamily: 'VT323, monospace' }}>
                        Superposition of all possible price movements.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                    <div>
                      <h4 className="text-white font-bold" style={{ fontFamily: 'VT323, monospace' }}>
                        Retrocausal Patterns
                      </h4>
                      <p className="text-white/70 text-sm" style={{ fontFamily: 'VT323, monospace' }}>
                        How future events influence present market behavior.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
