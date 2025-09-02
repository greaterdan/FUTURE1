import { PublicKey, Connection } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  unpackAccount as splUnpackAccount,
  unpackMint as splUnpackMint,
} from "@solana/spl-token";

const WSOL = new PublicKey("So11111111111111111111111111111111111111112");
// Pyth SOL/USD price feed (mainnet v2; replace if you use another slot)
const PYTH_SOL_USD = new PublicKey("J83wWf5N2uE52Z9fF5S8eDqg4H2NKoVMM6r7aYwGdKwG"); // <- update to your feed

type MintMeta = { decimals: number; supply: number };
const mintCache = new Map<string, MintMeta>();
let cachedSolUsd: number | undefined;
let solUsdTs = 0;

export async function getPythUsd(conn: Connection, product: "SOL" | "USDC"): Promise<number> {
  if (product === "USDC") return 1.0;
  // minimal decode for Pyth price (ok for our use; feel free to swap to @pythnetwork/client)
  const now = Date.now();
  if (cachedSolUsd && now - solUsdTs < 5_000) return cachedSolUsd;
  const ai = await conn.getAccountInfo(PYTH_SOL_USD, "processed");
  if (!ai) throw new Error("pyth SOL/USD not found");
  const dv = new DataView(ai.data.buffer, ai.data.byteOffset, ai.data.byteLength);
  const expo = dv.getInt32(208, true);
  const price = Number(dv.getBigInt64(216, true)) * 10 ** expo; // per pyth header layout
  cachedSolUsd = price;
  solUsdTs = now;
  return price;
}

function unpackAccount(pk: PublicKey, ai: any) {
  return splUnpackAccount(pk, ai, TOKEN_PROGRAM_ID);
}
function unpackMint(pk: PublicKey, ai: any) {
  return splUnpackMint(pk, ai, TOKEN_PROGRAM_ID);
}

export async function fastPoolSnapshot(
  conn: Connection,
  baseMint: PublicKey,
  quoteMint: PublicKey,
  baseVault: PublicKey,
  quoteVault: PublicKey
): Promise<{ price?: number; marketCap?: number; liquidity?: number }> {
  const infos = await conn.getMultipleAccountsInfo(
    [baseVault, quoteVault, baseMint, quoteMint],
    { commitment: "processed" }
  );
  const [baseVaultInfo, quoteVaultInfo, baseMintInfo, quoteMintInfo] = infos;
  if (!baseVaultInfo || !quoteVaultInfo || !baseMintInfo || !quoteMintInfo) return {};

  const baseAcc = unpackAccount(baseVault, baseVaultInfo);
  const quoteAcc = unpackAccount(quoteVault, quoteVaultInfo);
  const baseMintDec = unpackMint(baseMint, baseMintInfo);
  const quoteMintDec = unpackMint(quoteMint, quoteMintInfo);

  const baseAmt = Number(baseAcc.amount) / 10 ** baseMintDec.decimals;
  const quoteAmt = Number(quoteAcc.amount) / 10 ** quoteMintDec.decimals;
  if (baseAmt <= 0 || quoteAmt <= 0) return {};

  // price in quote
  let priceInQuote = quoteAmt / baseAmt;
  // quote -> USD
  let quoteUsd = 1;
  if (quoteMint.equals(WSOL)) {
    quoteUsd = await getPythUsd(conn, "SOL");
  }
  const priceUsd = priceInQuote * quoteUsd;

  // mint supply (cache)
  const k = baseMint.toBase58();
  let meta = mintCache.get(k);
  if (!meta) {
    const supply = Number(baseMintDec.supply) / 10 ** baseMintDec.decimals;
    meta = { decimals: baseMintDec.decimals, supply };
    mintCache.set(k, meta);
  }

  const marketCap = priceUsd * meta.supply;
  const liquidity = baseAmt * priceUsd + quoteAmt * quoteUsd;

  return { price: priceUsd, marketCap, liquidity };
}

/**
 * Rolling 24h volume tracker:
 * - Subscribe to pool program logs.
 * - For each swap tx, refetch quoteVault balance (cheap: getTokenAccountBalance).
 * - Accumulate |deltaQuoteUsd| in a ring buffer with timestamps.
 * - Evict entries older than 24h on each tick.
 * Returns a disposer to stop tracking.
 */
export function startVolumeTracker(
  conn: Connection,
  poolProgramId: PublicKey,
  pool: {
    quoteVault: PublicKey;     // the quote-side SPL account
    quoteMint: PublicKey;      // USDC or WSOL (for USD conversion)
  },
  onTick: (volume24hUsd: number, nowMs: number) => void
): () => void {
  const windowMs = 24 * 60 * 60 * 1000;
  const entries: Array<{ t: number; usd: number }> = [];
  let lastUiAmt: number | undefined;
  let disposed = false;

  async function currentQuoteUsdPerToken(): Promise<number> {
    if (pool.quoteMint.equals(WSOL)) return getPythUsd(conn, "SOL");
    return 1.0; // USDC/USDT
  }

  function prune(now: number) {
    while (entries.length && now - entries[0].t > windowMs) entries.shift();
  }
  function total() {
    return entries.reduce((s, x) => s + x.usd, 0);
  }

  const subPromise = conn.onLogs(poolProgramId, async (l) => {
    if (disposed) return;
    // Fast path: only react to swaps
    const isSwap =
      l.logs.some((x) => x.includes("swap")) ||
      l.logs.some((x) => x.toLowerCase().includes("swap"));
    if (!isSwap) return;

    try {
      // read vault balance (uiAmountString avoids bigint issues)
      const bal = await conn.getTokenAccountBalance(pool.quoteVault, "processed");
      const ui = Number(bal.value.uiAmountString ?? "0");
      if (lastUiAmt !== undefined && ui !== lastUiAmt) {
        const delta = Math.abs(ui - lastUiAmt);
        const usdPer = await currentQuoteUsdPerToken();
        const now = Date.now();
        entries.push({ t: now, usd: delta * usdPer });
        prune(now);
        onTick(total(), now);
      }
      lastUiAmt = ui;
    } catch {
      /* ignore single-sample errors */
    }
  });

  return () => {
    disposed = true;
    Promise.resolve(subPromise).then((id) => {
      try { conn.removeOnLogsListener(id as any); } catch {}
    });
  };
}

