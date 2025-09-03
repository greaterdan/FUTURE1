"use client";
import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FreshMint } from "../hooks/useFreshMints";

interface FreshMintsProps {
  mints: FreshMint[];
  isLoading: boolean;
  lastUpdate: Date;
  error: string | null;
}

const FreshMints: React.FC<FreshMintsProps> = ({ mints, isLoading, lastUpdate, error }) => {
  const previousMintsRef = useRef<FreshMint[]>([]);
  const [newMintIds, setNewMintIds] = React.useState<Set<number>>(new Set());

  // Detect new mints when the mints array updates
  useEffect(() => {
    if (previousMintsRef.current.length > 0 && mints.length > previousMintsRef.current.length) {
      // Find new mints (they'll be at the beginning of the array)
      const newMints = mints.slice(0, mints.length - previousMintsRef.current.length);
      const newIds = new Set(newMints.map(mint => mint.id));
      
      setNewMintIds(newIds);
      
      // Clear the new mint status after animation completes
      const timer = setTimeout(() => {
        setNewMintIds(new Set());
      }, 2000);
      
      return () => clearTimeout(timer);
    }
    
    previousMintsRef.current = mints;
  }, [mints]);

  const copyMintAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
    } catch (err) {
      console.error('Failed to copy mint address:', err);
    }
  };

  const formatBlocktime = (blocktime: Date | number) => {
    const date = blocktime instanceof Date ? blocktime : new Date(blocktime * 1000);
    return date.toLocaleString();
  };

  const getTimeAgo = (blocktime: Date | number) => {
    const now = Date.now();
    const blocktimeMs = blocktime instanceof Date ? blocktime.getTime() : blocktime * 1000;
    const diff = Math.floor((now - blocktimeMs) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (isLoading) {
    return (
      <div className="text-white p-6 text-center">
        <div className="text-xl mb-2">🔍</div>
        <div>Discovering fresh mints...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 p-6 text-center">
        <div className="text-xl mb-2">❌</div>
        <div>Error: {error}</div>
      </div>
    );
  }

  if (mints.length === 0) {
    return (
      <div className="text-white/60 p-6 text-center">
        <div className="text-xl mb-2">📭</div>
        <div>No fresh mints discovered yet</div>
        <div className="text-sm mt-2">Waiting for new InitializeMint transactions...</div>
      </div>
    );
  }

  return (
    <div className="text-white">
      <div className="mb-4 text-center">
        <h2 className="text-2xl font-bold mb-2">Fresh Mints</h2>
        <div className="text-sm text-white/60">
          Last updated: {lastUpdate.toLocaleTimeString()} • {mints.length} mints discovered
        </div>
      </div>
      
      <div className="grid gap-3 max-h-[calc(100vh-200px)] overflow-y-auto">
        <AnimatePresence>
          {mints.map((mint, index) => {
            const isNewMint = newMintIds.has(mint.id);
            
            return (
              <motion.div
                key={mint.id}
                initial={isNewMint ? { 
                  opacity: 0, 
                  y: -8, 
                  scale: 0.98,
                  filter: "blur(0.5px)"
                } : { 
                  opacity: 0, 
                  y: 8 
                }}
                animate={isNewMint ? {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  filter: "blur(0px)"
                } : {
                  opacity: 1,
                  y: 0
                }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ 
                  duration: isNewMint ? 0.8 : 0.5,
                  delay: isNewMint ? 0 : index * 0.02,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                className={`relative p-4 bg-white/5 border rounded-lg hover:bg-white/10 transition-all duration-200 ${
                  isNewMint 
                    ? 'border-green-400/50 shadow-lg shadow-green-400/20 bg-gradient-to-r from-green-500/10 to-transparent' 
                    : 'border-white/10'
                } ${index === mints.length - 1 ? 'mb-4' : ''}`}
                style={{
                  willChange: 'transform, opacity, filter',
                  backfaceVisibility: 'hidden'
                }}
              >
                {/* Very subtle glow effect for new mints */}
                {isNewMint && (
                  <motion.div
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 3, ease: "easeOut" }}
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-green-400/10 to-transparent pointer-events-none"
                  />
                )}
                
                {/* Header row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`text-xs px-2 py-1 rounded-full border ${
                        isNewMint 
                          ? 'bg-green-500/30 text-green-300 border-green-400/50' 
                          : 'bg-green-500/20 text-green-400 border-green-500/30'
                      }`}>
                        {isNewMint ? '🆕 ' : ''}{mint.status}
                      </span>
                      <span className="text-xs text-white/60">
                        {getTimeAgo(mint.blocktime)}
                      </span>
                    </div>
                    <div className="font-mono text-sm text-white truncate">
                      {mint.display_name || mint.name || mint.symbol || `${mint.contract_address.slice(0, 8)}...`}
                    </div>
                  </div>
                  
                  {/* Copy button */}
                  <button
                    onClick={() => copyMintAddress(mint.contract_address)}
                    className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white/60 hover:text-white text-xs rounded border border-white/20 transition-all duration-200 flex items-center space-x-1 shrink-0"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy</span>
                  </button>
                </div>
                
                {/* Details row */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-white/60">Decimals:</span>
                    <span className="text-white ml-2 font-mono">{mint.decimals}</span>
                  </div>
                  <div>
                    <span className="text-white/60">Blocktime:</span>
                    <span className="text-white ml-2 text-xs">
                      {formatBlocktime(mint.blocktime)}
                    </span>
                  </div>
                </div>
                
                {/* Links row */}
                <div className="flex items-center space-x-3 mt-3 pt-3 border-t border-white/10">
                  <a
                    href={`https://solscan.io/token/${mint.contract_address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-xs flex items-center space-x-1 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span>Solscan</span>
                  </a>
                  
                  <a
                    href={`https://dexscreener.com/solana/${mint.contract_address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-400 hover:text-green-300 text-xs flex items-center space-x-1 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span>DexScreener</span>
                  </a>
                  
                  <a
                    href={`https://jup.ag/swap/SOL-${mint.contract_address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 text-xs flex items-center space-x-1 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span>Jupiter</span>
                  </a>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      
      {/* Custom CSS for the glow animation */}
      <style jsx>{`
        @keyframes newMintGlow {
          0% {
            box-shadow: 0 0 20px rgba(74, 222, 128, 0.4);
          }
          50% {
            box-shadow: 0 0 30px rgba(74, 222, 128, 0.6);
          }
          100% {
            box-shadow: 0 0 20px rgba(74, 222, 128, 0.2);
          }
        }
      `}</style>
    </div>
  );
};

export default FreshMints;
