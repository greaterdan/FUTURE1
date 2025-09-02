export const toHttps = (u?: string) => {
  if (!u) return;
  u = u.trim();
  if (!u) return;
  if (/^ipfs:\/\//i.test(u)) {
    // leave IPFS to your existing image pipeline; we don't treat as a "website"
    return;
  }
  if (/^https?:\/\//i.test(u)) return u;
  // common socials in metadata
  if (u.startsWith("@")) return `https://twitter.com/${u.slice(1)}`;
  if (u.startsWith("twitter.com/")) return `https://` + u;
  if (u.startsWith("t.me/")) return `https://` + u;
  if (u.startsWith("discord.gg/")) return `https://` + u;
  // bare domain
  return `https://${u}`;
};

export const buildStaticLinks = (mint: string) => ({
  pumpfun: `https://pump.fun/coin/${mint}`,
  dexscreener: `https://dexscreener.com/solana?q=${mint}`,
  jupiter: `https://jup.ag/swap/${mint}-SOL`,
  explorer: `https://solscan.io/token/${mint}`,
});

