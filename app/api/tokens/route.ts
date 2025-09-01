import { NextResponse } from "next/server";

// Example using Helius API (replace with your key)
const HELIUS_API = process.env.HELIUS_API_KEY;
const HELIUS_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API}`;

export async function GET() {
  try {
    // Example: fetch token assets
    const response = await fetch(HELIUS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "scope",
        method: "getAssetsByOwner",
        params: {
          ownerAddress: "YOUR_TRACKED_CONTRACT_OR_PROGRAM", // Replace with actual address
          page: 1,
          limit: 50,
        },
      }),
    });
    const heliusData = await response.json();

    // Check if the response has the expected structure
    if (!heliusData.result || !heliusData.result.items) {
      console.error('Invalid response structure:', heliusData);
      return NextResponse.json({ error: "Invalid API response structure" }, { status: 500 });
    }

    // Map and classify
    const tokens = heliusData.result.items.map((item: any) => {
      const createdAt = new Date(item.token_info?.createdAt || Date.now());
      const age = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60); // hours
      let status: "new" | "final" | "migrated" = "new";
      if (age > 24) status = "migrated";
      else if (age > 12) status = "final";

      return {
        address: item.id,
        name: item.content?.metadata?.name || "Unknown",
        symbol: item.content?.metadata?.symbol || "???",
        marketCap: item.token_info?.marketCapUsd || 0,
        liquidity: item.token_info?.liquidityUsd || 0,
        volume24h: item.token_info?.volume24hUsd || 0,
        buyers: item.token_info?.buyers || 0,
        sellers: item.token_info?.sellers || 0,
        txCount: item.token_info?.txCount || 0,
        createdAt: createdAt.toISOString(),
        status,
      };
    });

    return NextResponse.json(tokens);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch tokens" }, { status: 500 });
  }
}

