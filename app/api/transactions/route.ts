import { NextResponse } from "next/server";

const HELIUS_API = process.env.HELIUS_API_KEY;
const HELIUS_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API}`;

export async function GET() {
  try {
    // Return mock data for now since we don't have a valid Helius API key
    const mockTransactions = [
      {
        signature: "mock_sig_1",
        timestamp: Math.floor(Date.now() / 1000) - 300, // 5 minutes ago
      },
      {
        signature: "mock_sig_2", 
        timestamp: Math.floor(Date.now() / 1000) - 600, // 10 minutes ago
      },
      {
        signature: "mock_sig_3",
        timestamp: Math.floor(Date.now() / 1000) - 900, // 15 minutes ago
      },
      {
        signature: "mock_sig_4",
        timestamp: Math.floor(Date.now() / 1000) - 1200, // 20 minutes ago
      },
      {
        signature: "mock_sig_5",
        timestamp: Math.floor(Date.now() / 1000) - 1500, // 25 minutes ago
      },
    ];

    return NextResponse.json(mockTransactions);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

