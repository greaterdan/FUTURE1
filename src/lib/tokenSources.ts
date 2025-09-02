// src/lib/tokenSources.ts
// Deps: none besides fetch. Uses your existing heliusCall queue.

import { fetchMetaplexUriDirect } from "../../utils/metaplexUri";
import { sanitizeMint } from "./helpers/mints";
import { toHttps, buildStaticLinks } from "./url";

type LinkBag = Partial<NonNullable<{
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  pumpfun?: string;
  dexscreener?: string;
  jupiter?: string;
  explorer?: string;
}>>;

const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// --------- Helpers ---------
export function isPumpMint(mint: string) {
  // You already know the tx/program when you detect it; this keeps it simple on the UI side.
  return mint.endsWith("pump");
}

// Gate Jupiter queries until token is actually tradable
export function shouldQueryJupiter(token: any) {
  // Only try once it has a DEX pool or we've detected migration
  return token.poolType === "raydium" || token.poolType === "orca" || token.lastTrade;
}

// Link extraction functions
function mergeLinks(base: LinkBag, extra?: LinkBag): LinkBag {
  return { ...base, ...Object.fromEntries(
    Object.entries(extra || {}).filter(([,v]) => !!v)
  )};
}

// From Metaplex JSON (via json_uri)
function extractLinksFromJson(json: any): LinkBag {
  const ex = json?.extensions || json?.external_url || {};
  const lb: LinkBag = {};
  const w = json?.website ?? ex.website ?? json?.external_url;
  const tw = json?.twitter ?? ex.twitter;
  const tg = json?.telegram ?? ex.telegram;
  const dc = json?.discord ?? ex.discord;

  if (w)  lb.website  = toHttps(w);
  if (tw) lb.twitter  = toHttps(tw);
  if (tg) lb.telegram = toHttps(tg);
  if (dc) lb.discord  = toHttps(dc);
  return lb;
}

// From Helius getAsset result.content.links
function extractLinksFromHeliusLinks(links: any): LinkBag {
  const lb: LinkBag = {};
  if (!links) return lb;
  if (links.website)   lb.website  = toHttps(links.website);
  if (links.twitter)   lb.twitter  = toHttps(links.twitter);
  if (links.telegram)  lb.telegram = toHttps(links.telegram);
  if (links.discord)   lb.discord  = toHttps(links.discord);
  if (links.external_url) lb.website = lb.website || toHttps(links.external_url);
  return lb;
}

// From SPL tokenlists (Jupiter/Raydium)
function extractLinksFromTokenlist(entry: any): LinkBag {
  const ex = entry?.extensions || {};
  const lb: LinkBag = {};
  if (ex.website)  lb.website  = toHttps(ex.website);
  if (ex.twitter)  lb.twitter  = toHttps(ex.twitter);
  if (ex.telegram) lb.telegram = toHttps(ex.telegram);
  if (ex.discord)  lb.discord  = toHttps(ex.discord);
  return lb;
}

// From DexScreener pair info (when available)
function extractLinksFromDex(info: any): LinkBag {
  const lb: LinkBag = {};
  const websites: string[] = info?.websites || [];
  const socials: Array<{ type: string; url: string }> = info?.socials || [];
  if (websites.length) lb.website = toHttps(websites[0]);
  for (const s of socials) {
    if (s.type === "twitter") lb.twitter = toHttps(s.url);
    if (s.type === "telegram") lb.telegram = toHttps(s.url);
    if (s.type === "discord") lb.discord = toHttps(s.url);
  }
  return lb;
}

export function toIpfsGateway(u?: string | null): string | undefined {
  if (!u) return;
  if (u.startsWith("ipfs://")) {
    const cid = u.replace("ipfs://", "");
    return `https://nftstorage.link/ipfs/${cid}`;
  }
  if (u.includes("/ipfs/")) {
    const after = u.split("/ipfs/")[1];
    return `https://nftstorage.link/ipfs/${after}`;
  }
  return u;
}

// some hosts block CORS for JSON; use your tiny proxy for JSON only (see section 3).
function corsProxy(url: string) {
  const allow = ["ipfs.io","nftstorage.link","cloudflare-ipfs.com","arweave.net"];
  try {
    const { host } = new URL(url);
    if (allow.some(a => host.endsWith(a))) return url; // safe → fetch directly
  } catch {}
  return `/api/proxy?url=${encodeURIComponent(url)}`;
}

// --------- Metadata (image, name, symbol) ---------
export async function resolveTokenProfile(
  mint: string,
  heliusCall: (method: string, params: any) => Promise<any>,
  connection?: any
): Promise<{ name?: string; symbol?: string; image?: string; links?: LinkBag }> {
  try {
    const { result } = await heliusCall("getAsset", { id: mint });
    if (!result) return {};

    const name =
      result.content?.metadata?.name ??
      result.content?.title ??
      `Token ${mint.slice(0, 8)}`;

    const symbol =
      result.content?.metadata?.symbol ??
      result.token_info?.symbol ??
      mint.slice(0, 4).toUpperCase();

    // Prefer direct image link; if only json_uri exists, fetch it (CORS-safe).
    let image =
      result.content?.links?.image ??
      result.content?.files?.[0]?.uri ??
      undefined;

    if (!image && result.content?.json_uri) {
      try {
        const metaUrl = corsProxy(result.content.json_uri);
        const r = await fetch(metaUrl);
        if (r.ok) {
          const j = await r.json();
          image = j?.image || j?.image_url || j?.icon || j?.logo;
        }
      } catch {
        /* ignore */
      }
    }

    // Metaplex on-chain fallback for BONK/LaunchLab tokens
    if (!image && connection) {
      try {
        const uri = await fetchMetaplexUriDirect(mint, connection);
        if (uri) {
          const r = await fetch(corsProxy(uri));
          if (r.ok) {
            const j = await r.json();
            image = j?.image || j?.image_url || j?.icon || j?.logo;
          }
        }
      } catch {
        /* ignore */
      }
    }

    image = toIpfsGateway(image);

    // Extract links from all available sources
    const staticLinks = buildStaticLinks(mint);
    let links: LinkBag = {};
    
    // From Helius content.links
    links = mergeLinks(links, extractLinksFromHeliusLinks(result?.content?.links));
    
    // From Metaplex JSON if we fetched it
    if (result.content?.json_uri) {
      try {
        const metaUrl = corsProxy(result.content.json_uri);
        const r = await fetch(metaUrl);
        if (r.ok) {
          const jsonMeta = await r.json();
          links = mergeLinks(links, extractLinksFromJson(jsonMeta));
        }
      } catch {
        /* ignore */
      }
    }
    
    // Always include static links
    links = { ...staticLinks, ...links };
    
    return { name, symbol, image, links };
  } catch {
    return {};
  }
}

// --------- Market (price, mc, liq, vol24h) without DexScreener ---------

async function fetchPumpFun(mint: string) {
  try {
    // public frontend endpoint; very fast for curve coins
    const r = await fetch(`https://frontend-api.pump.fun/coins/${mint}`, { cache: "no-store" });
    if (!r.ok) return;
    const j = await r.json();
    return {
      // typical keys you'll see; normalize to numbers
      priceUsd: Number(j?.price_usd ?? j?.priceUsd ?? j?.price ?? NaN),
      marketCapUsd: Number(j?.usd_market_cap ?? j?.market_cap_usd ?? j?.marketCap ?? NaN),
      liqUsd: Number(j?.liquidity_usd ?? j?.liquidityUsd ?? NaN),
      vol24hUsd: Number(j?.volume_24h_usd ?? j?.volume24hUsd ?? NaN),
    };
  } catch { return; }
}

async function fetchJupSpotPrice(mint: string): Promise<number | undefined> {
  try {
    // 1) /price endpoint (fastest) - now proxied
    const r = await fetch(`/api/jup?type=price&ids=${encodeURIComponent(mint)}`, { cache: "no-store" });
    if (r.ok) {
      const j = await r.json();
      const p = j?.data?.[mint]?.price ?? j?.[mint]?.price;
      const n = typeof p === "number" ? p : Number(p);
      if (Number.isFinite(n)) return n;
    }
  } catch {}
  try {
    // 2) tiny-amount quote to derive spot (works as soon as pool is routable) - now proxied
    // amount = 1 unit of token
    const r = await fetch(
      `/api/jup?type=quote&inputMint=${mint}&outputMint=${USDC}&amount=1&slippageBps=50&onlyDirectRoutes=true`,
      { cache: "no-store" }
    );
    if (!r.ok) return;
    const j = await r.json();
    const out = Number(j?.data?.[0]?.outAmount);
    const decimals = Number(j?.contextSlot) ? 6 : 6; // USDC=6
    if (Number.isFinite(out)) {
      return out / 10 ** decimals; // 1 token → x USDC
    }
  } catch {}
  return;
}

export async function resolveMarketData(
  mint: string,
  heliusCall: (method: string, params: any) => Promise<any>,
  supplyHint?: { decimals?: number; supply?: number },
  tokenData?: any
): Promise<{ price?: number; marketCap?: number; liquidity?: number; volume24h?: number }> {
  // Sanitize mint before any network calls
  const sanitizedMint = sanitizeMint(mint);
  if (!sanitizedMint) return {}; // bail early — don't hit APIs with junk

  let price: number | undefined;
  let marketCap: number | undefined;
  let liquidity: number | undefined;
  let volume24h: number | undefined;

  // A) Pump.fun → instant while on curve
  if (isPumpMint(sanitizedMint)) {
    const pf = await fetchPumpFun(sanitizedMint);
    if (pf) {
      if (Number.isFinite(pf.priceUsd)) price = pf.priceUsd;
      if (Number.isFinite(pf.marketCapUsd)) marketCap = pf.marketCapUsd;
      if (Number.isFinite(pf.liqUsd)) liquidity = pf.liqUsd;
      if (Number.isFinite(pf.vol24hUsd)) volume24h = pf.vol24hUsd;
    }
  }

  // B) Jupiter → only when token is actually tradable
  if (price == null && tokenData && shouldQueryJupiter(tokenData)) {
    price = await fetchJupSpotPrice(sanitizedMint);
  }

  // MC = price × circulatingSupply
  if (price != null && marketCap == null) {
    try {
      let decimals = supplyHint?.decimals;
      let rawSupply = supplyHint?.supply;
      if (decimals == null || rawSupply == null) {
        const { result } = await heliusCall("getAsset", { id: mint });
        decimals ??= result?.token_info?.decimals ?? 9;
        rawSupply ??= result?.token_info?.supply ?? 0;
      }
      if (decimals != null && rawSupply != null) {
        const supply = rawSupply / Math.pow(10, decimals);
        marketCap = price * supply;
      }
    } catch { /* ignore */ }
  }

  return { price, marketCap, liquidity, volume24h };
}
