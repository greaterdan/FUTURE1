"use client";
import { useEffect, useState } from "react";

interface TokenTradeAggregation {
  id: number;
  name?: string;
  symbol?: string;
  contract_address: string;
  creator?: string;
  source: string;
  launch_time?: Date;
  decimals: number;
  supply: number;
  blocktime: Date | null;
  status: 'fresh' | 'active';
  created_at: Date;
  updated_at: Date;
  display_name?: string;
  // Market cap fields (if available)
  price_usd?: number;
  marketcap?: number;
  volume_24h?: number;
  liquidity?: number;
}

export default function SolanaTransactions() {
  const [trades, setTrades] = useState<TokenTradeAggregation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/tokens/fresh", { cache: "no-store" });
        const data = await res.json();
        
        // Handle both old and new API response formats
        const items = data?.items ?? (Array.isArray(data) ? data : []);
        
        if (Array.isArray(items)) {
          setTrades(items);
        } else {
          setTrades([]);
          console.error("Invalid data format from server API:", data);
        }
      } catch (err) {
        console.error("Error fetching trades from server:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
    const interval = setInterval(fetchTrades, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="text-white p-6" style={{ fontFamily: 'VT323, monospace' }}>Loading Trades...</div>;

  if (!Array.isArray(trades) || trades.length === 0) {
    return <div className="text-white p-6" style={{ fontFamily: 'VT323, monospace' }}>No trades available</div>;
  }

  return (
    <div className="text-white" style={{ fontFamily: 'VT323, monospace' }}>
      <h2 className="text-2xl font-bold mb-4">Solana Token Trades through Quantum Eraser</h2>
      <div className="space-y-4">
        {trades.map((trade) => (
          <div key={trade.id} className="p-4 bg-white/5 border border-white/10 rounded">
            <p>Token: {trade.contract_address?.slice(0, 10)}...</p>
            <p>Name: {trade.display_name || trade.name || trade.symbol || 'Unknown'}</p>
            <p>Supply: {trade.supply?.toLocaleString() || 'N/A'}</p>
            <p>Decimals: {trade.decimals || 'N/A'}</p>
            <p>Status: {trade.status || 'N/A'}</p>
            <p>Created: {trade.created_at ? new Date(trade.created_at).toLocaleString() : 'N/A'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
