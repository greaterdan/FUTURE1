import { NextResponse } from "next/server";

const BIRDEYE_API = process.env.BIRDEYE_API_KEY;

export async function GET(req: Request, { params }: { params: { address: string } }) {
  const { address } = params;

  try {
    const r = await fetch(
      `https://public-api.birdeye.so/public/transaction?address=${address}&type=swap&limit=20`,
      {
        headers: { "X-API-KEY": BIRDEYE_API || "" },
        // Avoid caching to keep it live
        cache: "no-store",
      }
    );
    const data = await r.json();

    const txs = (data?.data?.items || []).map((tx: any) => ({
      sig: tx.txHash,
      buyer: tx.signer,
      volume: Number(tx.volumeUsd || 0),
      price: Number(tx.priceUsd || 0),
      side: tx.side, // buy or sell
      time: tx.blockUnixTime,
    }));

    return NextResponse.json(txs);
  } catch (err) {
    console.error("Birdeye error", err);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

