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

  const getZodiacVideo = (sign: string): string => {
    // Map zodiac signs to .webm files (all converted for web compatibility)
    const zodiacVideos: { [key: string]: string } = {
      aries: "/zodiac/aries.webm",
      taurus: "/zodiac/taurus.webm",
      gemini: "/zodiac/gemini.webm",
      cancer: "/zodiac/cancer.webm",
      leo: "/zodiac/leo.webm",
      virgo: "/zodiac/virgo.webm",
      libra: "/zodiac/libra.webm",
      scorpio: "/zodiac/scorpio.webm",
      sagittarius: "/zodiac/sagittarius.webm",
      capricorn: "/zodiac/capricorn.webm",  
      aquarius: "/zodiac/aquarius.webm",
      pisces: "/zodiac/pisces.webm"
    };
    
    return zodiacVideos[sign] || "/zodiac/aries.webm";
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
