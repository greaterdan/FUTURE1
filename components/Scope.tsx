"use client";
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";


import ImageWithFallback from './ImageWithFallback';
import SocialBadges from './SocialBadges';
import HoverImagePreview from './HoverImagePreview';

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
type CardProps = { token: any; visibleMintsRef: React.MutableRefObject<Set<string>> };
const TokenCardBase: React.FC<CardProps> = React.memo(({ token, visibleMintsRef }) => {
  const cardRef = useVisibility(token.mint, visibleMintsRef);
  const [isDragOver, setIsDragOver] = useState(false);
  const [attachedCompanion, setAttachedCompanion] = useState<string | null>(null);
  
  const copyMintAddress = async () => {
    try {
      await navigator.clipboard.writeText(token.mint);
    } catch (err) {
      console.error('Failed to copy mint address:', err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
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
    
    // Prevent dropping if a companion is already attached
    if (attachedCompanion) {
      console.log(`Token ${token.mint} already has companion ${attachedCompanion} attached`);
      return;
    }
    
    const agentName = e.dataTransfer.getData('text/plain');
    if (agentName) {
      console.log(`Agent ${agentName} dropped on token ${token.mint}`);
      
      // Set the attached companion
      setAttachedCompanion(agentName);
      
      // Add a success animation
      const card = e.currentTarget as HTMLElement;
      card.style.transform = 'scale(1.05)';
      card.style.transition = 'transform 0.2s ease-out';
      
      setTimeout(() => {
        card.style.transform = 'scale(1)';
      }, 200);
      
      // Here you can add logic to handle the agent-token interaction
      // For example, open chat with the agent analyzing this specific token
      // You could emit an event or call a callback to open the chat panel
    }
  };
  
  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ 
        duration: 0.15,
        ease: "easeOut"
      }}
      className={`relative isolate overflow-visible rounded-xl border p-4 shadow-sm hover:scale-105 hover:z-10 transition-all duration-200 token-card ${
        isDragOver && !attachedCompanion
          ? 'border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/30 scale-105 z-20 ring-2 ring-blue-400/50 animate-pulse shadow-[0_0_20px_rgba(59,130,246,0.5)]' 
          : 'border-white/10 bg-white/5'
      }`}
      style={{ willChange: 'transform' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
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
          className="absolute bottom-3 left-1/2 transform -translate-x-1/2 z-20"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-lg border border-white/30 flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {attachedCompanion.split(' ').map(word => word[0]).join('')}
            </span>
          </div>
        </motion.div>
      )}
      
      {/* Header row: avatar, name/symbol, copy button */}
      <div className="grid grid-cols-[auto_1fr_auto] items-start gap-3">
        {/* Avatar container with HoverImagePreview */}
        <div className="relative h-9 w-9 shrink-0 overflow-visible">
          <HoverImagePreview 
            src={token.image_url || token.image || `https://api.dicebear.com/8.x/shapes/svg?seed=${token.mint}`}
            alt={token.symbol || token.name || "Token"}
            thumbClass="h-full w-full object-cover rounded-md"
          />
        </div>
        
        {/* Token info */}
        <div className="min-w-0">
          <h3 className="text-white font-semibold truncate">
            {token.name || token.symbol || `${token.mint.slice(0, 4)}…${token.mint.slice(-4)}`}
          </h3>
          <div className="text-white/80 text-sm font-mono truncate">
            {token.symbol || token.mint.slice(0, 4)}
          </div>
        </div>
        
        {/* Copy button */}
        <button
          onClick={copyMintAddress}
          className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white/60 hover:text-white text-xs rounded border border-white/20 transition-all duration-200 flex items-center space-x-1 shrink-0"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span>Copy</span>
        </button>
      </div>
      
      {/* Metrics row */}
      <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
        <div className="min-w-0">
          <span className="text-white/60">MC:</span>
          <span className="text-white ml-1 font-mono truncate">
            {token.is_on_curve ? '— (on curve)' : (token.marketcap ? `$${token.marketcap.toLocaleString()}` : '—')}
          </span>
        </div>
        <div className="min-w-0">
          <span className="text-white/60">Price:</span>
          <span className="text-white ml-1 font-mono truncate">
            {token.is_on_curve ? '— (on curve)' : (token.price_usd ? `$${token.price_usd.toFixed(8)}` : '—')}
          </span>
        </div>
        <div className="min-w-0">
          <span className="text-white/60">Vol:</span>
          <span className="text-white ml-1 font-mono truncate">
            {token.is_on_curve ? '— (on curve)' : (token.volume_24h ? `$${Math.round(token.volume_24h).toLocaleString()}` : '—')}
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
        <SocialBadges links={token.links} />
        <span className="text-xs text-white/30 font-mono ml-auto">
          {token.mint.slice(0, 4)}...{token.mint.slice(-4)}
        </span>
      </div>
    </motion.div>
  );
});

const shallowPickEq = (a: any, b: any) =>
  a.mint === b.mint &&
  a.name === b.name &&
  a.symbol === b.symbol &&
  a.image_url === b.image_url &&
  a.is_on_curve === b.is_on_curve &&
  a.price_usd === b.price_usd &&
  a.liquidity === b.liquidity &&
  a.volume_24h === b.volume_24h &&
  JSON.stringify(a.links) === JSON.stringify(a.links);

export const TokenCard = React.memo(TokenCardBase, (prev, next) =>
  shallowPickEq(prev.token, next.token)
);

// Token Column
function TokenColumn({ 
  title, 
  items, 
  className = "",
  visibleMintsRef
}: { 
  title: string; 
  items: any[]; 
  className?: string;
  visibleMintsRef: React.MutableRefObject<Set<string>>;
}) {

  return (
    <div className={`flex flex-col gap-3 min-w-0 flex-1 relative z-0 cursor-default ${className}`}>
      <h2 className="text-white text-lg font-bold text-center flex-shrink-0">{title}</h2>
      <div className="w-full border-b border-gray-700 mb-3 -mx-3" />
      <div className="rounded-2xl bg-black/20 p-4 overflow-y-auto overflow-x-visible h-[calc(100vh-180px)] max-h-[calc(100vh-180px)] pb-6 cursor-default">
        <div className="flex flex-col gap-2">
          {items.length === 0 ? (
            <div className="text-center text-white/40 py-8">
              <div className="text-2xl mb-2">📭</div>
              <div className="text-sm">No tokens yet</div>
            </div>
          ) : (
            <>
              <div className="text-xs text-white/40 mb-2 text-center">
                {items.length} tokens
              </div>
              {items.map((token, index) => (
                <div key={`${token.mint}-${token.updated_at || token.created_at || index}`} className={`relative ${index === items.length - 1 ? 'mb-4' : ''}`}>
                  <TokenCard 
                    token={token} 
                    visibleMintsRef={visibleMintsRef} 
                  />
                </div>
              ))}
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
  onClose: () => void;
}) => {
  // Track visible mints for performance optimization
  const visibleMintsRef = useRef<Set<string>>(new Set());
  
  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ type: 'user' | 'assistant'; content: string; timestamp: Date }>>([]);
  const [inputMessage, setInputMessage] = useState('');

  // AI Agents state
  const [hoveredAgent, setHoveredAgent] = useState<any>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Chat resize state
  const [chatWidth, setChatWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);

  // Auto-close chat when Scope closes
  useEffect(() => {
    if (!isOpen) {
      setIsChatOpen(false);
      setMessages([]);
      setInputMessage('');
      setChatWidth(450); // Reset width when closing
    }
  }, [isOpen]);
  
  // Chat resize handlers
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };
  
  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const newWidth = window.innerWidth - e.clientX;
    const minWidth = 300;
    const maxWidth = 800;
    
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      // Use requestAnimationFrame for smooth updates
      requestAnimationFrame(() => {
        setChatWidth(newWidth);
      });
    }
  }, [isResizing]);
  
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);
  
  // Add resize event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Cleanup function for drag previews
  const cleanupDragPreviews = useCallback(() => {
    // Clean up by data attribute first (most reliable)
    const dragPreviews = document.querySelectorAll('[data-drag-preview="true"]');
    dragPreviews.forEach(preview => {
      if (preview.parentNode) {
        preview.parentNode.removeChild(preview);
      }
    });
    
    // Fallback cleanup for any remaining previews
    const previews = document.querySelectorAll('[style*="pointer-events-none"], [style*="left: -9999px"]');
    previews.forEach(preview => {
      if (preview.parentNode) {
        preview.parentNode.removeChild(preview);
      }
    });
  }, []);

  // Clean up drag previews when component unmounts or when Scope closes
  useEffect(() => {
    return () => {
      cleanupDragPreviews();
    };
  }, [cleanupDragPreviews]);

  // Also clean up on window blur (when user switches tabs or drag is interrupted)
  useEffect(() => {
    const handleWindowBlur = () => {
      cleanupDragPreviews();
    };

    window.addEventListener('blur', handleWindowBlur);
    return () => window.removeEventListener('blur', handleWindowBlur);
  }, [cleanupDragPreviews]);

  // AI Agents data
  const agents = [
    {
      name: "The Analyzer",
      description: "Breaks down every token's anatomy: market cap, liquidity depth, holder distribution, wallet flows, and trading frequency — exposing both strength and weakness."
    },
    {
      name: "The Predictor",
      description: "Uses historical patterns, momentum curves, and volatility signals to forecast where the market is likely to push a token next."
    },
    {
      name: "The Quantum Eraser",
      description: "Removes misleading noise like spoofed trades, bot spam, and fake liquidity — reconstructing a clean version of the token's true history."
    },
    {
      name: "The Retrocasual",
      description: "Simulates future scenarios, then feeds those echoes back into the present — letting potential outcomes reshape today's analysis."
    }
  ];

  // Debug: Monitor tokens state changes
  useEffect(() => {
    console.log("🎯 SCOPE: Tokens state changed:", {
      tokensLength: tokens?.length || 0,
      isLoading,
      connectionStatus,
      lastUpdate: lastUpdate?.toLocaleTimeString()
    });
    

  }, [tokens, isLoading, connectionStatus, lastUpdate]);



  // Memoize filtered tokens to prevent recalculation on every render
  const filteredTokens = useMemo(() => {
    console.log("🔍 Filtering tokens:", tokens?.length || 0, "tokens received");
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      console.log("❌ No tokens to filter");
      return { newPairs: [], onEdge: [], filled: [], curveTokens: [] };
    }
    
    // Debug: Log first few tokens to see their structure
    console.log("🔍 Sample tokens:", tokens.slice(0, 3).map(t => ({
      name: t.name,
      symbol: t.symbol,
      status: t.status,
      isOnCurve: t.isOnCurve
    })));
    
    const newPairs = tokens.filter(t => t && t.status === 'fresh' && !t.isOnCurve);
    const filled = tokens.filter(t => t && t.status === 'active');
    const onEdge = tokens.filter(t => t && t.status === 'fresh' && !t.isOnCurve && t.latest_marketcap?.liquidity && t.latest_marketcap.liquidity > 0);
    const curveTokens = tokens.filter(t => t && (t.status === 'curve' || t.isOnCurve));
    
    console.log("✅ Filtered tokens:", {
      newPairs: newPairs.length,
      onEdge: onEdge.length, 
      filled: filled.length,
      curveTokens: curveTokens.length,
      total: tokens.length
    });
    return { newPairs, onEdge, filled, curveTokens };
  }, [tokens]);

  // Chat functions - memoized to prevent recreation
  const sendMessage = useCallback(() => {
    if (!inputMessage.trim()) return;
    
    const userMessage = { type: 'user' as const, content: inputMessage, timestamp: new Date() };
    setMessages(prev => [userMessage, ...prev]);
    setInputMessage('');
    
    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage = { type: 'assistant' as const, content: 'I understand you\'re asking about: ' + inputMessage, timestamp: new Date() };
      setMessages(prev => [assistantMessage, ...prev]);
    }, 1000);
  }, [inputMessage]);

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
  }, []);

  // Auto-scroll to bottom when new messages arrive - ONLY when sending, not when typing
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Only auto-scroll when actually sending a message, not on every message change
    if (messages.length > 0 && messages[0].type === 'user') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Add keyboard shortcut to close SCOPE with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Clean up state immediately when closing
        setIsChatOpen(false);
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
      className="fixed inset-0 bg-black/95 z-50 overflow-hidden flex flex-col scope-container cursor-default"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ 
        duration: 0.4, 
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      style={{ cursor: 'default' }}
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
          
                     {/* Center - Search Bar + Chat Button (same row) */}
           <div className="flex items-center justify-center space-x-4">
             {/* Search Bar */}
             <motion.div 
               className="w-96"
               initial={{ y: -10, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
             >
               <div className="relative">
                 <input
                   type="text"
                   placeholder="Search by token or CA"
                   className="w-full px-4 py-2 bg-transparent border border-white/30 rounded-full text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                 />
                 <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                   <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                   </svg>
                 </div>
               </div>
             </motion.div>
             
             {/* Chat Button - Between Search and Close */}
             <motion.button
               onClick={() => setIsChatOpen(!isChatOpen)}
               className={`p-2 rounded-full transition-all duration-300 ${
                 isChatOpen 
                   ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30' 
                   : 'bg-white/10 hover:bg-white/20 border border-white/20'
               }`}
               initial={{ y: -10, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
               whileHover={{ scale: 1.1 }}
               whileTap={{ scale: 0.95 }}
             >
               <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
               </svg>
             </motion.button>
           </div>
          
          {/* Right side - Close Button */}
          <div className="flex justify-end">
            <motion.button
              onClick={() => {
                // Clean up state immediately when closing
                setIsChatOpen(false);
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
        className="p-6 flex-1 overflow-hidden relative h-full cursor-default"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ cursor: 'default' }}
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
            {/* Token Columns - will shrink/expand based on chat state with smooth animation */}
            <div 
              className="flex gap-6"
              style={{
                width: isChatOpen ? `calc(100% - ${chatWidth}px)` : '100%',
                transition: isResizing ? 'none' : 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <TokenColumn 
                title="FRESH MINTS" 
                items={filteredTokens.newPairs} 
                className="border-r border-gray-700 flex-1"
                visibleMintsRef={visibleMintsRef}
              />
              <TokenColumn 
                title="ON EDGE" 
                items={filteredTokens.onEdge} 
                className="border-r border-gray-700 flex-1"
                visibleMintsRef={visibleMintsRef}
              />
              <TokenColumn 
                title="FILLED" 
                items={filteredTokens.filled} 
                className="flex-1"
                visibleMintsRef={visibleMintsRef}
              />
            </div>
            
            {/* Chat + Companions Panel - Absolute positioned for full height with smooth animation */}
            <div 
              className={`bg-black/80 border-l border-gray-700 absolute right-0 bottom-0 h-full z-50 flex-shrink-0 ${
                isChatOpen ? 'overflow-hidden' : 'w-0 overflow-hidden'
              }`}
              style={{
                width: isChatOpen ? `${chatWidth}px` : '0px',
                transition: isResizing ? 'none' : 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {/* Resize Handle - Left edge */}
              {isChatOpen && (
                <div
                  className="absolute left-0 top-0 bottom-0 w-2 bg-gray-600 hover:bg-blue-500 cursor-col-resize transition-colors duration-200 z-10 group"
                  onMouseDown={handleResizeStart}
                  title="Drag to resize chat panel"
                >
                  {/* Visual indicator for resize handle */}
                  <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 bg-white/30 group-hover:bg-white/50 transition-all duration-200" />
                </div>
              )}
              <div className="h-full flex flex-col">
                {/* Companions Section - Fixed height */}
                <div className="p-4 border-b border-gray-700 flex-shrink-0">
                  <div className="flex items-center justify-center mb-4">
                    <h2 className="text-xl font-bold text-white">Companions</h2>
                  </div>
                  <div className="flex justify-center">
                    <div className="flex gap-4">
                      {agents.map((agent, index) => (
                        <div
                          key={index}
                          draggable="true"
                          className="relative w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-lg cursor-grab active:cursor-grabbing overflow-hidden transition-all duration-300 hover:scale-110 hover:shadow-blue-500/50"
                          onMouseEnter={() => setHoveredAgent(agent)}
                          onMouseLeave={() => setHoveredAgent(null)}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', agent.name);
                            
                            // Create a custom drag preview that's bigger and animated
                            const dragPreview = document.createElement('div');
                            dragPreview.className = 'absolute pointer-events-none z-[100] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-2xl border-2 border-white/20';
                            dragPreview.setAttribute('data-drag-preview', 'true');
                            dragPreview.style.width = '80px';
                            dragPreview.style.height = '80px';
                            dragPreview.style.left = '-9999px'; // Position off-screen
                            dragPreview.style.top = '-9999px';
                            dragPreview.style.transition = 'all 0.2s ease-out';
                            
                            // Add the agent initials
                            dragPreview.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                                ${agent.name.split(' ').map(word => word[0]).join('')}
                              </div>
                            `;
                            
                            document.body.appendChild(dragPreview);
                            
                            // Set the custom drag image
                            e.dataTransfer.setDragImage(dragPreview, 40, 40);
                            
                            // Remove the preview immediately after drag image is set
                            requestAnimationFrame(() => {
                              if (document.body.contains(dragPreview)) {
                                document.body.removeChild(dragPreview);
                              }
                            });
                          }}
                          onDragEnd={(e) => {
                            // Use the centralized cleanup function
                            cleanupDragPreviews();
                          }}
                        >
                          <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs text-center leading-tight">
                            {agent.name.split(' ').map(word => word[0]).join('')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Messages Area - Expandable */}
                <div className="flex-1 overflow-y-auto flex flex-col-reverse p-4 min-h-0 custom-scrollbar">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-gray-500 text-center italic transition-opacity duration-300 ease-in-out text-lg">
                        Drag a companion onto a token, pick a companion, or start typing to begin…
                      </div>
                    </div>
                  ) : (
                    <>
                      {messages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex mb-3 text-base leading-relaxed ${
                            message.type === 'assistant' 
                              ? 'justify-start' 
                              : 'justify-end'
                          }`}
                        >
                          <div className={`${
                            message.type === 'assistant' 
                              ? 'bg-gray-800 text-gray-200' 
                              : 'bg-blue-600 text-white'
                          } p-3 rounded-lg max-w-[75%]`}>
                            {message.content}
                          </div>
                        </div>
                      ))}
                      {/* Scroll anchor for auto-scroll */}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
                
                {/* Input Area - Fixed at bottom with fixed height */}
                <div className="w-full bg-black/70 border-t border-gray-700 p-2 flex items-center gap-2 flex-shrink-0 h-16 chat-input-container">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    onFocus={(e) => e.preventDefault()}
                    onBlur={(e) => e.preventDefault()}
                    placeholder="Type your message..."
                    className="flex-1 rounded-lg bg-gray-900 p-2 text-base text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
                    style={{ scrollBehavior: 'auto' }}
                  />
                  <button
                    onClick={sendMessage}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 h-10"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>



    </motion.div>
  );
};

export default Scope;
