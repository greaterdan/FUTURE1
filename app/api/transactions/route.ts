import { NextResponse } from "next/server";

const HELIUS_API = process.env.HELIUS_API_KEY;
const HELIUS_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API}`;

export async function GET() {
  try {
    const response = await fetch(HELIUS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "transactions",
        method: "getSignaturesForAddress",
        params: {
          address: "YOUR_TRACKED_ADDRESS", // Replace with a Solana address to track
          limit: 20,
        },
      }),
    });
    const data = await response.json();
    
    // Check if the response has the expected structure
    if (!data.result) {
      console.error('Invalid response structure:', data);
      return NextResponse.json({ error: "Invalid API response structure" }, { status: 500 });
    }
    
    const transactions = data.result.map((sig: any) => ({
      signature: sig.signature,
      timestamp: sig.blockTime,
    }));

    return NextResponse.json(transactions);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

