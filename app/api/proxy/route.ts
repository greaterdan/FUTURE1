import { NextRequest } from "next/server";

// Gateways/hosts you allow to be proxied
const ALLOW = [
  "ipfs.io",
  "cloudflare-ipfs.com",
  "nftstorage.link",
  "gateway.pinata.cloud",
  "dweb.link",
  "arweave.net",
  "ar-io.net",
  "cdn.kzna.io",
  "shdw-drive.genesysgo.net",
  "position-nft.orca.so",
  "static.raydium.io",
];

export async function GET(req: NextRequest) {
  const src = new URL(req.url).searchParams.get("url");
  if (!src) return new Response("missing url", { status: 400 });

  let target: URL;
  try { target = new URL(src); } catch { return new Response("bad url", { status: 400 }); }
  if (!ALLOW.some(h => target.hostname.endsWith(h))) {
    return new Response("host not allowed", { status: 403 });
  }

  // don't forward cookies; short timeout
  const r = await fetch(target.toString(), {
    headers: { "accept": "application/json, image/*" },
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(8000),
  }).catch(() => undefined);

  if (!r) return new Response("upstream timeout", { status: 504 });

  // stream back, preserve content-type
  return new Response(r.body, {
    status: r.status,
    headers: {
      "content-type": r.headers.get("content-type") ?? "application/octet-stream",
      "cache-control": "public, max-age=60, s-maxage=60",
      "access-control-allow-origin": "*",
    },
  });
}
