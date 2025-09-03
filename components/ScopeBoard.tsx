"use client";
import { useEffect, useState } from "react";

type TokenData = {
  address: string;
  name: string;
  symbol: string;
  marketCap: number;
  liquidity: number;
  volume24h: number;
  buyers: number;
  sellers: number;
  txCount: number;
  createdAt: string;
  status: "new" | "final" | "migrated";
};

export default function ScopeBoard() {
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const res = await fetch("/api/tokens");
        const data = await res.json();
        if (Array.isArray(data)) {
          setTokens(data);
        } else {
          setTokens([]);
          console.error("Invalid data format from API:", data);
        }
      } catch (err) {
        console.error("Error fetching tokens:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
    const interval = setInterval(fetchTokens, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="text-white p-6">Loading Scope...</div>;

  if (!Array.isArray(tokens)) {
    return <div className="text-white p-6">Error loading tokens</div>;
  }

  const newPairs = tokens.filter((t) => t.status === "new");
  const finalStretch = tokens.filter((t) => t.status === "final");
  const migrated = tokens.filter((t) => t.status === "migrated");

  return (
    <div className="grid grid-cols-3 gap-6 p-6 text-white" style={{ background: 'radial-gradient(circle at bottom center, rgba(0,0,0,0.9), rgba(0,0,0,0.7))' }}>
      <TokenColumn title="New Pairs" tokens={newPairs} />
      <TokenColumn title="Final Stretch" tokens={finalStretch} />
      <TokenColumn title="Migrated" tokens={migrated} />
    </div>
  );
}

function TokenColumn({ title, tokens }: { title: string; tokens: TokenData[] }) {
  return (
    <div className="bg-black/40 rounded-lg p-4 border border-white/10">
      <h2 className="text-lg font-bold mb-4 text-white">{title}</h2>
      <div className="space-y-3">
        {tokens.map((t) => (
          <div
            key={t.address}
            className="p-3 rounded bg-white/5 border border-white/10 hover:border-white/30 transition-all duration-300 hover:shadow-glow"
          >
            <div className="flex justify-between">
              <span className="font-medium">{t.name} ({t.symbol})</span>
              <span className="text-xs opacity-70">{t.address.slice(0,6)}…</span>
            </div>
            <div className="mt-1 text-sm opacity-80">
              MC: ${t.marketCap.toLocaleString()} | Liquidity: ${t.liquidity.toLocaleString()}
            </div>
            <div className="mt-1 text-xs">
              Vol 24h: ${t.volume24h.toLocaleString()} | Buyers: {t.buyers} | Sellers: {t.sellers}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
