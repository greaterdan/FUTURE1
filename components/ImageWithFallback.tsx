import { useState } from "react";

export default function ImageWithFallback({ 
  src, 
  alt, 
  className = "w-10 h-10 rounded-lg",
  fallbackClassName = "w-10 h-10 rounded-lg bg-neutral-800 grid place-items-center text-xs text-neutral-400 overflow-hidden"
}: { 
  src?: string; 
  alt: string;
  className?: string;
  fallbackClassName?: string;
}) {
  const [broken, setBroken] = useState(false);
  
  if (!src || broken) {
    return (
      <div className={fallbackClassName}>
        {alt.slice(0, 2).toUpperCase()}
      </div>
    );
  }
  
  return (
    <img
      src={src}
      alt={alt}
      className={`${className} object-cover`}  // fills container
      onError={() => setBroken(true)}
      loading="lazy"
      decoding="async"
    />
  );
}

