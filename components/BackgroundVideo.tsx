"use client";
import { useEffect, useRef, useState } from "react";

interface Props { isSlow?: boolean }

export default function BackgroundVideo({ isSlow = false }: Props) {
  const [isLoaded, setIsLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = isSlow ? 0.35 : 1.0;
    }
  }, [isSlow]);

  return (
    <video
      ref={videoRef}
      className="fixed transition-opacity duration-500"
      style={{
        left: '75%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: '120vw',
        height: '120vh',
        zIndex: -10,
        opacity: isLoaded ? 1 : 0,
        objectFit: 'cover'
      }}
      src="/Space_Time_Travel__Seamless_VJ_Loop_uhd_2533132.mp4"
      autoPlay
      muted
      loop
      playsInline
    />
  );
}
