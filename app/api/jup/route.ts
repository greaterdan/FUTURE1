import { NextRequest } from "next/server";

const PRICE = "https://price.jup.ag/v6/price";
const QUOTE = "https://quote-api.jup.ag/v6/quote";

// single shared queue
let inflight = 0;
const MAX = 1;                 // stricter
const MIN_SPACING = 250;       // ~4 rps
let last = 0;
const q: Array<() => void> = [];

function runQueued<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const run = async () => {
      inflight++;
      const wait = Math.max(0, MIN_SPACING - (Date.now() - last));
      await new Promise(r => setTimeout(r, wait));
      last = Date.now();
      try { resolve(await fn()); }
      catch (e) { reject(e); }
      finally { inflight--; const n = q.shift(); if (n) n(); }
    };
    inflight < MAX ? run() : q.push(run);
  });
}

export async function GET(req: NextRequest) {
  const u = new URL(req.url);
  const type = u.searchParams.get("type") ?? "price";
  const params = new URLSearchParams();
  for (const k of ["ids","inputMint","outputMint","amount","slippageBps","onlyDirectRoutes"]) {
    const v = u.searchParams.get(k);
    if (v) params.set(k, v);
  }
  const upstream = type === "quote" ? `${QUOTE}?${params}` : `${PRICE}?${params}`;

  try {
    const r = await runQueued(() =>
      fetch(upstream, {
        headers: { accept: "application/json" },
        cache: "no-store",
        redirect: "follow",
        signal: AbortSignal.timeout(9000),
      })
    );

    // swallow 429 into an empty dataset so the client can continue smoothly
    if (r.status === 429) {
      return new Response(JSON.stringify({ data: {} }), {
        status: 200,
        headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
      });
    }

    const body = await r.text();
    return new Response(body, {
      status: r.status,
      headers: {
        "content-type": r.headers.get("content-type") ?? "application/json",
        "cache-control": "public, max-age=3, s-maxage=3, stale-while-revalidate=30",
        "access-control-allow-origin": "*",
      },
    });
  } catch {
    // turn timeouts into empty response (prevents 504 spam)
    return new Response(JSON.stringify({ data: {} }), {
      status: 200,
      headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
    });
  }
}
