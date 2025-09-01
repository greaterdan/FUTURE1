"use client";
import React, { useState, useEffect, useRef } from "react";
import BirthdayCursor from "./BirthdayCursor";

interface BirthdayEntryProps {
  onBirthdaySubmit: (birthday: Date) => void;
}

export default function BirthdayEntry({ onBirthdaySubmit }: BirthdayEntryProps) {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const dayInputRef = useRef<HTMLInputElement>(null);
  const monthInputRef = useRef<HTMLInputElement>(null);
  const yearInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showZodiac, setShowZodiac] = useState(false);
  const [titleText, setTitleText] = useState("");
  const [titleIndex, setTitleIndex] = useState(0);
  const [showInputs, setShowInputs] = useState(false);
  const [visibleInputs, setVisibleInputs] = useState<number[]>([]);
  const [showLogos, setShowLogos] = useState(false);
  const [visibleLogos, setVisibleLogos] = useState<number[]>([]);

  const handleSubmit = () => {
    if (day && month && year) {
      setIsSubmitted(true);
      const birthday = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      onBirthdaySubmit(birthday);
    }
  };

  const validateAndSetDay = (value: string) => {
    // Allow empty string or numbers 0-31 (including leading zeros)
    if (value === "" || /^[0-9]{1,2}$/.test(value)) {
      const num = parseInt(value);
      if (value === "" || (num >= 0 && num <= 31)) {
        setDay(value);
        // Auto-focus to month when day is complete (1-2 digits and valid)
        if (value.length >= 1 && num >= 1 && num <= 31) {
          setTimeout(() => monthInputRef.current?.focus(), 100);
        }
      }
    }
  };

  const validateAndSetMonth = (value: string) => {
    // Allow empty string or numbers 0-12 (including leading zeros)
    if (value === "" || /^[0-9]{1,2}$/.test(value)) {
      const num = parseInt(value);
      if (value === "" || (num >= 0 && num <= 12)) {
        setMonth(value);
        // Auto-focus to year when month is complete (1-2 digits and valid)
        if (value.length >= 1 && num >= 1 && num <= 12) {
          setTimeout(() => yearInputRef.current?.focus(), 100);
        }
      }
    }
  };

  const validateAndSetYear = (value: string) => {
    // Allow any numeric input up to 4 digits
    if (value === "" || /^\d{1,4}$/.test(value)) {
      setYear(value);
    }
  };

  const getZodiacSign = (date: Date): string => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "aries";
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "taurus";
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "gemini";
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "cancer";
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "leo";
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "virgo";
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "libra";
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "scorpio";
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "sagittarius";
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "capricorn";
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "aquarius";
    return "pisces";
  };

  useEffect(() => {
    if (isSubmitted) {
      const timer = setTimeout(() => {
        setShowZodiac(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isSubmitted]);

  // Typewriter effect for title
  useEffect(() => {
    const title = "Enter Your Birthday";
    if (titleIndex < title.length) {
      const timer = setTimeout(() => {
        setTitleText(title.slice(0, titleIndex + 1));
        setTitleIndex(titleIndex + 1);
      }, 100);
      return () => clearTimeout(timer);
    } else if (titleIndex === title.length) {
      // Start showing inputs after title is complete
      setTimeout(() => setShowInputs(true), 500);
    }
  }, [titleIndex]);

  // Staggered appearance of inputs
  useEffect(() => {
    if (showInputs) {
      const timer = setTimeout(() => {
        setVisibleInputs(prev => {
          if (prev.length < 3) {
            return [...prev, prev.length];
          }
          return prev;
        });
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [showInputs, visibleInputs.length]);

  // Start showing logos after all inputs are visible
  useEffect(() => {
    if (visibleInputs.length === 3) {
      setTimeout(() => setShowLogos(true), 1500); // Wait 1.5 seconds after all inputs are visible
    }
  }, [visibleInputs.length]);

  // Staggered appearance of logos
  useEffect(() => {
    if (showLogos) {
      const timer = setTimeout(() => {
        setVisibleLogos(prev => {
          if (prev.length < 4) {
            return [...prev, prev.length];
          }
          return prev;
        });
      }, 300); // Slower appearance for more dramatic slide-in effect

      return () => clearTimeout(timer);
    }
  }, [showLogos, visibleLogos.length]);

  // Auto-submit when all fields are filled with valid complete dates
  useEffect(() => {
    if (day && month && year && !isSubmitted) {
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      
      // Check if all fields have complete valid values (excluding 0)
      if (dayNum >= 1 && dayNum <= 31 && 
          monthNum >= 1 && monthNum <= 12 && 
          yearNum >= 1900 && yearNum <= 2024) {
        handleSubmit();
      }
    }
  }, [day, month, year, isSubmitted]);

  if (showZodiac && day && month && year) {
    const birthday = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const zodiacSign = getZodiacSign(birthday);
    
    return (
      <div className="fixed inset-0 bg-black flex flex-col justify-center items-center z-[100]">
        <div className="text-center space-y-8 transition-opacity duration-1000">
          <h1 className="text-4xl font-bold text-white mb-8" style={{ fontFamily: 'VT323, monospace' }}>
            Your Zodiac Sign
          </h1>
          <p className="text-6xl font-bold capitalize text-white" style={{ fontFamily: 'VT323, monospace' }}>
            {zodiacSign}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col justify-center items-center z-[100]">
      <BirthdayCursor />
      <div className="text-center space-y-8">
        <h1 className="text-4xl font-bold text-white mb-8 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ fontFamily: 'VT323, monospace' }}>
          {showZodiac ? 'Your Zodiac Sign' : titleText}
          {!showZodiac && (
            <span className="animate-pulse">|</span>
          )}
        </h1>
        
        {!showZodiac ? (
          <div className="flex space-x-4 justify-center">
            <input
              ref={dayInputRef}
              type="text"
              placeholder="Day"
              value={day}
              onChange={(e) => validateAndSetDay(e.target.value)}
              className={`w-20 px-4 py-3 bg-black/20 border-2 border-white/60 rounded-lg text-white text-lg focus:outline-none focus:border-white/80 transition-all duration-500 text-center ${
                visibleInputs.includes(0) ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
              style={{ fontFamily: 'VT323, monospace' }}
              maxLength={2}
            />
            <input
              ref={monthInputRef}
              type="text"
              placeholder="Month"
              value={month}
              onChange={(e) => validateAndSetMonth(e.target.value)}
              className={`w-24 px-4 py-3 bg-black/20 border-2 border-white/60 rounded-lg text-white text-lg focus:outline-none focus:border-white/80 transition-all duration-500 text-center ${
                visibleInputs.includes(1) ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
              style={{ fontFamily: 'VT323, monospace' }}
              maxLength={2}
            />
            <input
              ref={yearInputRef}
              type="text"
              placeholder="Year"
              value={year}
              onChange={(e) => validateAndSetYear(e.target.value)}
              className={`w-24 px-4 py-3 bg-black/20 border-2 border-white/60 rounded-lg text-white text-lg focus:outline-none focus:border-white/80 transition-all duration-500 text-center ${
                visibleInputs.includes(2) ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
              style={{ fontFamily: 'VT323, monospace' }}
              maxLength={4}
            />
          </div>
        ) : (
          <p className="text-6xl font-bold capitalize text-white" style={{ fontFamily: 'VT323, monospace' }}>
            {day && month && year ? getZodiacSign(new Date(parseInt(year), parseInt(month) - 1, parseInt(day))) : ''}
          </p>
        )}
      </div>

      {/* AI Logos - Fixed to bottom */}
      <div className={`absolute bottom-8 flex flex-col items-center justify-center space-y-2 transition-all duration-500 ${
        showLogos ? 'opacity-100' : 'opacity-0'
      }`}>
        <p className="text-white/60 text-sm" style={{ fontFamily: 'VT323, monospace' }}>
          Model Providers
        </p>
        <div className="flex items-center justify-center space-x-4">
          <img 
            src="/GEMENI.png" 
            alt="Gemini" 
            className={`h-8 opacity-60 hover:opacity-100 transition-all duration-500 ${
              visibleLogos.includes(0) ? 'opacity-60 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          />
          <img 
            src="/grok.png" 
            alt="Grok" 
            className={`h-8 opacity-60 hover:opacity-100 transition-all duration-500 ${
              visibleLogos.includes(1) ? 'opacity-60 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          />
          <img 
            src="/PERP.png" 
            alt="Perplexity" 
            className={`h-8 opacity-60 hover:opacity-100 transition-all duration-500 ${
              visibleLogos.includes(2) ? 'opacity-60 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          />
          <img 
            src="/OPENAI.png" 
            alt="OpenAI" 
            className={`h-8 opacity-60 hover:opacity-100 transition-all duration-500 ${
              visibleLogos.includes(3) ? 'opacity-60 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
