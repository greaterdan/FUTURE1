import { useCallback, useEffect, useRef, useState } from "react";
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { deserializeMetadata } from "@metaplex-foundation/mpl-token-metadata";

// Metaplex Metadata Program ID
const METADATA_PROGRAM_ID = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";

// RPC and WebSocket endpoints
const RPC_ENDPOINT = "https://mainnet.helius-rpc.com/?api-key=099d5df1-149d-445e-b861-7269571c1804";
const WS_ENDPOINT = "wss://mainnet.helius-rpc.com/?api-key=099d5df1-149d-445e-b861-7269571c1804";

// Program IDs (Corrected)
const PUMP_FUN_PROGRAM_ID = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
const RAYDIUM_AMM_PROGRAM_ID = "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8";
const PYTH_SOL_USD_FEED = "J83w4HKcRrVWmEnJHfHtQk5VxRRa8Yy1wKfLbP9tK";

// Interfaces
export interface TokenData {
  mint: string;
  name: string;
  symbol: string;
  decimals: number;
  supply: number;
  poolType: 'raydium' | 'orca' | 'pumpfun' | 'none';
  marketCap?: number;
  liquidity?: number;
  volume24h?: number;
  price?: number;
  priceChange24h?: number;
  createdAt: Date;
  lastTrade?: Date;
  buyers?: number;
  sellers?: number;
  image?: string;
  links?: {
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
    pumpfun?: string;
    dexscreener?: string;
    jupiter?: string;
    explorer?: string;
  };
}

interface Stats {
  totalTokens: number;
  newTokens: number;
  activeTokens: number;
  totalVolume: number;
  totalLiquidity: number;
}

// Global state to persist across component re-renders - NEVER CLEANED UP
let globalConnection: Connection | null = null;
let globalSubscriptions = new Set<number>();
let globalTokens: TokenData[] = [];
let globalStats = {
  totalTokens: 0,
  newTokens: 0,
  activeTokens: 0,
  totalVolume: 0,
  totalLiquidity: 0,
};

// Global flag to ensure connection is started only once
let globalConnectionStarted = false;

// Helper function to ensure tokens have complete social links
const enhanceTokenLinks = (token: TokenData): TokenData => ({
  ...token,
  links: {
    ...token.links,
    // Ensure all social platforms have at least placeholder values
    website: token.links?.website,
    twitter: token.links?.twitter,
    telegram: token.links?.telegram,
    discord: token.links?.discord,
    pumpfun: token.links?.pumpfun,
    dexscreener: token.links?.dexscreener || `https://dexscreener.com/solana/${token.mint}`,
    jupiter: token.links?.jupiter || `https://jup.ag/swap/SOL-${token.mint}`,
    explorer: token.links?.explorer || `https://solscan.io/token/${token.mint}`,
  }
});

export const useSolanaData = (isOpen: boolean) => {
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [connectionStatus, setConnectionStatus] = useState<string>("Connecting...");
  const [currentRpc, setCurrentRpc] = useState<string>("");
  const [hot, setHot] = useState<boolean>(false);
  const [live, setLive] = useState<boolean>(true);

  // Refs
  const connectionRef = useRef<Connection | null>(globalConnection);
  const activeSubscriptions = useRef<Set<number>>(globalSubscriptions);
  const seenSignatures = useRef<Set<string>>(new Set());
  const seenMints = useRef<Set<string>>(new Set());
  const pendingAddsRef = useRef<string[]>([]);
  const visibleMintsRef = useRef<Set<string>>(new Set());
  const mintCreatedAtRef = useRef<Map<string, number>>(new Map());

  // Stats - use global state
  const [stats, setStats] = useState<Stats>(globalStats);

  // Sync local state with global state on mount
  useEffect(() => {
    if (globalTokens.length > 0) {
      // Enhance existing tokens with complete social links
      const enhancedTokens = globalTokens.map(enhanceTokenLinks);
      setTokens(enhancedTokens);
      setLastUpdate(new Date());
      console.log("🔄 Synced local state with global state:", enhancedTokens.length, "tokens");
    }
  }, []);

  // 1) Replace getTokenMetadata with direct JSON-RPC + PDA fallback
  const getTokenMetadata = useCallback(async (mint: string) => {
    // 1) Try Helius JSON-RPC directly (no Next proxy).
    try {
      const body = {
        jsonrpc: "2.0",
        id: "meta",
        method: "getAsset",
        params: { id: mint }
      };
      const res = await fetch(RPC_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const json = await res.json();
        const result = json?.result;
        if (result?.content) {
          const name = result.content?.metadata?.name || result.content?.title;
          const symbol = result.content?.metadata?.symbol;
          const image =
            result.content?.links?.image ||
            result.content?.files?.find((f: any) =>
              (f.contentType || "").startsWith("image/")
            )?.cdn_uri;

          const decimals = result.token_info?.decimals ?? 9;
          const supply = result.token_info?.supply ?? 0;

          if (name || symbol) {
            return { name, symbol, image, decimals, supply };
          }
        }
      }
    } catch (e) {
      console.warn("Helius getAsset failed:", e);
    }

    // 2) Fallback: simple fallback names/symbols
    return {
      name: `Token ${mint.slice(0, 8)}`,
      symbol: mint.slice(0, 4).toUpperCase(),
      image: undefined,
      decimals: 9,
      supply: 0,
    };

    return null;
  }, []);

  // Find mint from InitializeMint transaction
  const findMintFromInitMint = useCallback(async (signature: string) => {
    if (!connectionRef.current) return null;
    
    try {
      const tx = await connectionRef.current.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed"
      });
      
      if (!tx?.meta) return null;

      // Check main instructions
      for (const ix of tx.transaction.message.instructions as any[]) {
        if (ix.programId?.toString() === TOKEN_PROGRAM_ID.toString() && 
            'parsed' in ix && ix.parsed && 
            (ix.parsed.type === "initializeMint" || ix.parsed.type === "initializeMint2")) {
          return ix.parsed.info.mint;
        }
      }

      // Check inner instructions
      for (const inner of tx.meta.innerInstructions ?? []) {
        for (const ix of inner.instructions ?? []) {
          if (ix.programId?.toString() === TOKEN_PROGRAM_ID.toString() && 
              'parsed' in ix && ix.parsed && 
              (ix.parsed.type === "initializeMint" || ix.parsed.type === "initializeMint2")) {
            return ix.parsed.info.mint;
          }
        }
      }

      return null;
    } catch (error) {
      console.warn(`Failed to parse transaction ${signature}:`, error);
      return null;
    }
  }, []);

  // 2) Make processNewToken add the token even without metadata, and don't call pool detection
  const processNewToken = useCallback(async (mint: string, signature: string) => {
    if (seenSignatures.current.has(signature) || seenMints.current.has(mint)) return;
    seenSignatures.current.add(signature);
    seenMints.current.add(mint);

    try {
      // Try metadata; if none, use safe fallbacks but still add.
      const md = await getTokenMetadata(mint);

      const newToken: TokenData = enhanceTokenLinks({
        mint,
        name: md?.name ?? `Token ${mint.slice(0, 8)}`,
        symbol: md?.symbol ?? mint.slice(0, 4).toUpperCase(),
        decimals: md?.decimals ?? 9,
        supply: md?.supply ?? 0,
        poolType: 'none',                 // keep it simple for now
        createdAt: new Date(),
        image: md?.image,
        links: { explorer: `https://solscan.io/token/${mint}` },
      });

      // Update both local and global state
      setTokens(prev => {
        if (prev.some(t => t.mint === mint)) return prev;
        const newTokens = [newToken, ...prev].slice(0, 1000);
        // Also update global state with enhanced tokens
        globalTokens = newTokens.map(enhanceTokenLinks);
        console.log(`🔄 Updated tokens state: ${newTokens.length} total tokens`);
        return newTokens;
      });

      mintCreatedAtRef.current.set(mint, Date.now());
      
      // Update both local and global stats
      const newStats = {
        totalTokens: stats.totalTokens + 1,
        newTokens: stats.newTokens + 1,
        activeTokens: stats.activeTokens,
        totalVolume: stats.totalVolume,
        totalLiquidity: stats.totalLiquidity,
      };
      
      setStats(newStats);
      globalStats = newStats;

      console.log(`✅ Mint + metadata: ${newToken.name} (${newToken.symbol})`);
    } catch (error) {
      console.error(`Error processing token ${mint}:`, error);
    }
  }, [getTokenMetadata]);



  // NO CLEANUP - Keep connection running forever
  // const cleanup = useCallback(() => {
  //   console.log("🧹 Cleaning up subscriptions...");
  //   activeSubscriptions.current.forEach(subId => {
  //     try {
  //       connectionRef.current?.removeOnLogsListener(subId);
  //     } catch (error) {
  //       console.log("❌ Error cleaning up subscription:", error);
  //     }
  //   });
  //   activeSubscriptions.current.clear();
  // }, []);



  // 3) Listen only to InitializeMint, remove Raydium/Orca/Pump.fun listeners for now
  const startSolanaDataStream = useCallback(async () => {
    // Prevent restarting if already running globally
    if (globalConnectionStarted) {
      console.log("🔄 Global connection already started, skipping restart");
      return;
    }
    
    // If connection exists and has subscriptions, don't restart
    if (connectionRef.current && activeSubscriptions.current.size > 0) {
      console.log("🔄 Stream already running with subscriptions, skipping restart");
      return;
    }

    // If connection exists but no subscriptions, just add the subscription
    if (connectionRef.current && activeSubscriptions.current.size === 0) {
      console.log("🔄 Connection exists, adding subscription...");
      try {
        const splTokenSubId = connectionRef.current.onLogs(
          TOKEN_PROGRAM_ID,
          async (logs) => {
            if (logs.err) return;
            const hasInitializeMint = logs.logs.some(
              (l) => l.includes("Instruction: InitializeMint") || l.includes("Instruction: InitializeMint2")
            );
            if (!hasInitializeMint) return;

            const mintAddress = await findMintFromInitMint(logs.signature);
            if (mintAddress) {
              await processNewToken(mintAddress, logs.signature);
            }
          },
          "confirmed"
        );

        activeSubscriptions.current.add(splTokenSubId);
        console.log("✅ SPL Token subscription added to existing connection");
        return;
      } catch (error) {
        console.error("❌ Failed to add subscription to existing connection:", error);
      }
    }

    try {
      console.log("🚀 Starting Solana data stream...");

      connectionRef.current = new Connection(RPC_ENDPOINT, {
        wsEndpoint: WS_ENDPOINT,
        commitment: "confirmed",
      });

      setConnectionStatus("Connected");
      setCurrentRpc(RPC_ENDPOINT);
      setIsLoading(false); // <-- important so UI can render

      // Only SPL Token mints
      const splTokenSubId = connectionRef.current.onLogs(
        TOKEN_PROGRAM_ID,
        async (logs) => {
          if (logs.err) return;
          const hasInitializeMint = logs.logs.some(
            (l) => l.includes("Instruction: InitializeMint") || l.includes("Instruction: InitializeMint2")
          );
          if (!hasInitializeMint) return;

          const mintAddress = await findMintFromInitMint(logs.signature);
          if (mintAddress) {
            await processNewToken(mintAddress, logs.signature);
          }
        },
        "confirmed"
      );

      activeSubscriptions.current.add(splTokenSubId);
      console.log("✅ SPL Token subscription started (mints only)");
      
      // Mark global connection as started - NEVER RESET
      globalConnectionStarted = true;
      console.log("🌐 Global connection marked as started - will persist forever");

      console.log("🔍 Waiting for new mints...");
    } catch (error) {
      console.error("❌ Failed to start Solana data stream:", error);
      setConnectionStatus("Failed to start data stream");
      setIsLoading(false);
    }
  }, [processNewToken, findMintFromInitMint]);

  // Load existing tokens from recent transactions
  const loadExistingTokens = useCallback(async () => {
    if (!connectionRef.current) {
      console.log("❌ No connection available for loading tokens");
      return;
    }
    
    // Always try to load tokens, even if some exist
    console.log("🔍 Loading existing tokens from recent transactions...");
    console.log("🔍 Current global tokens count:", globalTokens.length);
    
    try {
      // Get recent signatures for the token program
      const signatures = await connectionRef.current.getSignaturesForAddress(
        new PublicKey(TOKEN_PROGRAM_ID),
        { limit: 100 } // Increased limit to get more tokens
      );
      
      console.log(`📝 Found ${signatures.length} recent token transactions`);
      
      // Process signatures with rate limiting to avoid 429 errors
      const promises = signatures.slice(0, 15).map(async (sig, index) => {
        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, index * 300)); // 300ms delay between each
        
        try {
          console.log(`🔍 Processing signature ${index + 1}/15: ${sig.signature.slice(0, 8)}...`);
          const mintAddress = await findMintFromInitMint(sig.signature);
          if (mintAddress && !seenMints.current.has(mintAddress)) {
            console.log(`✅ Found new mint: ${mintAddress.slice(0, 8)}...`);
            await processNewToken(mintAddress, sig.signature);
          } else if (mintAddress) {
            console.log(`🔄 Mint already seen: ${mintAddress.slice(0, 8)}...`);
          } else {
            console.log(`❌ No mint found in signature: ${sig.signature.slice(0, 8)}...`);
          }
        } catch (error) {
          console.warn(`Failed to process signature ${sig.signature}:`, error);
        }
      });
      
      // Wait for all tokens to process in parallel
      await Promise.all(promises);
      
      console.log("✅ Finished loading existing tokens");
      console.log("✅ Final global tokens count:", globalTokens.length);
    } catch (error) {
      console.error("❌ Failed to load existing tokens:", error);
    }
  }, [findMintFromInitMint, processNewToken]);

  // 4) Start the stream once and keep it running
  useEffect(() => {
    const startEverything = async () => {
      // Start the data stream
      await startSolanaDataStream();
      
      // Wait a bit for connection to establish, then load existing tokens
      setTimeout(async () => {
        if (connectionRef.current && globalTokens.length === 0) {
          await loadExistingTokens();
        }
      }, 2000); // 2 second delay to ensure connection is ready
    };
    
    startEverything();
  }, [startSolanaDataStream, loadExistingTokens]);

  // Resume live updates
  const resumeLive = useCallback(() => {
    setLive(true);
    console.log("▶️ Live updates resumed");
  }, []);

  // Pause live updates
  const pauseLive = useCallback(() => {
    setLive(false);
    console.log("⏸️ Live updates paused");
  }, []);

  // NEVER cleanup the global connection - keep it running forever
  // useEffect(() => {
  //   return () => {
  //     // DO NOT cleanup - keep connection alive
  //   };
  // }, []);

  return {
    tokens,
    isLoading,
    lastUpdate,
    stats,
    connectionStatus,
    currentRpc,
    hot,
    live,
    pendingCount: pendingAddsRef.current.length,
    resumeLive,
    pauseLive,
  };
};
