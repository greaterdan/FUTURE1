import { tokenRepository } from '../db/repository';
import { logger } from '../utils/logger';
import * as cron from 'node-cron';
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

export class TokenStatusUpdaterService {
    private cronJob?: cron.ScheduledTask;
    private isRunning = false;

    async start(): Promise<void> {
        if (this.isRunning) {
            logger.info('Token Status Updater Service is already running');
            return;
        }

        logger.info('Starting Token Status Updater Service...');
        
        // Update token statuses every 30 seconds to avoid rate limits
        this.cronJob = cron.schedule("*/30 * * * * *", async () => {
            try {
                await this.updateTokenStatuses();
            } catch (error) {
                logger.error('Error in token status update cron job:', error);
            }
        });

        this.isRunning = true;
        logger.info('✅ Token Status Updater Service started successfully');
    }

    async stop(): Promise<void> {
        if (!this.isRunning) {
            logger.info('Token Status Updater Service is not running');
            return;
        }

        logger.info('Stopping Token Status Updater Service...');
        
        if (this.cronJob) {
            this.cronJob.stop();
            this.cronJob = undefined;
        }

        this.isRunning = false;
        logger.info('✅ Token Status Updater Service stopped successfully');
    }

    private async updateTokenStatuses(): Promise<void> {
        try {
            const now = new Date();

            // Get all fresh tokens with their latest market cap data
            const freshTokens = await tokenRepository.getAllTokens();
            const freshTokensOnly = freshTokens.filter(token => token.status === 'fresh');
            
            for (const token of freshTokensOnly) {
                const tokenAge = now.getTime() - new Date(token.created_at).getTime();
                const ageInMinutes = tokenAge / (1000 * 60);

                let newStatus: 'fresh' | 'active' | 'curve' = token.status;
                let shouldUpdate = false;

                // Move tokens based on age and activity
                if (ageInMinutes > 30) {
                    // Tokens older than 30 minutes become 'active' if they have liquidity
                    if (token.latest_marketcap?.liquidity && token.latest_marketcap.liquidity > 0) {
                        newStatus = 'active';
                        shouldUpdate = true;
                    }
                } else if (ageInMinutes > 5) {
                    // Tokens older than 5 minutes but less than 30 minutes
                    // Check if they have liquidity to move to 'active'
                    if (token.latest_marketcap?.liquidity && token.latest_marketcap.liquidity > 1000) { // Minimum liquidity threshold
                        newStatus = 'active';
                        shouldUpdate = true;
                    }
                }

                // Update token status if needed
                if (shouldUpdate && newStatus !== token.status) {
                    await tokenRepository.updateTokenStatus(token.mint, newStatus);
                    logger.info(`Updated token ${token.mint} status from ${token.status} to ${newStatus}`);
                    
                    // Broadcast status update via WebSocket
                    const ws = getWsService();
                    if (ws) {
                        ws.broadcastTokenUpdate({
                            ...token,
                            status: newStatus
                        });
                    }
                }
            }

        } catch (error) {
            logger.error('Error updating token statuses:', error);
        }
    }
}
