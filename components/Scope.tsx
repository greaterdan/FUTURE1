"use client";
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from 'react-dom';


import ImageWithFallback from './ImageWithFallback';
import SocialBadges from './SocialBadges';
import HoverImagePreview from './HoverImagePreview';
import CreationTimeDisplay from './CreationTimeDisplay';
import TokenSearch from './TokenSearch';
import { chatService, ChatMessage } from '../utils/chatService';

// Star Button Component
const StarButton: React.FC<{ tokenMint: string }> = ({ tokenMint }) => {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, watchlist } = React.useContext(WatchlistContext);
  const isStarred = isInWatchlist(tokenMint);

  const handleStarClick = () => {
    if (isStarred) {
      removeFromWatchlist(tokenMint);
    } else {
      // Check if watchlist is full before adding
      if (watchlist.size >= 10) {
        alert('Watchlist is full! Maximum 10 tokens allowed. Remove some tokens first.');
        return;
      }
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

// Help Button Component
const HelpButton: React.FC<{ onHelpClick: () => void }> = ({ onHelpClick }) => {
  return (
    <motion.button
      onClick={onHelpClick}
      className="relative p-2 rounded-full transition-all duration-300 bg-black/20 hover:bg-black/40 border border-gray-700 shadow-md shadow-black/30"
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <svg 
        className="w-5 h-5 text-white transition-colors duration-200" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
        />
      </svg>
    </motion.button>
  );
};

// Help Popup Component
const HelpPopup: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={onClose}
    >
      <motion.div
        className="bg-black/90 border border-white/20 rounded-lg p-6 max-w-4xl w-full mx-4 relative z-[70] shadow-2xl"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">How Scope Works</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white/90">
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-2">🔍 Token Discovery</h3>
            <p className="text-sm leading-relaxed">
              Scope automatically discovers and displays new Solana tokens as they're created. 
              Each token card shows real-time market data, social metrics, and creation information.
            </p>
          </div>

          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-2">⭐ Watchlist</h3>
            <p className="text-sm leading-relaxed">
              Click the star button on any token to add it to your watchlist. You can track up to 10 tokens 
              and access them quickly from the star button in the header.
            </p>
          </div>

          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-2">📊 Market Data</h3>
            <p className="text-sm leading-relaxed">
              View real-time market cap, price changes, holder count, and trading volume. 
              Green indicates positive changes, red indicates negative changes.
            </p>
          </div>

          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-2">🔍 Search & Filter</h3>
            <p className="text-sm leading-relaxed">
              Use the search bar to find specific tokens by name or symbol. 
              Filter tokens by various criteria to narrow down your results.
            </p>
          </div>

          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-2">💬 AI Chat</h3>
            <p className="text-sm leading-relaxed">
              Click the chat icon to get AI-powered insights about tokens, market trends, 
              and trading strategies. Ask questions about any token or market conditions.
            </p>
          </div>

          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-2">🎯 Tips</h3>
            <ul className="text-sm leading-relaxed space-y-1">
              <li>• Hover over token cards to see additional metrics</li>
              <li>• Use the refresh button to get the latest data</li>
              <li>• Check the creation time to identify very new tokens</li>
              <li>• Monitor holder count for community growth</li>
              <li>• Watch for tokens with high social engagement</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
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

  // Load watchlist from localStorage on component mount
  useEffect(() => {
    const savedWatchlist = localStorage.getItem('scope_watchlist');
    if (savedWatchlist) {
      try {
        const parsed = JSON.parse(savedWatchlist);
        if (Array.isArray(parsed)) {
          setWatchlist(new Set(parsed));
        }
      } catch (error) {
        console.error('Failed to load watchlist from localStorage:', error);
      }
    }
  }, []);

  // Save watchlist to localStorage whenever it changes
  useEffect(() => {
    if (watchlist.size > 0) {
      localStorage.setItem('scope_watchlist', JSON.stringify([...watchlist]));
    } else {
      localStorage.removeItem('scope_watchlist');
    }
  }, [watchlist]);

  const addToWatchlist = useCallback((mint: string) => {
    setWatchlist(prev => {
      // Check if already at maximum (10 tokens)
      if (prev.size >= 10) {
        console.log('Watchlist is full (maximum 10 tokens)');
        return prev; // Don't add if already at limit
      }
      return new Set([...prev, mint]);
    });
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
  onTokenClick?: (token: any) => void;
}> = ({ isOpen, onClose, tokens, onTokenClick }) => {
  const { watchlist, removeFromWatchlist, isInWatchlist } = React.useContext(WatchlistContext);
  
  const watchlistTokens = tokens.filter(token => isInWatchlist(token.mint));

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={onClose}
    >
      <motion.div
        className="bg-black/90 border border-white/20 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden relative z-[70] shadow-2xl"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
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
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors duration-200"
                  onClick={() => {
                    onTokenClick?.(token);
                    onClose(); // Close the watchlist popup when a token is clicked
                  }}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromWatchlist(token.mint);
                    }}
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
const HeaderStarButton: React.FC<{ tokens: any[]; onTokenClick?: (token: any) => void }> = ({ tokens, onTokenClick }) => {
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
        onTokenClick={onTokenClick}
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
  onCompanionDetach?: () => void;
  onHoverEnter?: () => void;
  onHoverLeave?: () => void;
  onFocusToken?: (token: any) => void;
  onDragTargetChange?: (token: any | null) => void;
  draggedAgent?: string | null;
};
const TokenCardBase: React.FC<CardProps> = React.memo(({ token, visibleMintsRef, onCompanionAttached, agents, attachedCompanion, onCompanionDetach, onHoverEnter, onHoverLeave, onFocusToken, onDragTargetChange, draggedAgent }) => {
  const cardRef = useVisibility(token.mint, visibleMintsRef);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [ripplePosition, setRipplePosition] = useState<{ x: number; y: number } | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);
  
  const copyMintAddress = async () => {
    try {
      await navigator.clipboard.writeText(token.mint);
    } catch (err) {
      console.error('Failed to copy mint address:', err);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Get click position relative to the card
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Add click effect
    setIsClicked(true);
    setRipplePosition({ x, y });
    
    // Reset effects after animation
    setTimeout(() => {
      setIsClicked(false);
      setRipplePosition(null);
    }, 300);
    
    // Call the original focus function
    onFocusToken?.(token);
  };


  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const agentName = e.dataTransfer.getData('text/plain');
    
    if (agentName) {
      // Notify parent component about companion attachment (this will replace existing companion)
      if (onCompanionAttached) {
        onCompanionAttached(agentName, token);
      }
      
      // Clear drag target after successful attachment
      onDragTargetChange?.(null);
    } else {
      onDragTargetChange?.(null);
    }
  };
  
  return (
    <div
      ref={cardRef}
      className={`group relative isolate overflow-visible rounded-xl border p-4 hover:scale-102 hover:z-10 transition-all duration-200 token-card cursor-pointer ${
        isDragOver
          ? attachedCompanion
            ? 'border-orange-400 bg-orange-500/20 scale-105 z-20 ring-2 ring-orange-400/50 animate-pulse'
            : draggedAgent === 'The Quantum Eraser'
            ? 'border-[#637e9a] bg-[#637e9a]/20 scale-105 z-20 ring-2 ring-[#637e9a]/50 animate-pulse'
            : draggedAgent === 'The Predictor'
            ? 'border-[#3ff600] bg-[#3ff600]/20 scale-105 z-20 ring-2 ring-[#3ff600]/50 animate-pulse'
            : draggedAgent === 'The Analyzer'
            ? 'border-[#195c8e] bg-[#195c8e]/20 scale-105 z-20 ring-2 ring-[#195c8e]/50 animate-pulse'
            : draggedAgent === 'The Retrocasual'
            ? 'border-[#a95109] bg-[#a95109]/20 scale-105 z-20 ring-2 ring-[#a95109]/50 animate-pulse'
            : 'border-blue-400 bg-blue-500/20 scale-105 z-20 ring-2 ring-blue-400/50 animate-pulse'
          : isClicked
          ? 'border-white/30 bg-white/12 scale-95'
          : 'border-white/10 bg-white/6'
      }`}
      style={{ willChange: 'transform', pointerEvents: 'auto' }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragOver) {
          setIsDragOver(true);
          onDragTargetChange?.(token);
        }
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        // Only clear if we're actually leaving the card, not just moving to a child element
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
          setIsDragOver(false);
          onDragTargetChange?.(null);
        }
      }}
      onDrop={handleDrop}
      onMouseEnter={onHoverEnter}
      onMouseLeave={onHoverLeave}
      onClick={handleCardClick}
      draggable={false}
    >
      {/* Drop indicator overlay */}
      {isDragOver && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className={`absolute inset-0 rounded-xl border-2 border-dashed flex items-center justify-center z-10 backdrop-blur-sm ${
            attachedCompanion
              ? 'bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-400/60'
              : draggedAgent === 'The Quantum Eraser'
              ? 'bg-gradient-to-br from-[#637e9a]/20 to-[#637e9a]/30 border-[#637e9a]/60'
              : draggedAgent === 'The Predictor'
              ? 'bg-gradient-to-br from-[#3ff600]/20 to-[#3ff600]/30 border-[#3ff600]/60'
              : draggedAgent === 'The Analyzer'
              ? 'bg-gradient-to-br from-[#195c8e]/20 to-[#195c8e]/30 border-[#195c8e]/60'
              : draggedAgent === 'The Retrocasual'
              ? 'bg-gradient-to-br from-[#a95109]/20 to-[#a95109]/30 border-[#a95109]/60'
              : 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-400/60'
          }`}
        >
          <div className={`text-sm font-medium flex items-center space-x-2 bg-black/50 px-3 py-2 rounded-lg ${
            attachedCompanion 
              ? 'text-orange-400' 
              : draggedAgent === 'The Quantum Eraser'
              ? 'text-[#637e9a]'
              : draggedAgent === 'The Predictor'
              ? 'text-[#3ff600]'
              : draggedAgent === 'The Analyzer'
              ? 'text-[#195c8e]'
              : draggedAgent === 'The Retrocasual'
              ? 'text-[#a95109]'
              : 'text-blue-400'
          }`}>
            <span>{attachedCompanion ? 'Switch Companion' : 'Drop Companion Here'}</span>
          </div>
        </motion.div>
      )}


      {/* Click ripple effect */}
      {ripplePosition && (
        <motion.div
          initial={{ 
            scale: 0, 
            opacity: 0.6,
            x: ripplePosition.x - 20,
            y: ripplePosition.y - 20
          }}
          animate={{ 
            scale: 4, 
            opacity: 0,
            x: ripplePosition.x - 20,
            y: ripplePosition.y - 20
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="absolute w-10 h-10 bg-white/30 rounded-full pointer-events-none z-20"
          style={{
            left: 0,
            top: 0,
          }}
        />
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
                    key={`${attachedCompanion}-${agent.videoFile}`} // Force re-render when companion changes
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
  prev.attachedCompanion === next.attachedCompanion &&
  prev.draggedAgent === next.draggedAgent
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
  attachedCompanion,
  onCompanionDetach,
  onHoverEnter,
  onHoverLeave,
  onFocusToken,
  onDragTargetChange,
  draggedAgent
}: { 
  title: string; 
  items: any[]; 
  className?: string;
  visibleMintsRef: React.MutableRefObject<Set<string>>;
  onCompanionAttached?: (companionName: string, token: any) => void;
  agents: Array<{ name: string; videoFile: string }>;
  newTokenMint: string | null;
  attachedCompanion: {name: string, tokenMint: string} | null;
  onCompanionDetach?: () => void;
  onHoverEnter?: () => void;
  onHoverLeave?: () => void;
  onFocusToken?: (token: any) => void;
  onDragTargetChange?: (token: any | null) => void;
  draggedAgent?: string | null;
}) {

  return (
    <div className={`flex flex-col min-w-0 flex-1 relative z-0 ${className}`}>
      <div className="bg-black/15 p-4 overflow-y-auto overflow-x-visible h-[calc(100vh-180px)] max-h-[calc(100vh-180px)] pb-6">
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
                const companionForToken = attachedCompanion && attachedCompanion.tokenMint === token.mint ? attachedCompanion.name : null;
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
                          attachedCompanion={attachedCompanion && attachedCompanion.tokenMint === token.mint ? attachedCompanion.name : null}
                          onCompanionDetach={onCompanionDetach}
                          onHoverEnter={onHoverEnter}
                          onHoverLeave={onHoverLeave}
                          onFocusToken={onFocusToken}
                          onDragTargetChange={onDragTargetChange}
                          draggedAgent={draggedAgent}
                        />
                      </motion.div>
                    ) : (
                      <TokenCard 
                        token={token} 
                        visibleMintsRef={visibleMintsRef} 
                        onCompanionAttached={onCompanionAttached}
                        agents={agents}
                        attachedCompanion={attachedCompanion && attachedCompanion.tokenMint === token.mint ? attachedCompanion.name : null}
                        onCompanionDetach={onCompanionDetach}
                        onHoverEnter={onHoverEnter}
                        onHoverLeave={onHoverLeave}
                        onFocusToken={onFocusToken}
                        onDragTargetChange={onDragTargetChange}
                        draggedAgent={draggedAgent}
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

// InsightCard Component
function InsightCard({ 
  title, 
  icon, 
  children, 
  className = "" 
}: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={`group rounded-2xl bg-white/[0.04] hover:bg-white/[0.06] transition-all duration-200 hover:-translate-y-0.5 px-4 py-3 desktop:px-4 desktop:py-3 px-3 py-2 mr-2 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 ${className}`}>
      {/* Header row */}
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="uppercase tracking-wider text-[11px] text-white/70 font-mono">{title}</h3>
      </div>
      <div className="border-b border-neutral-800/60 -mx-4 mt-2 mb-3" />
      {children}
    </div>
  );
}

// ConfidenceBar Component
function ConfidenceBar({ 
  value, 
  className = "" 
}: { 
  value: number; 
  className?: string; 
}) {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const color = clampedValue > 70 ? 'bg-green-400' : clampedValue > 40 ? 'bg-yellow-400' : 'bg-red-400';
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-md bg-white/5 text-white/80">
        {clampedValue}%
      </span>
    </div>
  );
}

// Insights Column Component
function InsightsColumn({ 
  focusToken,
  className = ""
}: { 
  focusToken: any | null;
  className?: string;
}) {
  // Helper function to format values with fallbacks
  const formatValue = (value: any, fallback: string = "N/A") => {
    if (value === null || value === undefined || value === 'null' || value === '0') {
      return fallback;
    }
    return value;
  };

  // Helper function to clamp values
  const clamp = (value: number, min: number, max: number) => {
    return Math.min(Math.max(value, min), max);
  };

  // Calculate metrics
  const getTokenMetrics = (token: any) => {
    if (!token) return null;

    const confidence = clamp(token.confidence ?? token.confidenceScore ?? 50, 0, 100);
    const marketcap = formatValue(token.marketcap, "N/A");
    const liquidity = formatValue(token.liquidity, "N/A");
    const volume24h = formatValue(token.volume_24h, "N/A");
    const holderCount = formatValue(token.holder_count ?? token.holders, "N/A");
    
    // Calculate token age (simplified)
    const createdAt = token.created_at || token.createdAt;
    const tokenAge = createdAt ? Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)) : "N/A";
    
    // Calculate 10m and 1h moves (simplified - would need price history in real implementation)
    const price10mMove = "N/A"; // Would need price history
    const price1hMove = "N/A"; // Would need price history
    
    // Calculate expected range (simplified)
    const expectedRange = "±3%"; // Fallback as specified
    
    // Calculate up probability based on confidence
    const upProbability = clamp(confidence, 0, 100);
    
    // Calculate future-echo delta (simplified)
    const futureEchoDelta = "N/A"; // Would need EMA calculation
    
    // Determine scenario bias
    const scenarioBias = confidence > 60 ? "Up" : confidence < 40 ? "Down" : "Neutral";
    
    // Calculate momentum metrics (simplified)
    const priceMomentum = "N/A"; // Would need SMA calculation
    const volumeMomentum = "N/A"; // Would need volume history
    const acceleration = "N/A"; // Would need trend analysis
    
    // Determine heating/cooling
    const heatingCooling = confidence > 70 ? "High" : confidence > 40 ? "Med" : "Low";

    return {
      confidence,
      marketcap,
      liquidity,
      volume24h,
      holderCount,
      tokenAge,
      price10mMove,
      price1hMove,
      expectedRange,
      upProbability,
      futureEchoDelta,
      scenarioBias,
      priceMomentum,
      volumeMomentum,
      acceleration,
      heatingCooling
    };
  };

  const metrics = getTokenMetrics(focusToken);

  return (
    <div className={`flex flex-col min-w-0 flex-1 relative z-0 ${className}`}>
      <div className="bg-black/15 p-4 overflow-y-auto overflow-x-visible h-[calc(100vh-180px)] max-h-[calc(100vh-180px)] pb-6">
        {!focusToken ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500 text-center italic transition-opacity duration-300 ease-in-out text-lg">
              Click on a token to see insights
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Selected Token Card */}
            <div className="rounded-2xl bg-white/[0.04] p-3 mr-2 shadow-lg shadow-black/20">
              <div className="flex items-center gap-3">
                {/* Token Avatar */}
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                  {focusToken.imageUrl ? (
                    <img 
                      src={`http://localhost:8080/api/img?u=${encodeURIComponent(focusToken.imageUrl)}`}
                      alt={focusToken.symbol || focusToken.name || "Token"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                      {(focusToken.symbol || focusToken.name || "T").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                
                {/* Token Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white/80 text-sm font-mono font-bold uppercase">
                      {focusToken.symbol || focusToken.mint.slice(0, 4)}
                    </span>
                    <span className="text-white text-sm font-medium truncate">
                      {focusToken.name || focusToken.symbol || `${focusToken.mint.slice(0, 4)}…${focusToken.mint.slice(-4)}`}
                    </span>
                  </div>
                  <div className="text-white/50 text-xs font-mono">
                    {focusToken.mint.slice(0, 8)}...{focusToken.mint.slice(-8)}
                  </div>
                </div>
                
                {/* Status Badge */}
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-mono border ${
                  focusToken.is_on_curve || focusToken.status === 'curve'
                    ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                    : 'bg-green-500/15 text-green-300 border-green-500/30'
                }`}>
                  {focusToken.is_on_curve || focusToken.status === 'curve' ? 'CURVE' : 'ACTIVE'}
                </div>
              </div>
            </div>

            {/* Insights Section */}
            <InsightCard 
              title="Insights" 
              icon={
                <svg className="w-3 h-3 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            >
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <div>
                  <div className="text-white/50 text-[12px] font-mono mb-1">Confidence</div>
                  <ConfidenceBar value={metrics?.confidence || 0} />
                </div>
                <div>
                  <div className="text-white/50 text-[12px] font-mono mb-1">Marketcap</div>
                  <div className="text-white text-[12px] font-mono">{metrics?.marketcap || "N/A"}</div>
                </div>
                <div>
                  <div className="text-white/50 text-[12px] font-mono mb-1">Liquidity</div>
                  <div className="text-white text-[12px] font-mono">{metrics?.liquidity || "N/A"}</div>
                </div>
                <div>
                  <div className="text-white/50 text-[12px] font-mono mb-1">24h Vol</div>
                  <div className="text-white text-[12px] font-mono">{metrics?.volume24h || "N/A"}</div>
                </div>
                <div>
                  <div className="text-white/50 text-[12px] font-mono mb-1">Holders</div>
                  <div className="text-white text-[12px] font-mono">{metrics?.holderCount || "N/A"}</div>
                </div>
                <div>
                  <div className="text-white/50 text-[12px] font-mono mb-1">Age</div>
                  <div className="text-white text-[12px] font-mono">{metrics?.tokenAge || "N/A"}</div>
                </div>
              </div>
            </InsightCard>

            {/* Forecast Section */}
            <InsightCard 
              title="Forecast" 
              icon={
                <svg className="w-3 h-3 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
            >
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <div>
                  <div className="text-white/50 text-[12px] font-mono mb-1">10m move</div>
                  <div className="text-white text-[12px] font-mono">{metrics?.price10mMove || "N/A"}</div>
                </div>
                <div>
                  <div className="text-white/50 text-[12px] font-mono mb-1">1h move</div>
                  <div className="text-white text-[12px] font-mono">{metrics?.price1hMove || "N/A"}</div>
                </div>
                <div>
                  <div className="text-white/50 text-[12px] font-mono mb-1">Expected range</div>
                  <div className="text-[11px] font-mono px-1.5 py-0.5 rounded-md bg-white/5 text-white/80">
                    {metrics?.expectedRange || "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-white/50 text-[12px] font-mono mb-1">Up prob</div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-mono border ${
                    metrics?.upProbability && metrics.upProbability > 60 
                      ? 'bg-green-500/15 text-green-300 border-green-500/30' 
                      : metrics?.upProbability && metrics.upProbability > 40 
                        ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' 
                        : 'bg-red-500/15 text-red-300 border-red-500/30'
                  }`}>
                    {metrics?.upProbability || "N/A"}%
                  </div>
                </div>
              </div>
            </InsightCard>

            {/* Retrocausality Section */}
            <InsightCard 
              title="Retrocausality" 
              icon={
                <svg className="w-3 h-3 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              }
            >
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <div>
                  <div className="text-white/50 text-[12px] font-mono mb-1">Future-echo Δ</div>
                  <div className="text-white text-[12px] font-mono flex items-center gap-1">
                    {metrics?.futureEchoDelta && metrics.futureEchoDelta !== "N/A" ? (
                      <>
                        <span className={parseFloat(metrics.futureEchoDelta) > 0 ? 'text-green-400' : 'text-red-400'}>
                          {parseFloat(metrics.futureEchoDelta) > 0 ? '▲' : '▼'}
                        </span>
                        {metrics.futureEchoDelta}
                      </>
                    ) : (
                      "N/A"
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-white/50 text-[12px] font-mono mb-1">Scenario bias</div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-mono border ${
                    metrics?.scenarioBias === 'Up' 
                      ? 'bg-green-500/15 text-green-300 border-green-500/30' 
                      : metrics?.scenarioBias === 'Down' 
                        ? 'bg-red-500/15 text-red-300 border-red-500/30' 
                        : 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30'
                  }`}>
                    {metrics?.scenarioBias || "N/A"}
                  </div>
                </div>
              </div>
            </InsightCard>

            {/* Momentum Section */}
            <InsightCard 
              title="Momentum" 
              icon={
                <svg className="w-3 h-3 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
            >
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <div>
                  <div className="text-white/50 text-[12px] font-mono mb-1">Price momentum</div>
                  <div className="text-white text-[12px] font-mono">{metrics?.priceMomentum || "N/A"}</div>
                </div>
                <div>
                  <div className="text-white/50 text-[12px] font-mono mb-1">Volume momentum</div>
                  <div className="text-white text-[12px] font-mono">{metrics?.volumeMomentum || "N/A"}</div>
                </div>
                <div>
                  <div className="text-white/50 text-[12px] font-mono mb-1">Acceleration</div>
                  <div className="text-white text-[12px] font-mono">{metrics?.acceleration || "N/A"}</div>
                </div>
                <div>
                  <div className="text-white/50 text-[12px] font-mono mb-1">Heating/Cooling</div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-mono border ${
                    metrics?.heatingCooling === 'High' 
                      ? 'bg-red-500/15 text-red-300 border-red-500/30' 
                      : metrics?.heatingCooling === 'Med' 
                        ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' 
                        : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                  }`}>
                    {metrics?.heatingCooling === 'High' ? 'Hot' : metrics?.heatingCooling === 'Med' ? 'Med' : metrics?.heatingCooling === 'Low' ? 'Cool' : 'N/A'}
                  </div>
                </div>
              </div>
            </InsightCard>
          </div>
        )}
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
  
  // Track which companion is currently attached (only one at a time)
  const [attachedCompanion, setAttachedCompanion] = useState<{name: string, tokenMint: string} | null>(null);
  
  // Focused token for insights
  const [focusToken, setFocusToken] = useState<any|null>(null);
  
  
  // Handle companion attachment - only one companion can be attached at a time
  const handleCompanionAttached = (companionName: string, token: any) => {
    setAttachedCompanion({name: companionName, tokenMint: token.mint});
  };
  
  // Handle companion detach
  const handleCompanionDetach = () => {
    setAttachedCompanion(null);
  };
  
  // Token filtering state
  const [searchFilteredTokens, setSearchFilteredTokens] = useState<any[]>(tokens);
  const [isSearchFiltered, setIsSearchFiltered] = useState(false);
  
  // Chat state
  const [messages, setMessages] = useState<Array<{ type: 'user' | 'assistant'; content: string; timestamp: Date }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  
  // Help popup state
  const [isHelpOpen, setIsHelpOpen] = useState(false);
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
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Drag preview state
  const [dragTargetToken, setDragTargetToken] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedAgent, setDraggedAgent] = useState<string | null>(null);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

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
    
    // Clear the search input and close dropdown
    // This will be handled by the TokenSearch component itself
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
      videoFile: "/WIZZARD/The Analyzer.webm"
    },
    {
      name: "The Predictor",
      description: "Uses historical patterns, momentum curves, and volatility signals to forecast where the market is likely to push a token next.",
      videoFile: "/WIZZARD/The Predictor.webm"
    },
    {
      name: "The Quantum Eraser",
      description: "Removes misleading noise like spoofed trades, bot spam, and fake liquidity — reconstructing a clean version of the token's true history.",
      videoFile: "/WIZZARD/The Quantum Eraser.webm"
    },
    {
      name: "The Retrocasual",
      description: "Simulates future scenarios, then feeds those echoes back into the present — letting potential outcomes reshape today's analysis.",
      videoFile: "/WIZZARD/The Retrocasual.webm"
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
  const sendMessage = useCallback(async () => {
    console.log('🚀🚀🚀 SENDMESSAGE FUNCTION CALLED!');
    console.log('📝 Input message:', inputMessage);
    console.log('📝 Input message length:', inputMessage.length);
    console.log('📝 Input message trimmed:', inputMessage.trim());
    
    if (!inputMessage.trim()) {
      console.log('❌ No message to send - input is empty');
      return;
    }
    
    console.log('🚀 Sending message:', inputMessage);
    console.log('🤖 Active companion:', attachedCompanion);
    console.log('📝 Current messages:', messages.length);
    
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
    
    // Get the active companion or use a random one
    const currentCompanion = attachedCompanion?.name || agents[Math.floor(Math.random() * agents.length)].name;
    setTypingCompanion(currentCompanion);
    setIsTyping(true);
    
    // Prepare conversation history for API
    const conversationHistory: ChatMessage[] = messages.map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
    
    // Call the chat service
    try {
      console.log('📞 Calling chat service...');
      let response: string;
      
      // If there's an active companion attached to a token, use token analysis
      if (attachedCompanion && attachedCompanion.tokenMint) {
        console.log('🎯 Using token analysis for:', attachedCompanion.name, 'on token:', attachedCompanion.tokenMint);
        const token = tokens.find(t => t.mint === attachedCompanion.tokenMint);
        if (token) {
          response = await chatService.analyzeToken(token, attachedCompanion.name, inputMessage);
        } else {
          response = await chatService.getCompanionResponse(attachedCompanion.name, conversationHistory, inputMessage);
        }
      } else {
        console.log('💬 Using general companion response for:', currentCompanion);
        // Use general companion response
        response = await chatService.getCompanionResponse(currentCompanion, conversationHistory, inputMessage);
      }
      
      console.log('✅ Received response:', response);
      
      setIsTyping(false);
      setTypingCompanion(null);
      
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
    } catch (error) {
      console.error('Chat API error:', error);
      setIsTyping(false);
      setTypingCompanion(null);
      
      // Fallback response if API fails
      const fallbackResponse = `${currentCompanion}: I apologize, but I'm having trouble connecting to my analysis systems right now. Please try again in a moment.`;
      
      const assistantMessage = { 
        type: 'assistant' as const, 
        content: fallbackResponse, 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update conversation history with the fallback response
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
    }
  }, [inputMessage, messages.length, currentConversationId, attachedCompanion, tokens, agents]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      console.log('🔥 ENTER KEY PRESSED - Calling sendMessage');
      sendMessage();
    }
  }, [sendMessage]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    
    // Auto-close settings menu when user starts typing
    if (isSettingsOpen) {
      setIsSettingsOpen(false);
      setSettingsView('menu');
    }
  }, [isSettingsOpen]);

  // Auto-scroll to bottom when new messages arrive
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Function to scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive or typing state changes
    if (messages.length > 0) {
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [messages, isTyping, scrollToBottom]);

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
      className="fixed inset-0 bg-black/95 z-50 overflow-visible flex flex-col scope-container"
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
        className="bg-black/80 border-b border-neutral-800/60 p-4 flex-shrink-0"
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
        
          {/* Right side - Help Button, Star Button, Close Button */}
          <div className="flex justify-end items-center space-x-3">
            {/* Help Button */}
            <HelpButton onHelpClick={() => setIsHelpOpen(true)} />

            {/* Star Button */}
            <HeaderStarButton tokens={tokens} onTokenClick={setFocusToken} />

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
        className="p-6 flex-1 overflow-visible relative h-full"
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
          <div className="flex flex-col border border-neutral-800/60 rounded-lg overflow-hidden">
            {/* Shared Header Row */}
            <div className="flex border-b border-neutral-800/60">
              <div className="flex-1 text-center py-4 border-r border-neutral-800/60">
                <h2 className="text-lg font-bold uppercase tracking-wider text-white">Fresh Mints</h2>
              </div>
              <div className="flex-1 text-center py-4 border-r border-neutral-800/60">
                <h2 className="text-lg font-bold uppercase tracking-wider text-white">Insights</h2>
              </div>
              <div className="flex-1 text-center py-4">
                <h2 className="text-lg font-bold uppercase tracking-wider text-white">Companions</h2>
              </div>
            </div>
            
            {/* Content Row */}
            <div className="flex">
              <TokenColumn 
                title="" 
                items={filteredTokens.newPairs} 
                className="border-r border-neutral-800/60 flex-1 min-w-0"
                  visibleMintsRef={visibleMintsRef}
                  agents={agents}
                  newTokenMint={newTokenMint}
                  attachedCompanion={attachedCompanion}
                  onCompanionDetach={handleCompanionDetach}
                  onHoverEnter={pauseLiveOnHover}
                  onHoverLeave={resumeLiveAfterHover}
                  onFocusToken={setFocusToken}
                  onDragTargetChange={setDragTargetToken}
                  draggedAgent={draggedAgent}
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
                          content: `${companionName}: Analyzed ${token.name || token.symbol || 'this token'}. MC: ${token.marketcap ? `$${token.marketcap.toLocaleString()}` : 'N/A'}, Price: ${token.price_usd ? `$${token.price_usd.toFixed(8)}` : 'N/A'}. ${token.is_on_curve ? 'On bonding curve - interesting dynamics!' : 'Standard market behavior.'}`,
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
                <InsightsColumn 
                  focusToken={focusToken}
                  className="border-r border-neutral-800/60 flex-1 min-w-0"
                />
                <div className="flex flex-col flex-1 min-w-0 relative h-[calc(100vh-200px)] overflow-visible">
                {/* Drag Target Preview */}
                {dragTargetToken && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`mx-3 mt-3 mb-3 p-2 rounded-lg ${
                      attachedCompanion && attachedCompanion.tokenMint === dragTargetToken.mint
                        ? 'bg-orange-500/10 border border-orange-500/30'
                        : draggedAgent === 'The Quantum Eraser'
                        ? 'bg-[#637e9a]/10 border border-[#637e9a]/30'
                        : draggedAgent === 'The Predictor'
                        ? 'bg-[#3ff600]/10 border border-[#3ff600]/30'
                        : draggedAgent === 'The Analyzer'
                        ? 'bg-[#195c8e]/10 border border-[#195c8e]/30'
                        : draggedAgent === 'The Retrocasual'
                        ? 'bg-[#a95109]/10 border border-[#a95109]/30'
                        : 'bg-blue-500/10 border border-blue-500/30'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                        {dragTargetToken.imageUrl ? (
                          <img 
                            src={`http://localhost:8080/api/img?u=${encodeURIComponent(dragTargetToken.imageUrl)}`}
                            alt={dragTargetToken.symbol || dragTargetToken.name || "Token"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                            {(dragTargetToken.symbol || dragTargetToken.name || "T").slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">
                          {dragTargetToken.name || dragTargetToken.symbol || 'Unknown Token'}
                        </div>
                        <div className={`text-sm truncate ${
                          attachedCompanion && attachedCompanion.tokenMint === dragTargetToken.mint
                            ? 'text-orange-300'
                            : draggedAgent === 'The Quantum Eraser'
                            ? 'text-[#637e9a]'
                            : draggedAgent === 'The Predictor'
                            ? 'text-[#3ff600]'
                            : draggedAgent === 'The Analyzer'
                            ? 'text-[#195c8e]'
                            : draggedAgent === 'The Retrocasual'
                            ? 'text-[#a95109]'
                            : 'text-blue-300'
                        }`}>
                          {dragTargetToken.mint.slice(0, 6)}...{dragTargetToken.mint.slice(-6)}
                        </div>
                      </div>
                      <div className={`text-sm font-medium ${
                        attachedCompanion && attachedCompanion.tokenMint === dragTargetToken.mint
                          ? 'text-orange-400'
                          : draggedAgent === 'The Quantum Eraser'
                          ? 'text-[#637e9a]'
                          : draggedAgent === 'The Predictor'
                          ? 'text-[#3ff600]'
                          : draggedAgent === 'The Analyzer'
                          ? 'text-[#195c8e]'
                          : draggedAgent === 'The Retrocasual'
                          ? 'text-[#a95109]'
                          : 'text-blue-400'
                      }`}>
                        {attachedCompanion && attachedCompanion.tokenMint === dragTargetToken.mint ? 'Switch' : 'Target'}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Active Companion Preview */}
                {attachedCompanion && (() => {
                  const token = tokens.find(t => t.mint === attachedCompanion.tokenMint);
                  if (!token) return null;
                  
                  return (
                    <motion.div
                      key={attachedCompanion.tokenMint}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="mx-3 mt-3 mb-3 p-2 bg-green-500/10 border border-green-500/30 rounded-lg"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                          {token.imageUrl ? (
                            <img 
                              src={`http://localhost:8080/api/img?u=${encodeURIComponent(token.imageUrl)}`}
                              alt={token.symbol || token.name || "Token"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-green-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                              {(token.symbol || token.name || "T").slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm font-medium truncate">
                            {token.name || token.symbol || 'Token'}
                          </div>
                          <div className="text-green-300 text-sm truncate">
                            {attachedCompanion.name} • {token.mint.slice(0, 6)}...{token.mint.slice(-6)}
                          </div>
                        </div>
                        <button
                          onClick={() => handleCompanionDetach()}
                          className="p-0.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-full transition-all duration-200 hover:scale-110"
                          title="Remove companion"
                        >
                          <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  );
                })()}
                
                
                
                {/* Debug Hover State */}
                {hoveredAgent && (
                  <div className="fixed top-4 left-4 bg-red-500 text-white p-2 rounded z-99999">
                    HOVERING: {hoveredAgent.name}
                  </div>
                )}

                {/* Companion orbs section - positioned under COMPANIONS header */}
                <div 
                  className="flex flex-col items-center py-4 relative z-10 pointer-events-auto overflow-visible"
                  onMouseLeave={() => setHoveredAgent(null)}
                  onDragEnd={() => {
                    // Clear all drag states when drag ends anywhere
                    setIsDragging(false);
                    setDraggedAgent(null);
                    setDragTargetToken(null);
                  }}
                >
                  <div className="flex gap-4 overflow-visible">
                    {agents.filter(agent => {
                      // Only show companions that are NOT currently attached
                      return !attachedCompanion || attachedCompanion.name !== agent.name;
                    }).map((agent, index) => (
                      <div
                        key={agent.name}
                        draggable={true}
                        className={`relative w-20 h-20 rounded-full cursor-grab active:cursor-grabbing overflow-visible transition-all duration-300 hover:scale-110 ${
                          draggedAgent === agent.name ? 'opacity-0 pointer-events-none' : 'opacity-100'
                        }`}
                        style={{ 
                          background: 'transparent',
                          backgroundColor: 'transparent',
                          pointerEvents: 'auto',
                          zIndex: 1000,
                          border: 'none',
                          outline: 'none'
                        }}
                        onMouseEnter={(e) => {
                          e.stopPropagation();
                          console.log('Mouse enter agent:', agent.name);
                          // Clear any pending timeout
                          if (hoverTimeoutRef.current) {
                            clearTimeout(hoverTimeoutRef.current);
                            hoverTimeoutRef.current = null;
                          }
                          setHoveredAgent(agent);
                        }}
                        onMouseLeave={(e) => {
                          e.stopPropagation();
                          console.log('Mouse leave agent:', agent.name);
                          // Clear any existing timeout
                          if (hoverTimeoutRef.current) {
                            clearTimeout(hoverTimeoutRef.current);
                            hoverTimeoutRef.current = null;
                          }
                          // Remove hover immediately - no delay
                          setHoveredAgent(null);
                        }}
                        onMouseMove={(e) => {
                          e.stopPropagation();
                          // Clear any pending timeout when moving within the orb
                          if (hoverTimeoutRef.current) {
                            clearTimeout(hoverTimeoutRef.current);
                            hoverTimeoutRef.current = null;
                          }
                          // Ensure hover state is maintained while moving within the orb
                          if (hoveredAgent?.name !== agent.name) {
                            setHoveredAgent(agent);
                          }
                        }}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', agent.name);
                          e.dataTransfer.effectAllowed = 'copy';
                          setIsDragging(true);
                          setDraggedAgent(agent.name);
                        }}
                        onDragEnd={(e) => {
                          // Reset the drag state immediately
                          setIsDragging(false);
                          setDraggedAgent(null);
                          // Clear drag target immediately - no need for delay
                          setDragTargetToken(null);
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
                            filter: 'brightness(1.2) contrast(1.1)'
                          }}
                        >
                          <source src={agent.videoFile} type="video/webm" />
                        </video>
                        
                      </div>
                    ))}
                  </div>
                  
                  {/* HOVER CARD - ABSOLUTE POSITIONED UNDER WEBM ORBS */}
                  {hoveredAgent && (
                    <div
                      className="absolute w-80 rounded-xl p-4"
                      style={{ 
                        zIndex: 99999,
                        background: 'rgba(0, 0, 0, 0.85)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(10px)',
                        top: '120px',
                        left: '50%',
                        transform: 'translateX(-50%)'
                      }}
                    >
                      <div className="space-y-3">
                        {/* Title with icon */}
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                            <video 
                              className="w-full h-full object-cover"
                              autoPlay 
                              muted 
                              loop
                              playsInline
                              style={{ 
                                mixBlendMode: 'screen',
                                filter: 'brightness(1.2) contrast(1.1)',
                                background: 'transparent'
                              }}
                            >
                              <source src={hoveredAgent.videoFile} type="video/webm" />
                            </video>
                          </div>
                          <h3 className="text-white text-lg font-bold">{hoveredAgent.name}</h3>
                        </div>
                        
                        {/* Description */}
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <p className="text-gray-200 text-sm leading-relaxed">
                            {hoveredAgent.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                </div>


                {/* Main content area with proper height calculation */}
                <div className="flex-1 flex flex-col min-h-0 max-h-full overflow-visible relative z-0">
                  {/* Messages display area - proper chat layout */}
                  <div 
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto scrollbar-hide" 
                    style={{ 
                      scrollBehavior: 'smooth',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
                    }}
                  >
                    <div className="flex flex-col min-h-full p-4 pb-2 relative">
                      {messages.length === 0 && !isDragging && !draggedAgent ? (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                          <div className="text-gray-500 text-center italic transition-opacity duration-300 ease-in-out text-lg">
                            Drag a companion onto a token, pick a companion, or start typing to begin…
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col justify-end h-full">
                        <div className="space-y-2">
                          {messages.map((message, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ duration: 0.2, ease: "easeOut" }}
                              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-1`}
                            >
                              <div
                                className={`max-w-[75%] rounded-2xl px-4 py-3 break-words shadow-sm ${
                                  message.type === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-md'
                                    : 'bg-gray-700 text-gray-100 rounded-bl-md'
                                }`}
                              >
                                <div className="text-sm leading-relaxed break-words">{message.content}</div>
                                <div className={`text-xs mt-2 ${
                                  message.type === 'user' ? 'text-blue-200 text-right' : 'text-gray-400 text-left'
                                }`}>
                                  {message.timestamp.toLocaleTimeString()}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                          
                          {/* Typing indicator */}
                          {isTyping && typingCompanion && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              transition={{ duration: 0.2, ease: "easeOut" }}
                              className="flex justify-start mb-1"
                            >
                              <div className="bg-gray-700 text-gray-100 rounded-2xl rounded-bl-md px-4 py-3 max-w-[75%] shadow-sm">
                                <div className="flex items-center space-x-2">
                                  <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                  </div>
                                  <span className="text-sm text-gray-400">{typingCompanion} is typing...</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                        </div>
                      )}
                      
                      {/* Auto-scroll anchor */}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                  
                  {/* Chat input row at bottom - fixed with proper spacing */}
                  <div className="shrink-0 border-t border-neutral-800/60 bg-black/95">
                    <div className="w-full p-4 pt-3 flex justify-center items-center h-20 chat-input-container">
                      <div className="w-full max-w-4xl flex items-center gap-3">
                        {/* Settings Button */}
                        <button
                          onClick={() => {
                            setIsSettingsOpen(!isSettingsOpen);
                            if (!isSettingsOpen) {
                              setSettingsView('menu');
                            }
                          }}
                          className="flex-shrink-0 text-gray-300 hover:text-white rounded-full p-3 h-12 w-12 transition-all duration-300"
                          title="Settings & History"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>

                        {/* Input Field */}
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={inputMessage}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your message..."
                            className="w-full h-12 px-6 py-3 bg-gray-800/50 border border-gray-600/30 rounded-full text-gray-200 placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:bg-gray-800/70 transition-all duration-300 hover:border-gray-500/40 hover:bg-gray-800/60"
                            style={{ scrollBehavior: 'auto' }}
                          />
                        </div>

                        {/* Send Button */}
                        <button
                          onClick={() => {
                            console.log('🔥 SEND BUTTON CLICKED - Calling sendMessage');
                            sendMessage();
                          }}
                          className={`flex-shrink-0 rounded-full px-4 py-3 h-12 transition-all duration-300 font-medium ${
                            inputMessage.trim() 
                              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl' 
                              : 'bg-gray-700/50 text-gray-400 cursor-not-allowed'
                          }`}
                          disabled={!inputMessage.trim()}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
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
                              setIsSettingsOpen(false);
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
      
      {/* Help Popup */}
      <HelpPopup isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
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
  pauseLiveOnHover: () => void;
  resumeLiveAfterHover: () => void;
  isHoverPaused: boolean;
  queuedTokens: any[];
  newTokenMint: string | null;
}> = (props) => {
  return (
    <WatchlistProvider>
      <Scope {...props} />
    </WatchlistProvider>
  );
};

export default ScopeWithWatchlist;
