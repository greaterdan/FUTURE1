"use client";
import { useEffect, useState } from 'react';

interface CreationTimeDisplayProps {
  createdAt: Date | string;
  className?: string;
}

export default function CreationTimeDisplay({ createdAt, className = "" }: CreationTimeDisplayProps) {
  const [relativeTime, setRelativeTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const createdDate = new Date(createdAt);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - createdDate.getTime()) / 1000);

      // Calculate relative time
      let relative: string;
      if (diffInSeconds < 60) {
        relative = `${diffInSeconds}s ago`;
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        relative = `${minutes}m ago`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        relative = `${hours}h ago`;
      } else {
        const days = Math.floor(diffInSeconds / 86400);
        relative = `${days}d ago`;
      }

      setRelativeTime(relative);
    };

    // Update immediately
    updateTime();

    // Update every second for live updates
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [createdAt]);

  return (
    <div className={`text-xs ${className}`}>
      <div className="text-white/60 font-mono">
        Created: {relativeTime}
      </div>
    </div>
  );
}
