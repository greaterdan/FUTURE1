import { setTimeout as sleep } from "node:timers/promises";

const GATEWAYS = {
  ipfs: [
    (cid: string) => `https://ipfs.io/ipfs/${cid}`,
    (cid: string) => `https://cloudflare-ipfs.com/ipfs/${cid}`,
  ],
  arweave: (id: string) => `https://arweave.net/${id}`,
};

export function toHttp(uri?: string): string | undefined {
  if (!uri) return;
  if (uri.startsWith("ipfs://")) {
    const path = uri.slice(7).replace(/^ipfs\//, "");
    return GATEWAYS.ipfs[0](path);
  }
  if (uri.startsWith("ar://")) {
    const id = uri.slice(5);
    return GATEWAYS.arweave(id);
  }
  return uri;
}

async function fetchWithTimeout(url: string, ms = 10_000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

export async function resolveImageUrl(uri?: string): Promise<string | undefined> {
  const url0 = toHttp(uri);
  if (!url0) return;

  // Some URIs are direct images
  try {
    let res = await fetchWithTimeout(url0);
    if (res.ok) {
      const ct = res.headers.get("content-type") || "";
      if (ct.startsWith("image/")) return url0;
      if (ct.includes("application/json") || ct.includes("text/plain")) {
        const json = await res.json().catch(() => null);
        const img =
          json?.image ||
          json?.image_url ||
          json?.imageURI ||
          json?.properties?.image ||
          json?.properties?.files?.[0]?.uri;
        if (img) {
          const imgHttp = toHttp(img) ?? img;
          return imgHttp;
        }
      }
    }
  } catch { /* fall through */ }

  // Simple IPFS gateway fallback if first try failed
  if (uri?.startsWith("ipfs://")) {
    const path = uri.slice(7).replace(/^ipfs\//, "");
    for (let i = 1; i < GATEWAYS.ipfs.length; i++) {
      const url = GATEWAYS.ipfs[i](path);
      try {
        const res = await fetchWithTimeout(url);
        if (!res.ok) continue;
        const json = await res.json().catch(() => null);
        const img =
          json?.image ||
          json?.image_url ||
          json?.properties?.image ||
          json?.properties?.files?.[0]?.uri;
        if (img) return toHttp(img) ?? img;
      } catch { await sleep(200); }
    }
  }

  return undefined;
}
