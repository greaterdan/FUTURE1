"use client";
import { useEffect, useState } from "react";

const PHRASES = [
  "/ What if tomorrow already traded today?",
  "/ When the market breathes, do you listen?",
  "/ The past is just the future in reverse.",
  "/ Every trade casts two shadows: one forward, one back.",
  "/ Where causality ends, alpha begins.",
  "/ Signals are noise until you bend time.",
  "/ Every decision echoes backward.",

  "/ Trade the echo, not the news.",
  "/ Time doesn't move. We do.",
  "/ Probability is the new price.",
  "/ We don't predict. We interfere.",
  "/ Edges live between cause and effect.",
  "/ Entangle with the market.",
  "/ Hindsight is a setting, not a constraint.",
  "/ Outrun the present.",
  "/ Patterns are agreements the market forgot it made.",
  "/ Alpha hides in interference.",
  "/ Tomorrow keeps editing yesterday.",
  "/ The chart is a laboratory.",
  "/ Every order is a photon.",
  "/ We trade the experiment, not the outcome.",
  "/ Causality is optional.",
  "/ The signal arrived before the event.",
  "/ Forecasts are memories from the other direction.",
  "/ Price is a shadow of information.",
  "/ Retrocausality is data, not dogma.",
  "/ Cross the line where models blur.",
  "/ Hold the wave, not the tick.",
  "/ Maps of time, drawn in light.",
  "/ Bet on the interference, not the candle.",
  "/ Your edge: reversible time.",
  "/ Markets breathe. Breathe with them.",
  "/ See the pattern that looks back."
];

export default function LeftTypewriter() {
  const [idx, setIdx] = useState(0);          // phrase index
  const [txt, setTxt] = useState("");         // current substring
  const [isGlitching, setIsGlitching] = useState(false); // glitch effect
  const [speed, setSpeed] = useState(80);     // ms per tick (slower)

  useEffect(() => {
    const full = PHRASES[idx];
    const timer = setTimeout(() => {
      if (!isGlitching) {
        // typing
        const next = full.slice(0, txt.length + 1);
        setTxt(next);
        if (next === full) {
          setIsGlitching(true);
          setSpeed(2000); // hold before glitch
        } else {
          setSpeed(80);
        }
      } else {
        // glitch effect - move to next phrase
        setIsGlitching(false);
        setTxt("");
        setSpeed(300);
        setIdx((i) => (i + 1) % PHRASES.length);
      }
    }, speed);
    return () => clearTimeout(timer);
  }, [txt, isGlitching, idx, speed]);

  return (
    <div
      className="
        pointer-events-none select-none
        fixed left-[20vw] md:left-[25vw] top-1/2 -translate-y-1/2 z-50
        max-w-[44ch] text-left
      "
      style={{
        textShadow:
          "0 0 6px rgba(255,255,255,.55), 0 0 16px rgba(255,255,255,.35)",
        fontFamily: "'CustomFont', monospace",
      }}
      aria-live="polite"
    >
      <style jsx>{`
        @font-face {
          font-family: 'CustomFont';
          src: url('/VT323-Regular.ttf') format('truetype');
          font-display: swap;
        }
        
        .glitch-effect {
          animation: glitch 0.25s infinite;
          position: relative;
        }
        
        .glitch-effect::before,
        .glitch-effect::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        
        .glitch-effect::before {
          animation: glitch-1 0.25s infinite;
          color: #ff0000;
          z-index: -1;
        }
        
        .glitch-effect::after {
          animation: glitch-2 0.25s infinite;
          color: #00ffff;
          z-index: -2;
        }
        
        @keyframes glitch {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-3px, 3px); }
          40% { transform: translate(-3px, -3px); }
          60% { transform: translate(3px, 3px); }
          80% { transform: translate(3px, -3px); }
        }
        
        @keyframes glitch-1 {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(3px, -3px); }
          40% { transform: translate(3px, 3px); }
          60% { transform: translate(-3px, -3px); }
          80% { transform: translate(-3px, 3px); }
        }
        
        @keyframes glitch-2 {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-3px, -3px); }
          40% { transform: translate(-3px, 3px); }
          60% { transform: translate(3px, -3px); }
          80% { transform: translate(3px, 3px); }
        }
      `}</style>
      <h1 
        className={`text-white/95 font-semibold leading-tight text-2xl sm:text-3xl md:text-4xl ${
          isGlitching ? 'glitch-effect' : ''
        }`}
        data-text={txt}
      >
        {txt}
        <span className="ml-1 inline-block w-[0.6ch] bg-white/90 animate-pulse rounded-[1px] h-[1em] align-middle translate-y-[0.1em]" />
      </h1>
    </div>
  );
}

