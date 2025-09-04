import { getOnchainMetadata } from "../lib/onchainMetadata";
import { resolveImageUrl } from "../lib/offchainMetadata";
import { TokenRepository } from "../db/repository";
import { Connection } from "@solana/web3.js";
import { logger } from "../utils/logger";
import * as cron from "node-cron";

const clean = (s?: string | null) => (s && s.trim() ? s.trim() : undefined);

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
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.debug(`Enriching metadata for ${mint} (attempt ${attempt}/${maxRetries})`);

        const onchain = await getOnchainMetadata(this.conn, mint);

        if (onchain.name || onchain.symbol || onchain.uri) {
          const update: any = {};
          const nm = clean(onchain.name);
          const sy = clean(onchain.symbol);
          const ur = clean(onchain.uri);
          if (nm) update.name = nm;
          if (sy) update.symbol = sy;
          if (ur) update.metadata_uri = ur;

          if (Object.keys(update).length) {
            await this.repo.updateTokenMetadataByMint(mint, update);
            logger.info(`✅ Metadata enriched: ${nm || 'Unknown'} (${sy || 'Unknown'}) from ${ur || 'on-chain'}`);
          }

          // Resolve image (try off-chain JSON first)
          let img = ur ? await resolveImageUrl(ur).catch(() => undefined) : undefined;

          // If still nothing, ask Helius just for the image
          if (!img) {
            const hel = await this.tryHeliusFallback(mint);
            img = clean(hel.image);
          }

          if (img) {
            await this.repo.updateTokenMetadataByMint(mint, { image_url: img });
            logger.debug(`🖼️  Image set for ${mint}: ${img}`);
          } else {
            logger.debug(`No image could be resolved for ${mint}`);
          }

          return;
        }

        // No usable on-chain md → Helius
        logger.debug(`No on-chain metadata found for ${mint}, trying Helius fallback...`);
        const hel = await this.tryHeliusFallback(mint);

        if (hel.name || hel.symbol || hel.uri || hel.image) {
          const update: any = {};
          const nm = clean(hel.name);
          const sy = clean(hel.symbol);
          const ur = clean(hel.uri);
          const im = clean(hel.image);
          if (nm) update.name = nm;
          if (sy) update.symbol = sy;
          if (ur) update.metadata_uri = ur;
          if (im) update.image_url = im;

          if (Object.keys(update).length) {
            await this.repo.updateTokenMetadataByMint(mint, update);
            logger.info(`✅ Metadata enriched via Helius fallback: ${nm || 'Unknown'} (${sy || 'Unknown'})`);
          }
          return;
        }

        logger.debug(`No metadata found for ${mint} via any method`);
        return;

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