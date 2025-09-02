import { PublicKey } from "@solana/web3.js";

// return a valid 32-byte pubkey, or null
export function sanitizeMint(raw: string): string | null {
  if (!raw) return null;
  try {
    // fast path — exact match
    return new PublicKey(raw).toBase58();
  } catch {}
  // try to extract the first base58 substring that is a valid pubkey
  const matches = raw.match(/[1-9A-HJ-NP-Za-km-z]{32,64}/g) || [];
  for (const m of matches) {
    try { return new PublicKey(m).toBase58(); } catch {}
  }
  return null;
}

