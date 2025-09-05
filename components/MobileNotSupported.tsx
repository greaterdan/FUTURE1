"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function MobileNotSupported() {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth < 1024; // Less than desktop breakpoint
      
      setIsMobile(isMobileDevice || isSmallScreen);
      setIsLoading(false);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isMobile) {
    return null; // Don't show on desktop
  }

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md mx-auto"
      >
        {/* Logo/Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-cyan-400 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        {/* Main Message */}
        <h1 className="text-3xl font-bold text-white mb-4">
          Desktop Only
        </h1>
        
        <p className="text-gray-300 text-lg mb-6 leading-relaxed">
          FUTURE is currently optimized for desktop experience only.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">Mobile Version</h2>
          </div>
          <p className="text-cyan-400 text-lg font-medium">
            Coming Soon
          </p>
        </div>

        {/* Features that need desktop */}
        <div className="space-y-3 mb-8">
          <div className="flex items-center text-gray-400">
            <svg className="w-5 h-5 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Advanced trading interface</span>
          </div>
          <div className="flex items-center text-gray-400">
            <svg className="w-5 h-5 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Drag & drop AI companions</span>
          </div>
          <div className="flex items-center text-gray-400">
            <svg className="w-5 h-5 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Real-time market data</span>
          </div>
          <div className="flex items-center text-gray-400">
            <svg className="w-5 h-5 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Quantum geometry visualizations</span>
          </div>
        </div>

        {/* Call to action */}
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-4">
            Please visit us on a desktop or laptop for the full experience
          </p>
          <div className="flex justify-center space-x-4">
            <a 
              href="https://twitter.com/yourhandle" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
            >
              Follow for updates
            </a>
            <span className="text-gray-600">•</span>
            <a 
              href="mailto:contact@yourdomain.com" 
              className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
            >
              Contact us
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
