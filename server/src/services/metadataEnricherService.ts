import { getOnchainMetadata } from "../lib/onchainMetadata";
import { resolveImageUrl } from "../lib/offchainMetadata";
import { TokenRepository } from "../db/repository";
import { Connection } from "@solana/web3.js";
import { logger } from "../utils/logger";
import * as cron from "node-cron";

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
    
    // Start cron job to enrich tokens every 10 seconds
    this.cronJob = cron.schedule("*/10 * * * * *", async () => {
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
    
    // Process in smaller batches to avoid overwhelming the RPC
    const batchSize = 10;
    for (let i = 0; i < mints.length; i += batchSize) {
      const batch = mints.slice(i, i + batchSize);
      await Promise.all(batch.map((m) => this.enrichToken(m)));
      
      // Small delay between batches to be nice to the RPC
      if (i + batchSize < mints.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  async enrichToken(mint: string) {
    try {
      const onchain = await getOnchainMetadata(this.conn, mint);
      if (onchain.name || onchain.symbol || onchain.uri) {
        await this.repo.updateTokenMetadataByMint(mint, {
          name: onchain.name,
          symbol: onchain.symbol,
          metadata_uri: onchain.uri,
        });
        logger.debug(`Updated metadata for ${mint}: name=${onchain.name}, symbol=${onchain.symbol}, uri=${onchain.uri}`);
      }

      // Try to fill image_url (don't fail the whole job if fetch is down)
      if (onchain.uri) {
        const img = await resolveImageUrl(onchain.uri).catch(() => undefined);
        if (img) {
          await this.repo.updateTokenMetadataByMint(mint, { image_url: img });
          logger.debug(`Resolved image for ${mint}: ${img}`);
        }
      }
    } catch (error) {
      logger.error(`Failed to enrich token ${mint}:`, error);
    }
  }
}
