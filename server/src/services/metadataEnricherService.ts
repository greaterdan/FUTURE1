import { getOnchainMetadata } from "../lib/onchainMetadata";
import { resolveImageUrl, toHttp } from "../lib/offchainMetadata";
import { TokenRepository } from "../db/repository";
import { Connection } from "@solana/web3.js";
import { logger } from "../utils/logger";
import * as cron from "node-cron";
// Import wsService dynamically to avoid circular dependency
let wsService: any = null;
const getWsService = () => {
    if (!wsService) {
        try {
            wsService = require('../app').wsService;
        } catch (error) {
            console.warn('WebSocket service not available:', error);
        }
    }
    return wsService;
};

export class MetadataEnricherService {
  private cronJob?: cron.ScheduledTask;
  private isRunning = false;

  constructor(
    private conn: Connection,
    private repo: TokenRepository
  ) {}

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.info("Metadata Enricher Service is already running");
      return;
    }

    logger.info("Starting Metadata Enricher Service...");
    
    // Start cron job to enrich tokens every 5 seconds for live mint detection
    this.cronJob = cron.schedule("*/5 * * * * *", async () => {
      try {
        await this.enrichTokens(50); // Process 50 tokens at a time
      } catch (error) {
        logger.error("Error in metadata enrichment cron job:", error);
      }
    });

    this.isRunning = true;
    logger.info("✅ Metadata Enricher Service started successfully");
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.info("Metadata Enricher Service is not running");
      return;
    }

    logger.info("Stopping Metadata Enricher Service...");
    
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = undefined;
    }

    this.isRunning = false;
    logger.info("✅ Metadata Enricher Service stopped successfully");
  }

  // Pick ANY tokens missing basics (regardless of liquidity/bonding curve)
  async enrichTokens(limit = 200) {
    const mints: string[] = await this.repo.findMintsNeedingMetadata(limit);
    if (mints.length === 0) {
      logger.debug("No tokens need metadata enrichment");
      return;
    }
    
    logger.info(`Enriching metadata for ${mints.length} tokens`);
    
    // Process in smaller batches with rate limiting to avoid overwhelming the RPC
    const batchSize = 3; // Reduced from 10 to 3 for better rate limiting
    for (let i = 0; i < mints.length; i += batchSize) {
      const batch = mints.slice(i, i + batchSize);
      
      // Process batch sequentially to avoid overwhelming external APIs
      for (const mint of batch) {
        await this.enrichToken(mint);
        // Rate limit: max 2-3 tokens per second
        await new Promise(resolve => setTimeout(resolve, 400));
      }
      
      // Additional delay between batches
      if (i + batchSize < mints.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  async enrichToken(mint: string) {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        attempt++;
        logger.debug(`Enriching metadata for ${mint} (attempt ${attempt}/${maxRetries})`);

        // 1) On-chain first
        const onchain = await getOnchainMetadata(this.conn, mint);

        // Persist name/symbol/uri immediately if present
        if (onchain.name || onchain.symbol || onchain.uri) {
          await this.repo.updateTokenMetadataByMint(mint, {
            name: onchain.name,
            symbol: onchain.symbol,
            metadata_uri: onchain.uri,
          });
          logger.info(`✅ Metadata enriched: ${onchain.name || "Unknown"} (${onchain.symbol || "Unknown"}) from ${onchain.uri || "on-chain"}`);
        }

        // Try resolve image from on-chain data first
        let resolvedImg: string | undefined;

        // (a) direct image returned by onchain fetcher
        if (onchain.image) {
          const http = toHttp(onchain.image) ?? onchain.image;
          if (http?.startsWith("http")) resolvedImg = http;
        }

        // (b) resolve via metadata URI
        if (!resolvedImg && onchain.uri) {
          resolvedImg = await resolveImageUrl(onchain.uri).catch(() => undefined);
        }

        // 2) If nothing on-chain, try Helius fallback (and also try to resolve its image/uri)
        let heliusMetadata: { name?: string; symbol?: string; uri?: string; image?: string } = {};
        if ((!onchain.name && !onchain.symbol && !onchain.uri) || !resolvedImg) {
          if (!onchain.name && !onchain.symbol && !onchain.uri) {
            logger.debug(`No on-chain metadata found for ${mint}, trying Helius fallback...`);
          } else {
            logger.debug(`No image from on-chain for ${mint}, trying Helius fallback for image...`);
          }

          heliusMetadata = await this.tryHeliusFallback(mint);

          // If Helius provided name/symbol/uri we didn't have, upsert them
          if (heliusMetadata.name || heliusMetadata.symbol || heliusMetadata.uri) {
            await this.repo.updateTokenMetadataByMint(mint, {
              name: onchain.name ?? heliusMetadata.name,
              symbol: onchain.symbol ?? heliusMetadata.symbol,
              metadata_uri: onchain.uri ?? heliusMetadata.uri,
            });
            logger.info(`✅ Metadata enriched via Helius fallback: ${heliusMetadata.name || onchain.name || "Unknown"} (${heliusMetadata.symbol || onchain.symbol || "Unknown"})`);
          }

          // (c) direct image from helius
          if (!resolvedImg && heliusMetadata.image) {
            const http = toHttp(heliusMetadata.image) ?? heliusMetadata.image;
            if (http?.startsWith("http")) resolvedImg = http;
          }

          // (d) resolve via helius json_uri
          if (!resolvedImg && heliusMetadata.uri) {
            resolvedImg = await resolveImageUrl(heliusMetadata.uri).catch(() => undefined);
          }
        }

        // 3) Save image if resolved
        if (resolvedImg) {
          await this.repo.updateTokenMetadataByMint(mint, { image_url: resolvedImg });
          logger.debug(`🖼️  Image set for ${mint}: ${resolvedImg}`);
        } else {
          logger.debug(`No image could be resolved for ${mint}`);
        }

        // Broadcast token update to WebSocket clients
        // Note: We'll broadcast the update with the mint address
        const ws = getWsService();
        if (ws) {
            ws.broadcastTokenUpdate({ mint, updated: true });
        }

        return; // done

      } catch (error) {
        if (attempt === maxRetries) {
          logger.error(`Failed to enrich token ${mint} after ${maxRetries} attempts:`, error);
        } else {
          logger.warn(`⚠️ Metadata enrichment failed for ${mint} (attempt ${attempt}/${maxRetries}), retrying...`);
          await new Promise(r => setTimeout(r, Math.pow(2, attempt - 1) * 1000));
        }
      }
    }
  }
  
  // Helius fallback for tokens with invalid on-chain metadata
  private async tryHeliusFallback(mint: string): Promise<{ name?: string; symbol?: string; uri?: string; image?: string }> {
    const apiKey = process.env.HELIUS_API_KEY || process.env.HELIUS_KEY || "";
    if (!apiKey) {
      logger.warn("HELIUS_API_KEY not set; skipping fallback");
      return {};
    }
    try {
      const resp = await fetch(`https://mainnet.helius-rpc.com/?api-key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "get-asset",
          method: "getAsset",
          params: { id: mint }
        })
      });
      if (!resp.ok) return {};
      const { result } = await resp.json() as any;

      const name = result?.content?.metadata?.name ?? result?.content?.metadata?.token_standard?.name;
      const symbol = result?.content?.metadata?.symbol ?? result?.content?.metadata?.token_standard?.symbol;
      const jsonUri = result?.content?.json_uri;
      const image = result?.content?.links?.image;

      return { name, symbol, uri: jsonUri, image };
    } catch (e) {
      return {};
    }
  }
}