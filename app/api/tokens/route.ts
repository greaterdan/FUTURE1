import { NextResponse } from "next/server";

// Example using Helius API (replace with your key)
const HELIUS_API = process.env.HELIUS_API_KEY;
const HELIUS_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API}`;

export async function GET() {
  try {
    // Return mock data for now since we don't have a valid Helius API key
    const mockTokens = [
      {
        address: "mock_token_1",
        name: "Quantum Token",
        symbol: "QTK",
        marketCap: 1500000,
        liquidity: 250000,
        volume24h: 75000,
        buyers: 45,
        sellers: 23,
        txCount: 156,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        status: "new" as const,
      },
      {
        address: "mock_token_2",
        name: "Geometry Coin",
        symbol: "GEO",
        marketCap: 3200000,
        liquidity: 500000,
        volume24h: 120000,
        buyers: 89,
        sellers: 34,
        txCount: 234,
        createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), // 18 hours ago
        status: "final" as const,
      },
      {
        address: "mock_token_3",
        name: "Space Token",
        symbol: "SPC",
        marketCap: 850000,
        liquidity: 150000,
        volume24h: 45000,
        buyers: 23,
        sellers: 12,
        txCount: 78,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 48 hours ago
        status: "migrated" as const,
      },
    ];

    return NextResponse.json(mockTokens);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch tokens" }, { status: 500 });
  }
}

