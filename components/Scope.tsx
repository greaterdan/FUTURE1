"use client";
import React from "react";
import ScopeBoard from "./ScopeBoard";

interface ScopeProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Scope({ isOpen, onClose }: ScopeProps) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[40] transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      
      {/* Scope Modal */}
      <div 
        className={`fixed inset-0 z-[50] transition-all duration-500 ease-out flex items-center justify-center ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
        style={{
          background: 'radial-gradient(circle at center bottom, #000000, #111111)',
        }}
      >
        <div className="w-full h-full overflow-auto relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors duration-200 z-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <ScopeBoard />
        </div>
      </div>
    </>
  );
}
