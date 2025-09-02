"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";

// Dynamically import all components to avoid SSR issues
const BackgroundVideo = dynamic(() => import("@/components/BackgroundVideo"), { ssr: false });
const LeftTypewriter = dynamic(() => import("@/components/LeftTypewriter"), { ssr: false });
const RadialVideoButtons = dynamic(() => import("@/components/RadialVideoButtons"), { ssr: false });
const BottomNavigation = dynamic(() => import("@/components/BottomNavigation"), { ssr: false });
const BirthdayEntry = dynamic(() => import("@/components/BirthdayEntry"), { ssr: false });
const ZodiacDisplay = dynamic(() => import("@/components/ZodiacDisplay"), { ssr: false });
const Scope = dynamic(() => import("@/components/Scope"), { ssr: false });
const RetroGeometry = dynamic(() => import("@/components/RetroGeometry"), { ssr: false });
const CornerLogo = dynamic(() => import("@/components/CornerLogo"), { ssr: false });

export default function Page() {
  const [userBirthday, setUserBirthday] = useState<Date | null>(null);
  const [zodiacSign, setZodiacSign] = useState<string>("");
  const [showMainPage, setShowMainPage] = useState(false);
  const [isNavigationHubOpen, setIsNavigationHubOpen] = useState(false);
  const [isScopeOpen, setIsScopeOpen] = useState(false);
  const [isOracleHubOpen, setIsOracleHubOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Debug logging for state changes
  useEffect(() => {
    console.log("🎯 STATE CHANGED - isScopeOpen:", isScopeOpen, "isNavigationHubOpen:", isNavigationHubOpen, "isOracleHubOpen:", isOracleHubOpen);
    
    // Additional debug info
    if (isScopeOpen) {
      console.log("🎯 SCOPE IS NOW OPEN - This should trigger useSolanaData to start monitoring");
    } else {
      console.log("🎯 SCOPE IS NOW CLOSED - useSolanaData should stop monitoring");
    }
  }, [isScopeOpen, isNavigationHubOpen, isOracleHubOpen]);

  // Check localStorage on component mount
  useEffect(() => {
    const savedBirthday = localStorage.getItem('userBirthday');
    const savedZodiacSign = localStorage.getItem('zodiacSign');
    
    if (savedBirthday && savedZodiacSign) {
      setUserBirthday(new Date(savedBirthday));
      setZodiacSign(savedZodiacSign);
      setShowMainPage(true);
    } else {
      // If no saved data, still set loading to false so we can show birthday entry
      setShowMainPage(false);
    }
    
    setIsLoading(false);
  }, []);

  const handleBirthdaySubmit = (birthday: Date) => {
    setUserBirthday(birthday);
    
    // Calculate zodiac sign
    const month = birthday.getMonth() + 1;
    const day = birthday.getDate();
    
    let sign = "";
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) sign = "aries";
    else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) sign = "taurus";
    else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) sign = "gemini";
    else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) sign = "cancer";
    else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) sign = "leo";
    else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) sign = "virgo";
    else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) sign = "libra";
    else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) sign = "scorpio";
    else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) sign = "sagittarius";
    else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) sign = "capricorn";
    else if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) sign = "aquarius";
    else sign = "pisces";
    
    setZodiacSign(sign);
    
    // Save to localStorage
    localStorage.setItem('userBirthday', birthday.toISOString());
    localStorage.setItem('zodiacSign', sign);
  };

  const handleZodiacComplete = () => {
    setShowMainPage(true);
  };

  // Show loading state while checking localStorage
  if (isLoading) {
    return <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="text-white text-xl">Loading...</div>
      <button 
        onClick={() => {
          localStorage.clear();
          window.location.reload();
        }}
        className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded border border-white/20"
      >
        Reset App (Debug)
      </button>
    </div>;
  }

  // Show birthday entry first (only if no saved data)
  if (!userBirthday) {
    return <BirthdayEntry onBirthdaySubmit={handleBirthdaySubmit} />;
  }

  // Show zodiac display
  if (zodiacSign && !showMainPage) {
    return <ZodiacDisplay zodiacSign={zodiacSign} onComplete={handleZodiacComplete} />;
  }

  // Show main page
  return (
    <ErrorBoundary>
      <main className="fixed inset-0 overflow-visible">
        <BackgroundVideo isOracleOpen={isOracleHubOpen} />
        <RetroGeometry isSlow={isNavigationHubOpen} isOracleOpen={isOracleHubOpen} />
        {!isOracleHubOpen && <LeftTypewriter />}
        <CornerLogo size={64} isVisible={!isScopeOpen && !isNavigationHubOpen && !isOracleHubOpen} />
        <RadialVideoButtons 
          isNavigationHubOpen={isNavigationHubOpen}
          setIsNavigationHubOpen={setIsNavigationHubOpen}
          isScopeOpen={isScopeOpen}
          setIsScopeOpen={setIsScopeOpen}
          isOracleHubOpen={isOracleHubOpen}
          setIsOracleHubOpen={setIsOracleHubOpen}
        />
        
        {/* DEBUG: Test button to manually open Scope */}
        <button
          onClick={() => {
            console.log("🎯 DEBUG BUTTON CLICKED - Manually setting isScopeOpen to true");
            setIsScopeOpen(true);
          }}
          className="fixed top-4 right-4 z-50 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          DEBUG: Open Scope
        </button>
        <BottomNavigation isNavigationHubOpen={isNavigationHubOpen} isOracleHubOpen={isOracleHubOpen} />
        <Scope isOpen={isScopeOpen} />
      </main>
    </ErrorBoundary>
  );
}
