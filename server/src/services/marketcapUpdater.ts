import { tokenRepository, marketCapRepository } from '../db/repository';
import { logger } from '../utils/logger';

interface MarketData {
    price_usd: number;
    marketcap: number;
    volume_24h: number;
    liquidity: number;
}

export class MarketcapUpdaterService {
    private isRunning: boolean = false;
    private intervalId: NodeJS.Timeout | null = null;
    private jupiterApiKey: string;
    private birdeyeApiKey: string;

    constructor(jupiterApiKey: string, birdeyeApiKey: string) {
        this.jupiterApiKey = jupiterApiKey;
        this.birdeyeApiKey = birdeyeApiKey;
    }

    async start(): Promise<void> {
        if (this.isRunning) {
            logger.info('Marketcap updater is already running');
            return;
        }

        try {
            logger.info('Starting marketcap updater service...');
            
            // Start the update loop
            this.intervalId = setInterval(async () => {
                await this.updateAllTokens();
            }, 30000); // 30 seconds

            this.isRunning = true;
            logger.info('Marketcap updater service started successfully');
            
        } catch (error) {
            logger.error('Failed to start marketcap updater service:', error);
            throw error;
        }
    }

    async stop(): Promise<void> {
        if (!this.isRunning) {
            logger.info('Marketcap updater is not running');
            return;
        }

        try {
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
            
            this.isRunning = false;
            logger.info('Marketcap updater service stopped');
            
        } catch (error) {
            logger.error('Error stopping marketcap updater service:', error);
            throw error;
        }
    }

    private async updateAllTokens(): Promise<void> {
        try {
            logger.info('Starting marketcap update cycle...');
            
            // Get all tokens that need updating
            const tokens = await tokenRepository.getAllTokens();
            const tokensToUpdate = tokens.filter(t => t.status === 'fresh' || t.status === 'active');
            
            logger.info(`Updating marketcap for ${tokensToUpdate.length} tokens`);
            
            // Update tokens in parallel with rate limiting
            const batchSize = 5; // Process 5 tokens at a time to avoid rate limits
            for (let i = 0; i < tokensToUpdate.length; i += batchSize) {
                const batch = tokensToUpdate.slice(i, i + batchSize);
                
                await Promise.all(
                    batch.map(token => this.updateTokenMarketcap(token.contract_address, token.id))
                );
                
                // Small delay between batches to avoid rate limits
                if (i + batchSize < tokensToUpdate.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            logger.info('Marketcap update cycle completed');
            
        } catch (error) {
            logger.error('Error in marketcap update cycle:', error);
        }
    }

    private async updateTokenMarketcap(contractAddress: string, tokenId: number): Promise<void> {
        try {
            // Try to get market data from multiple sources
            let marketData: MarketData | null = null;
            
            // Try Jupiter first
            marketData = await this.getJupiterMarketData(contractAddress);
            
            // Fallback to Birdeye if Jupiter fails
            if (!marketData) {
                marketData = await this.getBirdeyeMarketData(contractAddress);
            }
            
            // Fallback to DexScreener if both fail
            if (!marketData) {
                marketData = await this.getDexScreenerMarketData(contractAddress);
            }
            
            if (marketData) {
                // Save marketcap data
                await marketCapRepository.createMarketCap(
                    tokenId,
                    marketData.price_usd,
                    marketData.marketcap,
                    marketData.volume_24h,
                    marketData.liquidity
                );
                
                // Update token status if it has valid liquidity and price
                if (marketData.liquidity > 1000 && marketData.price_usd > 0) {
                    await tokenRepository.updateTokenStatus(tokenId, 'active');
                    logger.info(`Token ${contractAddress} marked as active (liquidity: $${marketData.liquidity.toLocaleString()})`);
                }
                
                logger.debug(`Updated marketcap for ${contractAddress}: $${marketData.marketcap.toLocaleString()}`);
            } else {
                logger.debug(`No market data available for ${contractAddress}`);
            }
            
        } catch (error) {
            logger.error(`Error updating marketcap for ${contractAddress}:`, error);
        }
    }

    private async getJupiterMarketData(contractAddress: string): Promise<MarketData | null> {
        try {
            if (!this.jupiterApiKey) return null;
            
            const response = await fetch(`https://price.jup.ag/v4/price?ids=${contractAddress}`, {
                headers: { 'Authorization': `Bearer ${this.jupiterApiKey}` }
            });
            
            if (!response.ok) return null;
            
            const data: any = await response.json();
            const tokenData = data.data[contractAddress];
            
            if (!tokenData) return null;
            
            return {
                price_usd: tokenData.price,
                marketcap: tokenData.price * (tokenData.supply || 0),
                volume_24h: tokenData.volume24h || 0,
                liquidity: tokenData.liquidity || 0
            };
            
        } catch (error) {
            logger.debug(`Jupiter API failed for ${contractAddress}:`, error);
            return null;
        }
    }

    private async getBirdeyeMarketData(contractAddress: string): Promise<MarketData | null> {
        try {
            if (!this.birdeyeApiKey) return null;
            
            const response = await fetch(`https://public-api.birdeye.so/public/price?address=${contractAddress}`, {
                headers: { 'X-API-KEY': this.birdeyeApiKey }
            });
            
            if (!response.ok) return null;
            
            const data: any = await response.json();
            
            if (!data.success || !data.data) return null;
            
            return {
                price_usd: data.data.value,
                marketcap: data.data.marketCap || 0,
                volume_24h: data.data.volume24h || 0,
                liquidity: data.data.liquidity || 0
            };
            
        } catch (error) {
            logger.debug(`Birdeye API failed for ${contractAddress}:`, error);
            return null;
        }
    }

    private async getDexScreenerMarketData(contractAddress: string): Promise<MarketData | null> {
        try {
            const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${contractAddress}`);
            
            if (!response.ok) return null;
            
            const data: any = await response.json();
            const pairs = data.pairs;
            
            if (!pairs || pairs.length === 0) return null;
            
            // Get the first pair with the highest liquidity
            const bestPair = pairs.reduce((best: any, current: any) => {
                return (current.liquidity?.usd || 0) > (best.liquidity?.usd || 0) ? current : best;
            });
            
            return {
                price_usd: parseFloat(bestPair.priceUsd) || 0,
                marketcap: parseFloat(bestPair.marketCap) || 0,
                volume_24h: parseFloat(bestPair.volume?.h24) || 0,
                liquidity: parseFloat(bestPair.liquidity?.usd) || 0
            };
            
        } catch (error) {
            logger.debug(`DexScreener API failed for ${contractAddress}:`, error);
            return null;
        }
    }
}
