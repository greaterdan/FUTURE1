"use client";
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";


import ImageWithFallback from './ImageWithFallback';
import SocialBadges from './SocialBadges';
import HoverImagePreview from './HoverImagePreview';
import CreationTimeDisplay from './CreationTimeDisplay';
import TokenSearch from './TokenSearch';

// Star Button Component
const StarButton: React.FC<{ tokenMint: string }> = ({ tokenMint }) => {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = React.useContext(WatchlistContext);
  const isStarred = isInWatchlist(tokenMint);

  const handleStarClick = () => {
    if (isStarred) {
      removeFromWatchlist(tokenMint);
    } else {
      addToWatchlist(tokenMint);
    }
  };

  return (
    <button
      onClick={handleStarClick}
      className="p-1 bg-white/10 hover:bg-white/20 rounded border border-white/20 transition-all duration-200 flex items-center shrink-0"
    >
      <svg 
        className={`w-4 h-4 transition-colors duration-200 ${
          isStarred ? 'text-yellow-400' : 'text-white/60 hover:text-white'
        }`} 
        fill={isStarred ? 'currentColor' : 'none'} 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
        />
      </svg>
    </button>
  );
};

// Watchlist Context
const WatchlistContext = React.createContext<{
  watchlist: Set<string>;
  addToWatchlist: (mint: string) => void;
  removeFromWatchlist: (mint: string) => void;
  isInWatchlist: (mint: string) => boolean;
}>({
  watchlist: new Set(),
  addToWatchlist: () => {},
  removeFromWatchlist: () => {},
  isInWatchlist: () => false,
});

// Watchlist Provider Component
const WatchlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());

  const addToWatchlist = useCallback((mint: string) => {
    setWatchlist(prev => new Set([...prev, mint]));
  }, []);

  const removeFromWatchlist = useCallback((mint: string) => {
    setWatchlist(prev => {
      const newSet = new Set(prev);
      newSet.delete(mint);
      return newSet;
    });
  }, []);

  const isInWatchlist = useCallback((mint: string) => {
    return watchlist.has(mint);
  }, [watchlist]);

  return (
    <WatchlistContext.Provider value={{ watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist }}>
      {children}
    </WatchlistContext.Provider>
  );
};

// Watchlist Popup Component
const WatchlistPopup: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  tokens: any[]; 
}> = ({ isOpen, onClose, tokens }) => {
  const { watchlist, removeFromWatchlist, isInWatchlist } = React.useContext(WatchlistContext);
  
  const watchlistTokens = tokens.filter(token => isInWatchlist(token.mint));

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-black/90 border border-white/20 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Watchlist</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[60vh]">
          {watchlistTokens.length === 0 ? (
            <div className="text-center text-white/60 py-8">
              <div className="text-4xl mb-4">⭐</div>
              <div className="text-lg">No tokens in watchlist yet</div>
              <div className="text-sm text-white/40 mt-2">Click the star on any token to add it here</div>
            </div>
          ) : (
            <div className="space-y-3">
              {watchlistTokens.map((token) => (
                <div
                  key={token.mint}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                      <ImageWithFallback
                        src={token.imageUrl ? `http://localhost:8080/api/img?u=${encodeURIComponent(token.imageUrl)}` : undefined}
                        alt={token.symbol || token.name || "Token"}
                        className="w-full h-full object-cover"
                        fallbackClassName="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold"
                      />
                    </div>
                    <div>
                      <div className="text-white font-semibold">
                        <span className="text-white/80 text-sm font-mono font-bold uppercase">
                          {token.symbol || token.mint.slice(0, 4)}
                        </span>
                        <span className="ml-2">
                          {token.name || token.symbol || `${token.mint.slice(0, 4)}…${token.mint.slice(-4)}`}
                        </span>
                      </div>
                      <div className="text-white/60 text-sm">
                        {token.mint.slice(0, 8)}...{token.mint.slice(-8)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromWatchlist(token.mint)}
                    className="p-2 text-yellow-400 hover:text-yellow-300 transition-colors duration-200"
                    title="Remove from watchlist"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Header Star Button Component
const HeaderStarButton: React.FC<{ tokens: any[] }> = ({ tokens }) => {
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const { watchlist } = React.useContext(WatchlistContext);

  const handleStarClick = () => {
    setIsWatchlistOpen(!isWatchlistOpen);
  };

  return (
    <>
      <motion.button
        onClick={handleStarClick}
        className={`relative p-2 rounded-full transition-all duration-300 ${
          watchlist.size > 0
            ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 shadow-lg shadow-yellow-500/20'
            : 'bg-black/20 hover:bg-black/40 border border-gray-700 shadow-md shadow-black/30'
        }`}
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg 
          className={`w-5 h-5 transition-colors duration-200 ${
            watchlist.size > 0 ? 'text-yellow-400' : 'text-white'
          }`} 
          fill={watchlist.size > 0 ? 'currentColor' : 'none'} 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
          />
        </svg>
        {watchlist.size > 0 && (
          <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold border-2 border-black">
            {watchlist.size}
          </span>
        )}
      </motion.button>
      
      <WatchlistPopup 
        isOpen={isWatchlistOpen} 
        onClose={() => setIsWatchlistOpen(false)} 
        tokens={tokens}
      />
    </>
  );
};

// Format marketcap with K/M suffixes
const formatMarketcap = (value: number): string => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1).replace('.0', '') + 'M';
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1).replace('.0', '') + 'K';
  } else {
    return value.toFixed(0);
  }
};

// Typing Indicator Component
const TypingIndicator: React.FC<{ isTyping: boolean; companionName?: string }> = ({ isTyping, companionName }) => {
  if (!isTyping) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex mb-3 text-base leading-relaxed justify-start"
    >
      <div className="bg-gray-800 text-gray-200 p-3 rounded-lg max-w-[75%]">
        <div className="flex items-end gap-2">
          <span className="px-3 py-2 rounded-lg bg-gray-700 text-gray-200 text-sm font-medium">
            {companionName ? `${companionName} is typing` : 'Companion is typing'}
          </span>
          <div className="flex items-end space-x-1">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></span>
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-150"></span>
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-300"></span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Visibility tracking hook for performance optimization
export function useVisibility(mint: string, visibleMintsRef: React.MutableRefObject<Set<string>>) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visibleMintsRef.current.add(mint);
        else visibleMintsRef.current.delete(mint);
      }
    }, { root: null, threshold: 0.01 });
    io.observe(el);
    return () => io.disconnect();
  }, [mint, visibleMintsRef]);
  return ref;
}

// Memoized TokenCard for performance
type CardProps = {
  token: any;
  visibleMintsRef: React.MutableRefObject<Set<string>>;
  onCompanionAttached?: (companionName: string, token: any) => void;
  agents: Array<{ name: string; videoFile: string }>;
  attachedCompanion?: string | null;
  onCompanionDetach?: (tokenMint: string) => void;
  onHoverEnter?: () => void;
  onHoverLeave?: () => void;
};
const TokenCardBase: React.FC<CardProps> = React.memo(({ token, visibleMintsRef, onCompanionAttached, agents, attachedCompanion, onCompanionDetach, onHoverEnter, onHoverLeave }) => {
  const cardRef = useVisibility(token.mint, visibleMintsRef);
  const [isDragOver, setIsDragOver] = useState(false);
  
  
  const copyMintAddress = async () => {
    try {
      await navigator.clipboard.writeText(token.mint);
    } catch (err) {
      console.error('Failed to copy mint address:', err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    console.log('Drag over token:', token.mint);
    // Completely disable drag over if companion is already attached
    if (attachedCompanion) {
      return;
    }
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    console.log('Drop event on token:', token.mint);
    console.log('Data transfer types:', e.dataTransfer.types);
    
    // Prevent dropping if a companion is already attached
    if (attachedCompanion) {
      console.log(`Token ${token.mint} already has companion ${attachedCompanion} attached`);
      return;
    }
    
    const agentName = e.dataTransfer.getData('text/plain');
    console.log('Agent name from drop:', agentName);
    
    if (agentName) {
      console.log(`Agent ${agentName} dropped on token ${token.mint}`);
      
      // Add a success animation
      const card = e.currentTarget as HTMLElement;
      card.style.transform = 'scale(1.05)';
      card.style.transition = 'transform 0.2s ease-out';
      
      setTimeout(() => {
        card.style.transform = 'scale(1)';
      }, 200);
      
      // Notify parent component about companion attachment
      if (onCompanionAttached) {
        onCompanionAttached(agentName, token);
      }
    } else {
      console.log('No agent name found in drop data');
    }
  };
  
  return (
    <div
      ref={cardRef}
      className={`group relative isolate overflow-visible rounded-xl border p-4 shadow-sm hover:scale-105 hover:z-10 transition-all duration-200 token-card ${
        isDragOver && !attachedCompanion
          ? 'border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/30 scale-105 z-20 ring-2 ring-blue-400/50 animate-pulse shadow-[0_0_20px_rgba(59,130,246,0.5)]' 
          : 'border-white/10 bg-white/6'
      }`}
      style={{ willChange: 'transform', pointerEvents: 'auto' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseEnter={onHoverEnter}
      onMouseLeave={onHoverLeave}
      draggable={false}
    >
      {/* Drop indicator overlay */}
      {isDragOver && !attachedCompanion && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border-2 border-dashed border-blue-400/60 flex items-center justify-center z-10 backdrop-blur-sm"
        >
          <div className="text-blue-400 text-sm font-medium flex items-center space-x-2 bg-black/50 px-3 py-2 rounded-lg">
            <span>Drop Companion Here</span>
          </div>
        </motion.div>
      )}
      


      {/* Attached Companion Icon */}
      {attachedCompanion && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute bottom-3 left-1/2 transform -translate-x-1/2 z-20 group"
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-transparent companion-video">
              {/* Find the agent video for this companion */}
              {(() => {
                const agent = agents.find(a => a.name === attachedCompanion);
                return agent ? (
                  <video 
                    className="w-full h-full object-cover"
                    autoPlay 
                    muted 
                    loop
                    playsInline
                    style={{ 
                      mixBlendMode: 'screen',
                      filter: 'brightness(1.2) contrast(1.1)',
                      background: 'transparent',
                      backgroundColor: 'transparent',
                      backgroundImage: 'none'
                    }}
                  >
                    <source src={agent.videoFile} type="video/webm" />
                  </video>
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">
                      {attachedCompanion.split(' ').map(word => word[0]).join('')}
                    </span>
                  </div>
                );
              })()}
            </div>
            {/* Detach button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onCompanionDetach) {
                  onCompanionDetach(token.mint);
                }
              }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              title="Detach companion"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
      
      {/* Header row: avatar, name/symbol, copy button */}
      <div className="grid grid-cols-[auto_1fr_auto] items-start gap-3">
        {/* Avatar container with HoverImagePreview */}
        <div className="relative h-12 w-12 shrink-0 overflow-visible">
          {token.imageUrl ? (
            <HoverImagePreview 
              src={`http://localhost:8080/api/img?u=${encodeURIComponent(token.imageUrl)}`}
              alt={token.symbol || token.name || "Token"}
              thumbClass="h-full w-full object-cover rounded-md"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold rounded-md">
              {(token.symbol || token.name || "T").slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        
        {/* Token info */}
        <div className="min-w-0 flex-1">
          <div className="text-white font-semibold truncate flex items-center gap-2">
            <span className="text-white/80 text-sm font-mono font-bold uppercase">
              {token.symbol || token.mint.slice(0, 4)}
            </span>
            <span>
              {token.name || token.symbol || `${token.mint.slice(0, 4)}…${token.mint.slice(-4)}`}
            </span>
            {/* Copy button */}
            <button
              onClick={copyMintAddress}
              className="p-1 bg-white/10 hover:bg-white/20 text-white/60 hover:text-white rounded border border-white/20 transition-all duration-200 flex items-center shrink-0"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          {/* Creation time display */}
          <CreationTimeDisplay 
            createdAt={token.created_at || token.createdAt || new Date()} 
            className="mt-1"
          />
        </div>
        
        {/* Star button */}
        <StarButton tokenMint={token.mint} />
      </div>
      
      {/* Metrics row */}
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="min-w-0">
          <span className="text-white/60">MC:</span>
          <span className={`ml-1 font-mono truncate font-semibold ${
            token.is_on_curve 
              ? 'text-white' 
              : (token.marketcap && token.marketcap !== 'null' && token.marketcap !== '0' 
                  ? (parseFloat(token.marketcap) > 30000 
                      ? 'text-yellow-400' 
                      : 'text-green-400')
                  : 'text-white')
          }`}>
            {token.is_on_curve ? '— (on curve)' : (token.marketcap && token.marketcap !== 'null' && token.marketcap !== '0' ? `$${formatMarketcap(parseFloat(token.marketcap))}` : '—')}
          </span>
        </div>
        <div className="min-w-0">
          <span className="text-white/60">Vol:</span>
          <span className="text-white ml-1 font-mono truncate">
            {token.is_on_curve ? '— (on curve)' : (token.volume_24h && token.volume_24h !== 'null' && token.volume_24h !== '0' ? `$${Math.round(parseFloat(token.volume_24h)).toLocaleString()}` : '—')}
          </span>
        </div>
      </div>
      
      {/* Bonding Curve Badge */}
      {(token.is_on_curve || token.status === 'curve') && (
        <div className="mt-2 flex justify-center">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            BONDING CURVE
          </span>
        </div>
      )}
      
      {/* Badges row */}
      <div className="mt-3 flex items-center gap-2">
        <SocialBadges 
          links={token.links} 
          website={token.website}
          twitter={token.twitter}
          telegram={token.telegram}
          source={token.source}
        />
        <span className="text-xs text-white/30 font-mono ml-auto">
          {token.mint.slice(0, 4)}...{token.mint.slice(-4)}
        </span>
      </div>
    </div>
  );
});

const shallowPickEq = (a: any, b: any) =>
  a.mint === b.mint &&
  a.name === b.name &&
  a.symbol === b.symbol &&
  a.imageUrl === b.imageUrl &&
  a.is_on_curve === b.is_on_curve &&
  a.price_usd === b.price_usd &&
  a.liquidity === b.liquidity &&
  a.volume_24h === b.volume_24h &&
  JSON.stringify(a.links) === JSON.stringify(a.links);

export const TokenCard = React.memo(TokenCardBase, (prev, next) =>
  shallowPickEq(prev.token, next.token) &&
  prev.attachedCompanion === next.attachedCompanion
);

// Token Column
function TokenColumn({ 
  title, 
  items, 
  className = "",
  visibleMintsRef,
  onCompanionAttached,
  agents,
  newTokenMint,
  attachedCompanions,
  onCompanionDetach,
  onHoverEnter,
  onHoverLeave
}: { 
  title: string; 
  items: any[]; 
  className?: string;
  visibleMintsRef: React.MutableRefObject<Set<string>>;
  onCompanionAttached?: (companionName: string, token: any) => void;
  agents: Array<{ name: string; videoFile: string }>;
  newTokenMint: string | null;
  attachedCompanions: Record<string, string>;
  onCompanionDetach?: (tokenMint: string) => void;
  onHoverEnter?: () => void;
  onHoverLeave?: () => void;
}) {

  return (
    <div className={`flex flex-col gap-3 min-w-0 flex-1 relative z-0 ${className}`}>
      <h2 className="text-white text-lg font-bold text-center flex-shrink-0">{title}</h2>
      <div className="w-full border-b border-gray-700 mb-3 -mx-3" />
      <div className="rounded-2xl bg-black/15 p-4 overflow-y-auto overflow-x-visible h-[calc(100vh-180px)] max-h-[calc(100vh-180px)] pb-6">
        <div className="flex flex-col gap-2">
          {items.length === 0 ? (
            <div className="text-center text-white/40 py-8">
              <div className="text-2xl mb-2">📭</div>
              <div className="text-sm">No tokens yet</div>
            </div>
          ) : (
            <>
              {items.map((token, index) => {
                const isNewToken = newTokenMint === token.mint;
                const companionForToken = attachedCompanions[token.mint] || null;
                return (
                  <div 
                    key={`${token.mint}-${token.updated_at || token.created_at || index}`} 
                    className={`relative ${index === items.length - 1 ? 'mb-4' : ''}`}
                    data-mint={token.mint}
                  >
                    {isNewToken ? (
                      <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ 
                          opacity: 1, 
                          y: 0, 
                          scale: 1
                        }}
                        transition={{ 
                          duration: 0.3,
                          ease: [0.25, 0.46, 0.45, 0.94]
                        }}
                      >
                        <TokenCard 
                          token={token} 
                          visibleMintsRef={visibleMintsRef} 
                          onCompanionAttached={onCompanionAttached}
                          agents={agents}
                          attachedCompanion={companionForToken}
                          onCompanionDetach={onCompanionDetach}
                          onHoverEnter={onHoverEnter}
                          onHoverLeave={onHoverLeave}
                        />
                      </motion.div>
                    ) : (
                      <TokenCard 
                        token={token} 
                        visibleMintsRef={visibleMintsRef} 
                        onCompanionAttached={onCompanionAttached}
                        agents={agents}
                        attachedCompanion={attachedCompanions[token.mint] || null}
                        onCompanionDetach={onCompanionDetach}
                        onHoverEnter={onHoverEnter}
                        onHoverLeave={onHoverLeave}
                      />
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export const Scope = ({ 
  isOpen, 
  tokens, 
  isLoading, 
  lastUpdate, 
  stats, 
  connectionStatus, 
  live, 
  resumeLive, 
  pauseLive,
  pauseLiveOnHover,
  resumeLiveAfterHover,
  isHoverPaused,
  queuedTokens,
  newTokenMint,
  onClose
}: { 
  isOpen: boolean;
  tokens: any[];
  isLoading: boolean;
  lastUpdate: Date | null;
  stats: any;
  connectionStatus: string;
  live: boolean;
  resumeLive: () => void;
  pauseLive: () => void;
  pauseLiveOnHover: () => void;
  resumeLiveAfterHover: () => void;
  isHoverPaused: boolean;
  queuedTokens: any[];
  newTokenMint: string | null;
  onClose: () => void;
}) => {
  // Track visible mints for performance optimization
  const visibleMintsRef = useRef<Set<string>>(new Set());
  
  // Track companion attachments globally to persist across re-renders
  const [attachedCompanions, setAttachedCompanions] = useState<Record<string, string>>({});
  
  
  // Handle companion attachment
  const handleCompanionAttached = (companionName: string, token: any) => {
    setAttachedCompanions(prev => ({
      ...prev,
      [token.mint]: companionName
    }));
  };
  
  // Handle companion detach
  const handleCompanionDetach = (tokenMint: string) => {
    setAttachedCompanions(prev => {
      const newState = { ...prev };
      delete newState[tokenMint];
      return newState;
    });
  };
  
  // Token filtering state
  const [searchFilteredTokens, setSearchFilteredTokens] = useState<any[]>(tokens);
  const [isSearchFiltered, setIsSearchFiltered] = useState(false);
  
  // Chat state
  const [messages, setMessages] = useState<Array<{ type: 'user' | 'assistant'; content: string; timestamp: Date }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingCompanion, setTypingCompanion] = useState<string | null>(null);
  
  // Settings state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsView, setSettingsView] = useState<'menu' | 'api' | 'history'>('menu');
  const [selectedAPI, setSelectedAPI] = useState('grok4');
  const [apiKeys, setApiKeys] = useState({
    grok4: '',
    gemini: '',
    perplexity: '',
    chatgpt: ''
  });
  const [showApiKeyPopup, setShowApiKeyPopup] = useState(false);
  const [editingApiKey, setEditingApiKey] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    id: string;
    title: string;
    messages: Array<{ type: 'user' | 'assistant'; content: string; timestamp: Date }>;
    timestamp: Date;
    summary?: string;
  }>>([]);

  // AI Agents state
  const [hoveredAgent, setHoveredAgent] = useState<any>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  

  // Load conversations from localStorage on component mount
  useEffect(() => {
    const savedConversations = localStorage.getItem('scope_conversations');
    if (savedConversations) {
      try {
        const parsed = JSON.parse(savedConversations);
        // Convert timestamp strings back to Date objects
        const conversationsWithDates = parsed.map((conv: any) => ({
          ...conv,
          timestamp: new Date(conv.timestamp),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setConversationHistory(conversationsWithDates);
      } catch (error) {
        console.error('Failed to load conversations from localStorage:', error);
      }
    }
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (conversationHistory.length > 0) {
      localStorage.setItem('scope_conversations', JSON.stringify(conversationHistory));
    }
  }, [conversationHistory]);

  // Handle token selection from search
  const handleTokenSelect = useCallback((selectedToken: any) => {
    console.log('Selected token from search:', selectedToken);
    
    // Filter tokens to show only the selected token
    const filtered = tokens.filter(token => token.mint === selectedToken.mint);
    setSearchFilteredTokens(filtered);
    setIsSearchFiltered(true);
    
    // Scroll to the token if it exists in the current list
    if (filtered.length > 0) {
      const tokenElement = document.querySelector(`[data-mint="${selectedToken.mint}"]`);
      if (tokenElement) {
        tokenElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [tokens]);

  // Reset filter when tokens change
  useEffect(() => {
    if (!isSearchFiltered) {
      setSearchFilteredTokens(tokens);
    }
  }, [tokens, isSearchFiltered]);

  // ESC key handler
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [isOpen, onClose]);

  // Auto-close chat when Scope closes
  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setInputMessage('');
    }
  }, [isOpen]);
  







  // AI Agents data - Now using WIZZARD WebM video files
  const agents = [
    {
      name: "The Analyzer",
      description: "Breaks down every token's anatomy: market cap, liquidity depth, holder distribution, wallet flows, and trading frequency — exposing both strength and weakness.",
      videoFile: "/WIZZARD/MagicWizardSphere01_Blue.webm"
    },
    {
      name: "The Predictor",
      description: "Uses historical patterns, momentum curves, and volatility signals to forecast where the market is likely to push a token next.",
      videoFile: "/WIZZARD/MagicWizardSphere01_Green.webm"
    },
    {
      name: "The Quantum Eraser",
      description: "Removes misleading noise like spoofed trades, bot spam, and fake liquidity — reconstructing a clean version of the token's true history.",
      videoFile: "/WIZZARD/MagicWizardSphere01_Orange.webm"
    },
    {
      name: "The Retrocasual",
      description: "Simulates future scenarios, then feeds those echoes back into the present — letting potential outcomes reshape today's analysis.",
      videoFile: "/WIZZARD/MagicWizardSphere01_IceBlue.webm"
    }
  ];

  // Debug: Monitor tokens state changes
  useEffect(() => {
    console.log("🎯 SCOPE: Tokens state changed:", {
      tokensLength: tokens?.length || 0,
      isLoading,
      connectionStatus,
      lastUpdate: lastUpdate?.toLocaleTimeString() || null
    });
    

  }, [tokens, isLoading, connectionStatus, lastUpdate]);



  // Memoize filtered tokens to prevent recalculation on every render
  const filteredTokens = useMemo(() => {
    console.log("🔍 Filtering tokens:", tokens?.length || 0, "tokens received");
    
    // Use search filtered tokens if available, otherwise use all tokens
    const tokensToFilter = isSearchFiltered ? searchFilteredTokens : tokens;
    
    if (!tokensToFilter || !Array.isArray(tokensToFilter) || tokensToFilter.length === 0) {
      console.log("❌ No tokens to filter");
      return { newPairs: [], onEdge: [], filled: [], curveTokens: [] };
    }
    
    // Debug: Log first few tokens to see their structure
    console.log("🔍 Sample tokens:", tokensToFilter.slice(0, 3).map(t => ({
      name: t.name,
      symbol: t.symbol,
      status: t.status,
      isOnCurve: t.isOnCurve // Use transformed property name
    })));
    
    // Filter out unwanted tokens (Jupiter, Sugar, .sol domains, etc.)
    const isUnwantedToken = (token: any) => {
      if (!token) return true;
      
      const name = (token.name || '').toLowerCase();
      const symbol = (token.symbol || '').toLowerCase();
      
      const unwantedPatterns = [
        'jupiter vault', 'jv', 'jupiter',
        'sugar', 'sugarglider',
        '.sol',
        'orbit', 'earth', 'earthorbit', 'highearthorbit', 'orbitpig', 'pigorbit',
        'vault', 'test', 'demo'
      ];
      
      return unwantedPatterns.some(pattern => 
        name.includes(pattern) || symbol.includes(pattern)
      );
    };

    // Use transformed property names from useServerData and limit to 40 tokens each
    const newPairs = tokensToFilter.filter(t => t && t.status === 'fresh' && !isUnwantedToken(t)).slice(0, 40); // Show fresh tokens (the actual fresh mints)
    const filled = tokensToFilter.filter(t => t && t.status === 'active' && !t.isOnCurve && !isUnwantedToken(t)).slice(0, 30); // Show active tokens
    // EDGE: No tokens on edge - temporarily removed
    const onEdge: any[] = [];
    const curveTokens = tokensToFilter.filter(t => t && (t.status === 'curve' || t.isOnCurve) && !isUnwantedToken(t)).slice(0, 30);
    
    console.log("✅ Filtered tokens:", {
      newPairs: newPairs.length,
      onEdge: onEdge.length, 
      filled: filled.length,
      curveTokens: curveTokens.length,
      total: tokensToFilter.length
    });
    return { newPairs, onEdge, filled, curveTokens };
  }, [tokens, isSearchFiltered, searchFilteredTokens]);

  // Generate smart conversation title based on content
  const generateConversationTitle = useCallback((messages: Array<{ type: 'user' | 'assistant'; content: string; timestamp: Date }>) => {
    if (messages.length === 0) return 'New Conversation';
    
    // Find the first user message to use as title
    const firstUserMessage = messages.find(msg => msg.type === 'user');
    if (firstUserMessage) {
      const content = firstUserMessage.content;
      // Create a smart title based on content
      if (content.length <= 40) {
        return content;
      } else {
        // Try to find a good break point
        const words = content.split(' ');
        let title = '';
        for (const word of words) {
          if ((title + ' ' + word).length <= 40) {
            title += (title ? ' ' : '') + word;
          } else {
            break;
          }
        }
        return title + (title.length < content.length ? '...' : '');
      }
    }
    
    return 'New Conversation';
  }, []);



  // Chat functions - memoized to prevent recreation
  const sendMessage = useCallback(() => {
    if (!inputMessage.trim()) return;
    
    const userMessage = { type: 'user' as const, content: inputMessage, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    
    // Save conversation to history if it's a new conversation
    if (messages.length === 0) {
      const newConversation = {
        id: Date.now().toString(),
        title: generateConversationTitle([userMessage]),
        messages: [userMessage],
        timestamp: new Date()
      };
      setConversationHistory(prev => [newConversation, ...prev.slice(0, 19)]); // Keep last 20 conversations
      setCurrentConversationId(newConversation.id);
    } else {
      // Update existing conversation with user message
      if (currentConversationId) {
        setConversationHistory(prev => {
          const updated = [...prev];
          const currentConvIndex = updated.findIndex(conv => conv.id === currentConversationId);
          
          if (currentConvIndex !== -1) {
            updated[currentConvIndex].messages = [...updated[currentConvIndex].messages, userMessage];
          }
          return updated;
        });
      }
    }
    
    // Simulate companion typing
    const randomCompanion = agents[Math.floor(Math.random() * agents.length)].name;
    setTypingCompanion(randomCompanion);
    setIsTyping(true);
    
    // Simulate typing duration based on message length and companion personality
    const baseTypingTime = 1000; // Base 1 second
    const charTypingTime = 50; // 50ms per character
    const personalityDelay = Math.random() * 2000; // Random personality delay
    const typingDuration = baseTypingTime + (inputMessage.length * charTypingTime) + personalityDelay;
    
    setTimeout(() => {
      setIsTyping(false);
      setTypingCompanion(null);
      
      // Generate more realistic companion responses based on their role
      let response = '';
      if (randomCompanion === 'The Analyzer') {
        response = `${randomCompanion}: I've analyzed "${inputMessage}" and found some interesting patterns. The market dynamics suggest...`;
      } else if (randomCompanion === 'The Predictor') {
        response = `${randomCompanion}: Based on "${inputMessage}", my prediction models indicate a potential trend shift. The momentum suggests...`;
      } else if (randomCompanion === 'The Retrocasual') {
        response = `${randomCompanion}: I've simulated future scenarios for "${inputMessage}" and the temporal echoes reveal...`;
      } else {
        response = `${randomCompanion}: I understand you're asking about: ${inputMessage}. Let me analyze this for you...`;
      }
      
      const assistantMessage = { 
        type: 'assistant' as const, 
        content: response, 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update conversation history with the companion response
      if (currentConversationId) {
        setConversationHistory(prev => {
          const updated = [...prev];
          const currentConvIndex = updated.findIndex(conv => conv.id === currentConversationId);
          
          if (currentConvIndex !== -1) {
            updated[currentConvIndex].messages = [...updated[currentConvIndex].messages, assistantMessage];
          }
          return updated;
        });
      }
    }, typingDuration);
  }, [inputMessage, messages.length, currentConversationId]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setInputMessage(e.target.value);
    
    // Auto-close settings menu when user starts typing
    if (isSettingsOpen) {
      setIsSettingsOpen(false);
      setSettingsView('menu');
    }
  }, [isSettingsOpen]);

  // Auto-scroll to bottom when new messages arrive
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Add keyboard shortcut to close SCOPE with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Clean up state immediately when closing
        setMessages([]);
        setInputMessage('');
        // Call the parent's onClose function
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Early return after all hooks have been called
  if (!isOpen) {
    return null;
  }

  return (
    <motion.div 
      className="fixed inset-0 bg-black/95 z-50 overflow-hidden flex flex-col scope-container"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ 
        duration: 0.4, 
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      {/* Header */}
      <motion.div 
        className="bg-black/80 border-b border-white/10 p-4 flex-shrink-0"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="grid grid-cols-3 items-center">
          {/* Left side - SCOPE title only */}
          <div className="flex items-center">
            <motion.h1 
              className="text-2xl font-bold text-white"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              SCOPE
            </motion.h1>
          </div>
        
          {/* Center - Search Bar */}
          <div className="flex items-center justify-center">
            <motion.div 
              className="flex items-center space-x-2"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <TokenSearch 
                placeholder="Search by token or CA"
                onTokenSelect={handleTokenSelect}
                className="w-80"
              />
              
              {/* Reset Filter Button */}
              {isSearchFiltered && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => {
                    setSearchFilteredTokens(tokens);
                    setIsSearchFiltered(false);
                  }}
                  className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 text-sm transition-all duration-200 hover:scale-105"
                  title="Reset filter"
                >
                  Reset
                </motion.button>
              )}

            </motion.div>
          </div>
        
          {/* Right side - Star Button, Close Button */}
          <div className="flex justify-end items-center space-x-3">
            {/* Star Button */}
            <HeaderStarButton tokens={tokens} />

            {/* Close Button */}
            <motion.button
              onClick={() => {
                // Clean up state immediately when closing
                setMessages([]);
                setInputMessage('');
                // Call the parent's onClose function
                onClose();
              }}
              className="text-white/60 hover:text-white transition-colors duration-200"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div 
        className="p-6 flex-1 overflow-hidden relative h-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="text-white text-xl mb-4">Connecting to Solana...</div>
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
            </div>
          </div>
        ) : !tokens || tokens.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center text-white/60">
              <div className="text-2xl mb-4">🔍</div>
              <div className="text-xl mb-2">Monitoring Solana for new launches</div>
              <div className="text-sm text-white/40 mt-2">Debug: isLoading={isLoading.toString()}, tokens={tokens?.length || 0}</div>
            </div>
          </div>
        ) : (
          <div className="flex gap-6">
            <TokenColumn 
              title="FRESH MINTS" 
              items={filteredTokens.newPairs} 
              className="border-r border-gray-700 flex-1 min-w-0"
                visibleMintsRef={visibleMintsRef}
                agents={agents}
                newTokenMint={newTokenMint}
                attachedCompanions={attachedCompanions}
                onCompanionDetach={handleCompanionDetach}
                onHoverEnter={pauseLiveOnHover}
                onHoverLeave={resumeLiveAfterHover}
                onCompanionAttached={(companionName, token) => {
                  // Handle companion attachment
                  handleCompanionAttached(companionName, token);
                  
                  // Simulate companion analysis
                  
                  // Create new conversation for token analysis
                  const newConversation = {
                    id: Date.now().toString(),
                    title: `${companionName} analyzing ${token.name || token.symbol || 'token'}`,
                    messages: [],
                    timestamp: new Date()
                  };
                  setConversationHistory(prev => [newConversation, ...prev.slice(0, 19)]);
                  
                  // Simulate companion analyzing the token
                  setTimeout(() => {
                    setTypingCompanion(companionName);
                    setIsTyping(true);
                    
                    // Simulate analysis time
                    const analysisTime = 3000 + Math.random() * 2000;
                    
                    setTimeout(() => {
                      setIsTyping(false);
                      setTypingCompanion(null);
                      
                      // Add analysis message
                      const analysisMessage = {
                        type: 'assistant' as const,
                        content: `${companionName}: I've analyzed ${token.name || token.symbol || 'this token'}. Market cap: ${token.marketcap ? `$${token.marketcap.toLocaleString()}` : 'N/A'}, Price: ${token.price_usd ? `$${token.price_usd.toFixed(8)}` : 'N/A'}. ${token.is_on_curve ? 'This is on a bonding curve - interesting dynamics ahead!' : 'Standard token with typical market behavior.'}`,
                        timestamp: new Date()
                      };
                      setMessages(prev => [analysisMessage, ...prev]);
                      
                      // Update conversation history
                      if (currentConversationId) {
                        setConversationHistory(prev => {
                          const updated = [...prev];
                          const currentConvIndex = updated.findIndex(conv => conv.id === currentConversationId);
                          
                          if (currentConvIndex !== -1) {
                            updated[currentConvIndex].messages = [analysisMessage];
                          }
                          return updated;
                        });
                      }
                    }, analysisTime);
                  }, 500);
                }}
              />
              <TokenColumn 
                title="ON EDGE" 
                items={filteredTokens.onEdge} 
                className="border-r border-gray-700 flex-1 min-w-0"
                visibleMintsRef={visibleMintsRef}
                agents={agents}
                newTokenMint={newTokenMint}
                attachedCompanions={attachedCompanions}
                onCompanionDetach={handleCompanionDetach}
                onHoverEnter={pauseLiveOnHover}
                onHoverLeave={resumeLiveAfterHover}
                onCompanionAttached={(companionName, token) => {
                  // Handle companion attachment
                  handleCompanionAttached(companionName, token);
                  
                  // Simulate companion analysis
                  
                  // Create new conversation for token analysis
                  const newConversation = {
                    id: Date.now().toString(),
                    title: `${companionName} analyzing ${token.name || token.symbol || 'token'}`,
                    messages: [],
                    timestamp: new Date()
                  };
                  setConversationHistory(prev => [newConversation, ...prev.slice(0, 19)]);
                  setCurrentConversationId(newConversation.id);
                  
                  // Simulate companion analyzing the token
                  setTimeout(() => {
                    setTypingCompanion(companionName);
                    setIsTyping(true);
                    
                    // Simulate analysis time
                    const analysisTime = 3000 + Math.random() * 2000;
                    
                    setTimeout(() => {
                      setIsTyping(false);
                      setTypingCompanion(null);
                      
                      // Add analysis message
                      const analysisMessage = {
                        type: 'assistant' as const,
                        content: `${companionName}: I've analyzed ${token.name || token.symbol || 'this token'}. Market cap: ${token.marketcap ? `$${token.marketcap.toLocaleString()}` : 'N/A'}, Price: ${token.price_usd ? `$${token.price_usd.toFixed(8)}` : 'N/A'}. ${token.is_on_curve ? 'This is on a bonding curve - interesting dynamics ahead!' : 'Standard token with typical market behavior.'}`,
                        timestamp: new Date()
                      };
                      setMessages(prev => [analysisMessage, ...prev]);
                      
                      // Update conversation history
                      if (currentConversationId) {
                        setConversationHistory(prev => {
                          const updated = [...prev];
                          const currentConvIndex = updated.findIndex(conv => conv.id === currentConversationId);
                          
                          if (currentConvIndex !== -1) {
                            updated[currentConvIndex].messages = [analysisMessage];
                          }
                          return updated;
                        });
                      }
                    }, analysisTime);
                  }, 500);
                }}
              />
              <div className="flex flex-col flex-1 min-w-0 relative">
                <h2 className="text-white text-lg font-bold text-center flex-shrink-0">COMPANIONS</h2>
                <div className="w-full border-b border-gray-700 mb-3 -mx-3" />
                
                {/* Scroll section */}
                <div className="flex-1 overflow-y-auto">
                  <div className="flex justify-center">
                    <div className="flex gap-4">
                      {agents.map((agent, index) => (
                        <div
                          key={index}
                          draggable="true"
                          className="relative w-20 h-20 rounded-full cursor-grab active:cursor-grabbing overflow-hidden transition-all duration-300 hover:scale-110"
                          style={{ background: 'transparent' }}
                          onMouseEnter={() => setHoveredAgent(agent)}
                          onMouseLeave={() => setHoveredAgent(null)}
                          onDragStart={(e) => {
                            console.log('Drag started for:', agent.name);
                            e.dataTransfer.setData('text/plain', agent.name);
                            e.dataTransfer.effectAllowed = 'copy';
                            
                            // Simple visual feedback - just scale up
                            (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
                          }}
                          onDragEnd={(e) => {
                            // Reset the scale
                            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                          }}
                        >
                          <video 
                            className="w-full h-full object-cover pointer-events-none companion-video"
                            autoPlay 
                            muted 
                            loop
                            playsInline
                            style={{ 
                              mixBlendMode: 'screen',
                              filter: 'brightness(1.2) contrast(1.1)',
                              background: 'transparent',
                              backgroundColor: 'transparent',
                              backgroundImage: 'none',
                              backgroundClip: 'content-box',
                              isolation: 'isolate'
                            }}
                          >
                            <source src={agent.videoFile} type="video/webm" />
                          </video>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center h-full">
                    <div className="text-gray-500 text-center italic transition-opacity duration-300 ease-in-out text-lg">
                      Drag a companion onto a token, pick a companion, or start typing to begin…
                    </div>
                  </div>
                </div>
                
                {/* Chat input row at bottom */}
                <div className="shrink-0">
                  <div className="w-full bg-black/70 border-t border-gray-700 p-2 flex items-center gap-2 h-16 chat-input-container">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      onFocus={(e) => e.preventDefault()}
                      onBlur={(e) => e.preventDefault()}
                      placeholder="Type your message..."
                      className="flex-1 rounded-lg bg-gray-900 p-1.5 text-base text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 h-9 ml-1"
                      style={{ scrollBehavior: 'auto' }}
                    />
                    <button
                      onClick={() => {
                        setIsSettingsOpen(!isSettingsOpen);
                        if (!isSettingsOpen) {
                          setSettingsView('menu');
                        }
                      }}
                      className="bg-gray-700 hover:bg-gray-600 text-white rounded-lg px-3 py-1.5 h-9 transition-colors duration-200"
                      title="Settings & History"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                    <button
                      onClick={sendMessage}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 h-9"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
          </div>
        )}
        
        {/* API Key Popup */}
        {showApiKeyPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]"
            onClick={() => setShowApiKeyPopup(false)}
          >
            <motion.div
              className="bg-gray-900 border border-gray-600 rounded-lg p-6 w-96 max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white text-lg font-semibold capitalize">
                  Configure {editingApiKey} API
                </h3>
                <button
                  onClick={() => setShowApiKeyPopup(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <label className="text-gray-300 text-sm mb-2 block">API Key</label>
                <input
                  type="password"
                  value={apiKeys[editingApiKey as keyof typeof apiKeys]}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, [editingApiKey]: e.target.value }))}
                  placeholder={`Enter your ${editingApiKey} API key`}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowApiKeyPopup(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded px-4 py-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setSelectedAPI(editingApiKey);
                    setShowApiKeyPopup(false);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 transition-colors"
                >
                  Save & Select
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        
        {/* Settings Panel */}
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-24 right-4 w-80 bg-black/90 border border-gray-700 rounded-lg p-4 z-[70] max-h-[calc(100vh-220px)] overflow-y-auto"
          >
            {/* Main Menu View */}
            {settingsView === 'menu' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white text-lg font-semibold">Settings</h3>
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setMessages([]);
                      setInputMessage('');
                      setCurrentConversationId(null);
                      setIsSettingsOpen(false);
                    }}
                    className="w-full p-4 bg-blue-600/20 border border-blue-500/30 hover:border-blue-400/50 transition-colors text-left"
                  >
                    <div className="text-white text-lg font-medium">New Chat</div>
                    <div className="text-blue-300 text-sm mt-1">Start a fresh conversation</div>
                  </button>
                  
                  <button
                    onClick={() => setSettingsView('api')}
                    className="w-full p-4 bg-gray-800/50 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors text-left"
                  >
                    <div className="text-white text-lg font-medium">Companion API</div>
                    <div className="text-gray-400 text-sm mt-1">Configure AI providers and API keys</div>
                  </button>
                  
                  <button
                    onClick={() => setSettingsView('history')}
                    className="w-full p-4 bg-gray-800/50 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors text-left"
                  >
                    <div className="text-white text-lg font-medium">History</div>
                    <div className="text-gray-400 text-sm mt-1">View and restore past conversations</div>
                  </button>
                </div>
              </div>
            )}
            
            {/* API Configuration View */}
            {settingsView === 'api' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSettingsView('menu')}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h3 className="text-white text-lg font-semibold">Companion API</h3>
                  </div>
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'grok4', name: 'Grok 4', default: true },
                    { key: 'gemini', name: 'Gemini', default: false },
                    { key: 'perplexity', name: 'Perplexity', default: false },
                    { key: 'chatgpt', name: 'ChatGPT', default: false }
                  ].map((api) => (
                    <button
                      key={api.key}
                      onClick={() => {
                        if (api.key === 'grok4') {
                          setSelectedAPI(api.key);
                        } else {
                          setEditingApiKey(api.key);
                          setShowApiKeyPopup(true);
                        }
                      }}
                      className={`p-3 rounded-lg border transition-all duration-200 ${
                        selectedAPI === api.key
                          ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                          : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <div className="text-sm font-medium">{api.name}</div>
                      {api.default && (
                        <div className="text-xs text-gray-400 mt-1">Default</div>
                      )}
                      {!api.default && (
                        <div className="text-xs text-gray-400 mt-1">Click to configure</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* History View */}
            {settingsView === 'history' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSettingsView('menu')}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h3 className="text-white text-lg font-semibold">Conversation History</h3>
                  </div>
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {conversationHistory.length === 0 ? (
                    <div className="text-gray-400 text-sm text-center py-8">
                      No conversations yet
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-400 text-xs">
                          {conversationHistory.length} conversations
                        </span>
                        <button
                          onClick={() => {
                            if (confirm('Clear all conversation history?')) {
                              setConversationHistory([]);
                              localStorage.removeItem('scope_conversations');
                            }
                          }}
                          className="text-red-400 hover:text-red-300 text-xs transition-colors"
                        >
                          Clear All
                        </button>
                      </div>
                      {conversationHistory.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => {
                            setMessages(conv.messages);
                            setIsSettingsOpen(false);
                          }}
                          className="w-full text-left p-3 bg-gray-800/50 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors"
                        >
                          <div className="text-white text-sm font-medium truncate">{conv.title}</div>
                          <div className="text-gray-400 text-xs mt-1">
                            {conv.timestamp.toLocaleDateString()} - {conv.messages.length} messages
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>



    </motion.div>
  );
};

// Wrapped Scope component with WatchlistProvider
const ScopeWithWatchlist: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  tokens: any[];
  isLoading: boolean;
  lastUpdate: Date | null;
  stats: any;
  connectionStatus: string;
  live: boolean;
  resumeLive: () => void;
  pauseLive: () => void;
  newTokenMint: string | null;
}> = (props) => {
  return (
    <WatchlistProvider>
      <Scope {...props} />
    </WatchlistProvider>
  );
};

export default ScopeWithWatchlist;
