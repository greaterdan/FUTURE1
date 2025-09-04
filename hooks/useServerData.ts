import { useCallback, useEffect, useState } from "react";
import { useWebSocket } from "./useWebSocket";

// Server API base URL
const SERVER_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://yourdomain.com' 
  : 'http://localhost:8080';

// Types matching the server API
export interface ServerTokenData {
  id: number;
  name?: string;
  symbol?: string;
  mint: string; // Fixed: backend returns 'mint' not 'contract_address'
  creator?: string;
  source: string;
  launch_time?: string;
  decimals: number;
  supply: number;
  blocktime: string; // Fixed: backend returns string, not number
  status: 'fresh' | 'active' | 'curve';
  metadata_uri?: string;
  image_url?: string;
  bonding_curve_address?: string;
  is_on_curve: boolean;
  created_at: string;
  updated_at: string;
  display_name?: string;
  // Fixed: backend returns these properties directly on the token, not nested
  price_usd?: number;
  marketcap?: number;
  volume_24h?: number;
  liquidity?: number;
}

// Transformed token data for the frontend components
export interface TransformedTokenData {
  mint: string;
  name?: string;
  symbol?: string;
  decimals: number;
  supply: number;
  blocktime: number;
  status: 'fresh' | 'active' | 'curve';
  imageUrl?: string;
  metadataUri?: string;
  isOnCurve: boolean;
  bondingCurveAddress?: string;
  marketCap?: number;
  price?: number;
  volume24h?: number;
  liquidity?: number;
  links: {
    dexscreener: string;
    jupiter: string;
    explorer: string;
  };
  createdAt: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface Stats {
  totalTokens: number;
  freshTokens: number;
  activeTokens: number;
}

// Transform server data to frontend format
const transformTokenData = (serverToken: ServerTokenData): TransformedTokenData => {
  return {
    mint: serverToken.mint, // Fixed: use 'mint' property
    name: serverToken.name,
    symbol: serverToken.symbol,
    decimals: serverToken.decimals,
    supply: serverToken.supply,
    blocktime: new Date(serverToken.blocktime).getTime(), // Convert string to timestamp
    status: serverToken.status,
    imageUrl: serverToken.image_url,
    metadataUri: serverToken.metadata_uri,
    isOnCurve: serverToken.is_on_curve,
    bondingCurveAddress: serverToken.bonding_curve_address,
    marketCap: serverToken.marketcap, // Fixed: use direct property
    price: serverToken.price_usd, // Fixed: use direct property
    volume24h: serverToken.volume_24h, // Fixed: use direct property
    liquidity: serverToken.liquidity, // Fixed: use direct property
    links: {
      dexscreener: `https://dexscreener.com/solana/${serverToken.mint}`,
      jupiter: `https://jup.ag/swap/SOL-${serverToken.mint}`,
      explorer: `https://solscan.io/token/${serverToken.mint}`,
    },
    createdAt: new Date(serverToken.created_at)
  };
};

export const useServerData = (isOpen: boolean) => {
  const [tokens, setTokens] = useState<TransformedTokenData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [connectionStatus, setConnectionStatus] = useState<string>("Connecting to server...");
  const [stats, setStats] = useState<Stats>({
    totalTokens: 0,
    freshTokens: 0,
    activeTokens: 0
  });
  const [live, setLive] = useState<boolean>(true);

  // WebSocket connection for real-time updates
  const wsUrl = process.env.NODE_ENV === 'production' 
    ? 'wss://yourdomain.com/ws' 
    : 'ws://localhost:8080/ws';
  const { isConnected: wsConnected, lastMessage } = useWebSocket(wsUrl);

  // Fetch tokens from server
  const fetchTokens = useCallback(async () => {
    try {
      setConnectionStatus("Fetching tokens...");
      const response = await fetch(`${SERVER_BASE_URL}/api/tokens?limit=100`);
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle both old and new API response formats
      const total = data?.total ?? data?.items?.length ?? (Array.isArray(data) ? data.length : 0);
      const items = data?.items ?? (Array.isArray(data) ? data : []);
      
      const transformedTokens = items.map(transformTokenData);
      setTokens(transformedTokens);
      setLastUpdate(new Date());
      setConnectionStatus(wsConnected ? "Connected to server (Live)" : "Connected to server");
      
      // Calculate stats from the data
      const newStats = {
        totalTokens: total,
        freshTokens: items.filter((t: any) => t.status === 'fresh').length,
        activeTokens: items.filter((t: any) => t.status === 'active').length
      };
      setStats(newStats);
      
    } catch (error) {
      console.error("Failed to fetch tokens from server:", error);
      setConnectionStatus("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Search tokens
  const searchTokens = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) return;
    
    try {
      const response = await fetch(`${SERVER_BASE_URL}/api/tokens/search?q=${encodeURIComponent(query)}&limit=50`);
      
      if (!response.ok) {
        throw new Error(`Search failed with ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle both old and new API response formats
      const items = data?.items ?? (Array.isArray(data) ? data : []);
      const transformedTokens = items.map(transformTokenData);
      setTokens(transformedTokens);
      setLastUpdate(new Date());
      
    } catch (error) {
      console.error("Search failed:", error);
    }
  }, []);

  // Filter tokens by status
  const filterByStatus = useCallback(async (status: 'fresh' | 'active') => {
    try {
      const endpoint = status;
      const response = await fetch(`${SERVER_BASE_URL}/api/tokens/${endpoint}?limit=100`);
      
      if (!response.ok) {
        throw new Error(`Status filter failed with ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle both old and new API response formats
      const items = data?.items ?? (Array.isArray(data) ? data : []);
      const transformedTokens = items.map(transformTokenData);
      setTokens(transformedTokens);
      setLastUpdate(new Date());
      
    } catch (error) {
      console.error("Status filter failed:", error);
    }
  }, []);



  // Resume live updates
  const resumeLive = useCallback(() => {
    setLive(true);
    console.log("▶️ Live updates resumed");
  }, []);

  // Pause live updates
  const pauseLive = useCallback(() => {
    setLive(false);
    console.log("⏸️ Live updates paused");
  }, []);

  // Handle WebSocket messages for real-time updates
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'new_token') {
        // Add new token to the list
        const newToken = transformTokenData(lastMessage.data);
        setTokens(prev => [newToken, ...prev]);
        setLastUpdate(new Date());
        console.log('🔥 NEW TOKEN ADDED:', newToken.name || newToken.symbol || newToken.mint);
      } else if (lastMessage.type === 'token_update') {
        // Update existing token
        const updatedToken = transformTokenData(lastMessage.data);
        setTokens(prev => prev.map(token => 
          token.mint === updatedToken.mint ? updatedToken : token
        ));
        setLastUpdate(new Date());
        console.log('🔄 TOKEN UPDATED:', updatedToken.name || updatedToken.symbol || updatedToken.mint);
      }
    }
  }, [lastMessage]);

  // Initial fetch and periodic updates (reduced frequency since we have WebSocket)
  useEffect(() => {
    if (isOpen) {
      fetchTokens();
      
      // Set up periodic refresh when live mode is on (less frequent since WebSocket handles real-time)
      if (live) {
        const interval = setInterval(() => {
          fetchTokens();
        }, 30000); // Refresh every 30 seconds for fallback
        
        return () => clearInterval(interval);
      }
    }
  }, [isOpen, live, fetchTokens]);

  return {
    tokens,
    isLoading,
    lastUpdate,
    stats,
    connectionStatus,
    live,
    resumeLive,
    pauseLive,
    searchTokens,
    filterByStatus,
    refresh: fetchTokens
  };
};
