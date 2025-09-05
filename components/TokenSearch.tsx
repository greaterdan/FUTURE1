"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ImageWithFallback from './ImageWithFallback';

interface TokenSearchResult {
  mint: string;
  name?: string;
  symbol?: string;
  display_name?: string;
  image_url?: string;
  status: 'fresh' | 'active' | 'curve';
  price_usd?: number;
  marketcap?: number;
}

interface TokenSearchProps {
  onTokenSelect?: (token: TokenSearchResult) => void;
  placeholder?: string;
  className?: string;
}

const SERVER_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://yourdomain.com' 
  : 'http://localhost:8080';

export default function TokenSearch({ onTokenSelect, placeholder = "Search by token or CA", className = "" }: TokenSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TokenSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Search tokens when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const searchTokens = async () => {
      setIsLoading(true);
      setShowDropdown(true); // Show dropdown immediately when search starts
      try {
        const response = await fetch(`${SERVER_BASE_URL}/api/tokens/search?q=${encodeURIComponent(debouncedQuery)}&limit=20`);
        
        if (!response.ok) {
          throw new Error(`Search failed with ${response.status}`);
        }
        
        const data = await response.json();
        setResults(data.items || []);
        setShowDropdown(true); // Always show dropdown when we have a search query
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
        setShowDropdown(false);
      } finally {
        setIsLoading(false);
      }
    };

    searchTokens();
  }, [debouncedQuery]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showDropdown || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => prev < results.length - 1 ? prev + 1 : 0);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : results.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleTokenSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        inputRef.current?.blur();
        break;
    }
  }, [showDropdown, results, selectedIndex]);

  // Handle token selection
  const handleTokenSelect = useCallback((token: TokenSearchResult) => {
    setQuery(token.name || token.symbol || token.mint);
    setShowDropdown(false);
    setResults([]);
    setSelectedIndex(-1);
    
    if (onTokenSelect) {
      onTokenSelect(token);
    }
  }, [onTokenSelect]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const formatPrice = (price?: number) => {
    if (!price) return 'N/A';
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(2)}`;
  };

  const formatMarketCap = (marketcap?: number) => {
    if (!marketcap) return 'N/A';
    if (marketcap >= 1e9) return `$${(marketcap / 1e9).toFixed(2)}B`;
    if (marketcap >= 1e6) return `$${(marketcap / 1e6).toFixed(2)}M`;
    if (marketcap >= 1e3) return `$${(marketcap / 1e3).toFixed(2)}K`;
    return `$${marketcap.toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fresh': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'active': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'curve': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };


  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) {
              setShowDropdown(true);
            }
          }}
          placeholder={placeholder}
          className="w-full px-4 py-2 bg-transparent border border-white/30 rounded-full text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
        />
        
        {/* Search Icon */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white/50 rounded-full animate-spin"></div>
          ) : (
            <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
      </div>

      {/* Dropdown Results */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute top-full left-0 right-0 mt-2 bg-black/90 border border-white/20 rounded-lg shadow-2xl backdrop-blur-sm z-[100] max-h-96 overflow-y-auto"
          >
            {results.length === 0 && !isLoading && (
              <div className="p-4 text-center text-white/60">
                No tokens found
              </div>
            )}
            
            {results.map((token, index) => (
              <motion.div
                key={token.mint}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={`p-3 cursor-pointer transition-all duration-200 border-l-4 ${
                  index === selectedIndex 
                    ? 'bg-white/10 border-l-blue-500' 
                    : 'border-l-transparent hover:bg-white/5'
                }`}
                onClick={() => handleTokenSelect(token)}
              >
                <div className="flex items-center space-x-3">
                  {/* Token Image */}
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                    {token.image_url ? (
                      <ImageWithFallback
                        src={`http://localhost:8080/api/img?u=${encodeURIComponent(token.image_url)}`}
                        alt={token.symbol || token.mint || 'Token'}
                        className="w-full h-full object-cover"
                        fallbackClassName="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                        {token.symbol?.slice(0, 2) || token.mint.slice(0, 2)}
                      </div>
                    )}
                  </div>

                  {/* Token Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-white font-medium truncate">
                        {token.name || token.symbol || 'Unknown Token'}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(token.status)}`}>
                        {token.status}
                      </span>
                    </div>
                    
                    <div className="text-white/60 text-sm truncate">
                      {token.mint.slice(0, 4)}...{token.mint.slice(-4)}
                    </div>
                  </div>

                  {/* Price & Market Cap */}
                  <div className="text-right text-sm space-y-1">
                    <div className="text-white font-medium">
                      {formatPrice(token.price_usd)}
                    </div>
                    <div className="text-white/60">
                      {formatMarketCap(token.marketcap)}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
