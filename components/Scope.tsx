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
  
  const copyMintAddress = async () => {
    try {
      await navigator.clipboard.writeText(token.mint);
    } catch (err) {
      console.error('Failed to copy mint address:', err);
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
      className="relative isolate overflow-visible rounded-xl border border-white/10 bg-white/5 p-4 shadow-sm hover:scale-105 hover:z-10 transition-all duration-200 token-card"
      style={{ willChange: 'transform' }}
    >

      
      {/* Header row: avatar, name/symbol, copy button */}
      <div className="grid grid-cols-[auto_1fr_auto] items-start gap-3">
        {/* Avatar container with HoverImagePreview */}
        <div className="relative h-9 w-9 shrink-0 overflow-visible">
          <HoverImagePreview 
            src={token.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(token.symbol || "T")}`}
            alt={token.symbol || token.name}
            thumbClass="h-full w-full object-cover rounded-md"
          />
        </div>
        
        {/* Token info */}
        <div className="min-w-0">
          <h3 className="text-white font-semibold truncate">
            {token.name}
          </h3>
          <div className="text-green-400 text-sm font-mono truncate">{token.symbol}</div>
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
            ${token.marketCap ? token.marketCap.toLocaleString() : '—'}
          </span>
        </div>
        <div className="min-w-0">
          <span className="text-white/60">Price:</span>
          <span className="text-white ml-1 font-mono truncate">
            ${token.price ? token.price.toFixed(8) : '—'}
          </span>
        </div>
        <div className="min-w-0">
          <span className="text-white/60">Vol:</span>
          <span className="text-white ml-1 font-mono truncate">
            ${token.volume24h ? Math.round(token.volume24h).toLocaleString() : '—'}
          </span>
        </div>
      </div>
      
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
  a.price === b.price &&
  a.liquidity === b.liquidity &&
  a.volume24h === b.volume24h &&
  JSON.stringify(a.links) === JSON.stringify(b.links);

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
    <div className={`flex flex-col gap-3 min-w-0 flex-1 relative z-0 ${className}`}>
      <h2 className="text-white text-lg font-bold text-center flex-shrink-0">{title}</h2>
      <div className="rounded-2xl bg-black/20 p-4 overflow-y-auto overflow-x-visible h-[calc(100vh-200px)] max-h-[calc(100vh-200px)]">
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
                <div key={`${token.mint}-${token.updated_at || token.created_at || index}`} className="relative">
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

  // Auto-close chat when Scope closes
  useEffect(() => {
    if (!isOpen) {
      setIsChatOpen(false);
      setMessages([]);
      setInputMessage('');
    }
  }, [isOpen]);

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
      return { newPairs: [], onEdge: [], filled: [] };
    }
    
    // Debug: Log first few tokens to see their structure
    console.log("🔍 Sample tokens:", tokens.slice(0, 3).map(t => ({
      name: t.name,
      symbol: t.symbol,
      status: t.status
    })));
    
    const newPairs = tokens.filter(t => t && t.status === 'fresh');
    const filled = tokens.filter(t => t && t.status === 'active');
    const onEdge = tokens.filter(t => t && t.status === 'fresh' && t.latest_marketcap?.liquidity && t.latest_marketcap.liquidity > 0);
    
    console.log("✅ Filtered tokens:", {
      newPairs: newPairs.length,
      onEdge: onEdge.length, 
      filled: filled.length,
      total: tokens.length
    });
    return { newPairs, onEdge, filled };
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

  // Early return after all hooks have been called
  if (!isOpen) {
    return null;
  }

  return (
    <motion.div 
      className="fixed inset-0 bg-black/95 z-50 overflow-hidden flex flex-col scope-container"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ 
        duration: 0.4, 
        ease: [0.25, 0.46, 0.45, 0.94],
        staggerChildren: 0.1
      }}
    >
      {/* Header */}
      <motion.div 
        className="bg-black/80 border-b border-white/10 p-4 flex-shrink-0"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <motion.h1 
              className="text-2xl font-bold text-white"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              SCOPE
            </motion.h1>
            
            {/* Chat Toggle Button */}
            <motion.button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                isChatOpen 
                  ? 'bg-green-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-700 hover:bg-blue-800 text-white'
              }`}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm font-medium">{isChatOpen ? 'Close Chat' : 'Chat'}</span>
            </motion.button>
          </div>
          
          {/* Close Button - Top Right */}
          <motion.button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors duration-200"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div 
        className="p-6 flex-1 overflow-hidden relative h-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
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
            <div className={`flex gap-6 transition-all duration-300 ease-in-out ${
              isChatOpen ? 'w-[calc(100%-450px)]' : 'w-full'
            }`}>
              <TokenColumn 
                title="Fresh Mints" 
                items={filteredTokens.newPairs} 
                className="border-r border-gray-700 flex-1"
                visibleMintsRef={visibleMintsRef}
              />
              <TokenColumn 
                title="Fresh + Liquidity" 
                items={filteredTokens.onEdge} 
                className="border-r border-gray-700 flex-1"
                visibleMintsRef={visibleMintsRef}
              />
              <TokenColumn 
                title="Active Tokens" 
                items={filteredTokens.filled} 
                className="flex-1"
                visibleMintsRef={visibleMintsRef}
              />
            </div>
            
            {/* Chat + Companions Panel - Absolute positioned for full height with smooth animation */}
            <div className={`bg-black/80 border-l border-gray-700 transition-all duration-300 ease-in-out ${
              isChatOpen 
                ? 'w-[450px]' 
                : 'w-0 overflow-hidden'
            } absolute right-0 bottom-0 h-full z-50 flex-shrink-0`}>
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
                            dragPreview.className = 'fixed pointer-events-none z-[9999] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-2xl border-2 border-white/20';
                            dragPreview.style.width = '80px';
                            dragPreview.style.height = '80px';
                            dragPreview.style.transform = 'translate(-50%, -50%)';
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
                            
                            // Remove the preview after drag starts
                            setTimeout(() => {
                              if (document.body.contains(dragPreview)) {
                                document.body.removeChild(dragPreview);
                              }
                            }, 100);
                          }}
                          onDragEnd={(e) => {
                            // Clean up any remaining previews
                            const previews = document.querySelectorAll('[style*="pointer-events-none"]');
                            previews.forEach(preview => {
                              if (preview.parentNode) {
                                preview.parentNode.removeChild(preview);
                              }
                            });
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
