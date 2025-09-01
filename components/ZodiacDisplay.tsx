"use client";
import React, { useEffect, useState } from "react";

interface ZodiacDisplayProps {
  zodiacSign: string;
  onComplete: () => void;
}

export default function ZodiacDisplay({ zodiacSign, onComplete }: ZodiacDisplayProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show zodiac display after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);

    // Auto-complete after showing zodiac for 3 seconds
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3500);

    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const getZodiacColor = (sign: string): string => {
    // Map zodiac signs to colors
    const zodiacColors: { [key: string]: string } = {
      aries: "#FF6B6B",
      taurus: "#4ECDC4", 
      gemini: "#45B7D1",
      cancer: "#96CEB4",
      leo: "#FFEAA7",
      virgo: "#DDA0DD",
      libra: "#98D8C8",
      scorpio: "#F7DC6F",
      sagittarius: "#BB8FCE",
      capricorn: "#85C1E9",
      aquarius: "#F8C471",
      pisces: "#82E0AA"
    };
    
    return zodiacColors[sign] || "#FF6B6B";
  };

  return (
    <div 
      className={`fixed inset-0 bg-black flex items-center justify-center z-[90] transition-opacity duration-1000 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="text-center space-y-8">
        <h2 className="text-5xl font-bold text-white mb-8 capitalize" style={{ fontFamily: 'VT323, monospace' }}>
          {zodiacSign}
        </h2>
        
        <div className="w-96 h-96 mx-auto">
          <video
            src={getZodiacVideo(zodiacSign)}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => console.error(`Zodiac video failed to load: ${zodiacSign}`, e)}
          />
        </div>
        
        <p className="text-xl text-white/80" style={{ fontFamily: 'VT323, monospace' }}>
          Welcome to your cosmic journey
        </p>
      </div>
    </div>
  );
}
