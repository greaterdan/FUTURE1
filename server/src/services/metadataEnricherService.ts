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
        
        const onchain = await getOnchainMetadata(this.conn, mint);
        
        if (onchain.name || onchain.symbol || onchain.uri) {
          await this.repo.updateTokenMetadataByMint(mint, {
            name: onchain.name,
            symbol: onchain.symbol,
            metadata_uri: onchain.uri,
          });
          
          logger.info(`✅ Metadata enriched: ${onchain.name || 'Unknown'} (${onchain.symbol || 'Unknown'}) from ${onchain.uri || 'on-chain'}`);
          
          // Try to fill image_url (don't fail the whole job if fetch is down)
          if (onchain.uri) {
            const img = await resolveImageUrl(onchain.uri).catch(() => undefined);
            if (img) {
              await this.repo.updateTokenMetadataByMint(mint, { image_url: img });
              logger.debug(`Resolved image for ${mint}: ${img}`);
            }
          }
          
          return; // Success, exit retry loop
        } else {
          // Try Helius fallback if on-chain metadata is missing
          logger.debug(`No on-chain metadata found for ${mint}, trying Helius fallback...`);
          const heliusMetadata = await this.tryHeliusFallback(mint);
          
          if (heliusMetadata.name || heliusMetadata.symbol) {
            await this.repo.updateTokenMetadataByMint(mint, {
              name: heliusMetadata.name,
              symbol: heliusMetadata.symbol,
              metadata_uri: heliusMetadata.uri,
              image_url: heliusMetadata.image
            });
            
            logger.info(`✅ Metadata enriched via Helius fallback: ${heliusMetadata.name || 'Unknown'} (${heliusMetadata.symbol || 'Unknown'})`);
            return;
          }
          
          logger.debug(`No metadata found for ${mint} via any method`);
          return; // No metadata available, don't retry
        }
      } catch (error) {
        if (attempt === maxRetries) {
          logger.error(`Failed to enrich token ${mint} after ${maxRetries} attempts:`, error);
        } else {
          logger.warn(`⚠️ Metadata enrichment failed for ${mint} (attempt ${attempt}/${maxRetries}), retrying...`);
          // Exponential backoff: wait 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
        }
      }
    }
  }
  
  // Helius fallback for tokens with invalid on-chain metadata
  private async tryHeliusFallback(mint: string): Promise<{ name?: string; symbol?: string; uri?: string; image?: string }> {
    try {
      // Get Helius API key from environment
      const heliusApiKey = process.env.HELIUS_API_KEY;
      if (!heliusApiKey) {
        logger.debug(`Helius API key not configured, skipping fallback for ${mint}`);
        return {};
      }

      logger.debug(`Trying Helius fallback for ${mint}...`);
      
      const response = await fetch("https://mainnet.helius-rpc.com/?api-key=" + heliusApiKey, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "metadata-fallback",
          method: "getAsset",
          params: { id: mint }
        })
      });

      if (!response.ok) {
        logger.warn(`Helius API request failed with status ${response.status} for ${mint}`);
        return {};
      }

      const data = await response.json() as any;
      const { result, error } = data;
      
      if (error) {
        logger.warn(`Helius API error for ${mint}:`, error);
        return {};
      }

      if (!result) {
        logger.debug(`No Helius result for ${mint}`);
        return {};
      }

      // Extract metadata from Helius response
      const metadata = {
        name: result?.content?.metadata?.name,
        symbol: result?.content?.metadata?.symbol,
        uri: result?.content?.json_uri,
        image: result?.content?.links?.image || result?.content?.files?.[0]?.uri
      };

      // Validate that we got useful data
      if (metadata.name || metadata.symbol) {
        logger.info(`✅ Helius fallback successful for ${mint}: ${metadata.name || 'Unknown'} (${metadata.symbol || 'Unknown'})`);
        return metadata;
      } else {
        logger.debug(`Helius fallback returned no useful metadata for ${mint}`);
        return {};
      }

    } catch (error) {
      logger.warn(`Helius fallback failed for ${mint}:`, error);
      return {};
    }
  }
}
