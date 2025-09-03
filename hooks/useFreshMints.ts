import { useCallback, useEffect, useState } from "react";

// Server API base URL
const SERVER_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://yourdomain.com' 
  : 'http://localhost:8080';

// Types matching the server API
export interface FreshMint {
  id: number;
  name?: string;
  symbol?: string;
  contract_address: string;
  creator?: string;
  source: string;
  launch_time?: string;
  decimals: number;
  supply: number;
  blocktime: Date | string;
  status: 'fresh' | 'active';
  created_at: string;
  updated_at: string;
  display_name?: string;
}

export const useFreshMints = (isOpen: boolean) => {
  const [mints, setMints] = useState<FreshMint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  // Fetch fresh mints from server
  const fetchFreshMints = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`${SERVER_BASE_URL}/api/tokens/fresh?limit=100`);
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle both old and new API response formats
      const items = data?.items ?? (Array.isArray(data) ? data : []);
      
      setMints(items);
      setLastUpdate(new Date());
      
    } catch (error) {
      console.error("Failed to fetch fresh mints:", error);
      setError(error instanceof Error ? error.message : 'Failed to fetch mints');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and periodic updates
  useEffect(() => {
    if (isOpen) {
      fetchFreshMints();
      
      // Set up periodic refresh every 15 seconds
      const interval = setInterval(() => {
        fetchFreshMints();
      }, 15000);
      
      return () => clearInterval(interval);
    }
  }, [isOpen, fetchFreshMints]);

  return {
    mints,
    isLoading,
    lastUpdate,
    error,
    refresh: fetchFreshMints
  };
};
