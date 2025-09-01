"use client";
import { useEffect, useState } from "react";

interface Transaction {
  signature: string;
  timestamp: number;
}

export default function SolanaTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch("/api/transactions", { cache: "no-store" });
        const data = await res.json();
        if (Array.isArray(data)) {
          setTransactions(data);
        } else {
          setTransactions([]);
          console.error("Invalid data format from API:", data);
        }
      } catch (err) {
        console.error("Error fetching transactions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
    const interval = setInterval(fetchTransactions, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="text-white p-6" style={{ fontFamily: 'VT323, monospace' }}>Loading Transactions...</div>;

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return <div className="text-white p-6" style={{ fontFamily: 'VT323, monospace' }}>No transactions available</div>;
  }

  return (
    <div className="text-white" style={{ fontFamily: 'VT323, monospace' }}>
      <h2 className="text-2xl font-bold mb-4">Solana Transactions through Quantum Eraser</h2>
      <div className="space-y-4">
        {transactions.map((tx) => (
          <div key={tx.signature} className="p-4 bg-white/5 border border-white/10 rounded">
            <p>Signature: {tx.signature.slice(0, 10)}...</p>
            <p>Timestamp: {new Date(tx.timestamp * 1000).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
