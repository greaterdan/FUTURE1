"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSolanaData } from "../hooks/useSolanaData";

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
type CardProps = { token: any; hot: boolean; visibleMintsRef: React.MutableRefObject<Set<string>> };
const TokenCardBase: React.FC<CardProps> = ({ token, hot, visibleMintsRef }) => {
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
      layout={!hot}
      transition={hot ? { duration: 0 } : { type: 'spring', stiffness: 140, damping: 18 }}
      className="relative isolate overflow-visible rounded-xl border border-white/10 bg-white/5 p-4 shadow-sm"
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
          <h3 className="text-white font-semibold truncate">{token.name}</h3>
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
};

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
  hot, 
  className = "",
  visibleMintsRef
}: { 
  title: string; 
  items: any[]; 
  hot: boolean;
  className?: string;
  visibleMintsRef: React.MutableRefObject<Set<string>>;
}) {

  return (
    <div className={`flex flex-col gap-3 min-w-0 ${className}`}>
      <h2 className="text-white text-lg font-bold text-center">{title}</h2>
      <div 
        className="flex-1 overflow-auto rounded-2xl bg-black/20 p-4 scrollbar-gutter-stable-both-edges"
      >
        <div className="flex flex-col gap-3">
          {items.map((token, index) => (
            <TokenCard key={token.mint} token={token} hot={hot} visibleMintsRef={visibleMintsRef} />
          ))}
        </div>
      </div>
    </div>
  );
}

export const Scope: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  // Track visible mints for performance optimization
  const visibleMintsRef = useRef<Set<string>>(new Set());
  
  const {
    tokens,
    isLoading,
    lastUpdate,
    stats,
    connectionStatus,
    currentRpc,
    hot,
    live,
    pendingCount,
    resumeLive,
    pauseLive,
  } = useSolanaData(isOpen);

  // Defer giant arrays so user input stays snappy
  const deferredTokens = React.useDeferredValue(tokens);

  // Filter tokens for each column
  const newPairs = deferredTokens.filter(t => t.poolType !== 'none').slice(0, 20);
  const finalStretch = deferredTokens.filter(t => t.poolType !== 'none').slice(0, 20);
  const migrated = deferredTokens.filter(t => t.poolType !== 'none').slice(0, 20);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/95 z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-black/80 border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-bold text-white">SCOPE</h1>
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-white/60">Status: {connectionStatus}</span>
              <span className="text-white/60">RPC: {currentRpc ? currentRpc.split('//')[1]?.split('/')[0] || 'Connecting...' : 'Connecting...'}</span>
              <span className="text-white/60">Last Update: {lastUpdate?.toLocaleTimeString()}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Live/Pause Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={live ? pauseLive : resumeLive}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  live 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {live ? 'Pause' : 'Resume'} Live
              </button>
              {!live && pendingCount > 0 && (
                <span className="bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold">
                  +{pendingCount} new
                </span>
              )}
            </div>
            
            {/* Stats */}
            <div className="text-white text-sm">
              <span className="text-white/60">Total: </span>
              <span className="font-bold">{stats.totalTokens}</span>
              <span className="text-white/60 ml-4">New: </span>
              <span className="font-bold text-green-400">{stats.newTokens}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-white text-xl">Connecting to Solana...</div>
          </div>
        ) : deferredTokens.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white/60">
              <div className="text-2xl mb-4">🔍</div>
              <div className="text-xl mb-2">Monitoring Pump.fun & Raydium for new launches</div>
              <div className="text-sm">
                Program IDs: Pump.fun (6EF8r...), Raydium (675kP...)
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <TokenColumn 
              title="New Pairs" 
              items={newPairs} 
              hot={hot}
              className="animate-in slide-in-from-left duration-500"
              visibleMintsRef={visibleMintsRef}
            />
            <TokenColumn 
              title="Final Stretch" 
              items={finalStretch} 
              hot={hot}
              className="animate-in slide-in-from-bottom duration-500 delay-100"
              visibleMintsRef={visibleMintsRef}
            />
            <TokenColumn 
              title="Migrated" 
              items={migrated} 
              hot={hot}
              className="animate-in slide-in-from-right duration-500 delay-200"
              visibleMintsRef={visibleMintsRef}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Scope;
