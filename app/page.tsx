"use client";
import dynamic from "next/dynamic";
import { useState } from "react";

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
  };

  const handleZodiacComplete = () => {
    setShowMainPage(true);
  };

  // Show birthday entry first
  if (!userBirthday) {
    return <BirthdayEntry onBirthdaySubmit={handleBirthdaySubmit} />;
  }

  // Show zodiac display
  if (zodiacSign && !showMainPage) {
    return <ZodiacDisplay zodiacSign={zodiacSign} onComplete={handleZodiacComplete} />;
  }

  // Show main page
  return (
    <main className="fixed inset-0 overflow-visible">
      <BackgroundVideo />
      <RetroGeometry isSlow={isNavigationHubOpen} />
      <LeftTypewriter />
      {!isScopeOpen && !isNavigationHubOpen && <CornerLogo size={64} />}
      <RadialVideoButtons 
        isNavigationHubOpen={isNavigationHubOpen}
        setIsNavigationHubOpen={setIsNavigationHubOpen}
        isScopeOpen={isScopeOpen}
        setIsScopeOpen={setIsScopeOpen}
      />
      <BottomNavigation isNavigationHubOpen={isNavigationHubOpen} />
      <Scope isOpen={isScopeOpen} onClose={() => setIsScopeOpen(false)} />
    </main>
  );
}
