import { setTimeout as sleep } from "node:timers/promises";

const IPFS_GATEWAYS = [
  (cid: string) => `https://cloudflare-ipfs.com/ipfs/${cid}`,
  (cid: string) => `https://ipfs.io/ipfs/${cid}`,
  (cid: string) => `https://gateway.pinata.cloud/ipfs/${cid}`,
];

const arUrl = (id: string) => `https://arweave.net/${id}`;

function joinIfRelative(base: string, maybe: string): string {
  try {
    // returns absolute if already absolute, otherwise resolves against base
    return new URL(maybe, base).toString();
  } catch {
    return maybe;
  }
}

export function toHttp(uri?: string): string | undefined {
  if (!uri) return;
  const u = uri.replace(/\0/g, "").trim();

  // bare CID
  if (/^[1-9A-HJ-NP-Za-km-z]{46,}$/.test(u)) {
    return IPFS_GATEWAYS[0](u);
  }

  if (u.startsWith("ipfs://")) {
    const path = u.slice(7).replace(/^ipfs\//, "");
    return IPFS_GATEWAYS[0](path);
  }
  if (u.startsWith("ar://")) {
    const id = u.slice(5);
    return arUrl(id);
  }
  // already http(s)
  return u;
}

async function fetchWithTimeout(url: string, ms = 10_000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

export async function resolveImageUrl(uri?: string): Promise<string | undefined> {
  const url0 = toHttp(uri);
  if (!url0) return;

  const attemptParse = async (url: string) => {
    const res = await fetchWithTimeout(url);
    if (!res?.ok) return undefined;

    const ct = res.headers.get("content-type") || "";
    // direct image
    if (ct.startsWith("image/")) return url;

    // try JSON regardless of content-type
    try {
      const json = await res.json() as any;
      const img =
        json?.image ??
        json?.image_url ??
        json?.imageURI ??
        json?.properties?.image ??
        json?.properties?.files?.[0]?.uri;

      if (img) {
        const imgStr = String(img);
        const absolute = imgStr.startsWith("http") ? imgStr : joinIfRelative(url, imgStr);
        return toHttp(absolute) ?? absolute;
      }
    } catch {
      const txt = await res.text().catch(() => "");
      if (txt?.trim().startsWith("{")) {
        try {
          const json = JSON.parse(txt) as any;
          const img =
            json?.image ??
            json?.image_url ??
            json?.imageURI ??
            json?.properties?.image ??
            json?.properties?.files?.[0]?.uri;
          if (img) {
        const imgStr = String(img);
        const absolute = imgStr.startsWith("http") ? imgStr : joinIfRelative(url, imgStr);
        return toHttp(absolute) ?? absolute;
      }
        } catch {}
      }
    }
    return undefined;
  };

  // first try as-is
  try {
    const r = await attemptParse(url0);
    if (r) return r;
  } catch {}

  // IPFS gateway rotation
  if (uri && (uri.startsWith("ipfs://") || /^[1-9A-HJ-NP-Za-km-z]{46,}$/.test(uri))) {
    const cid = uri.startsWith("ipfs://")
      ? uri.slice(7).replace(/^ipfs\//, "")
      : uri;
    for (let i = 1; i < IPFS_GATEWAYS.length; i++) {
      const url = IPFS_GATEWAYS[i](cid);
      try {
        const r = await attemptParse(url);
        if (r) return r;
      } catch {}
      await sleep(200);
    }
  }

  return undefined;
}



