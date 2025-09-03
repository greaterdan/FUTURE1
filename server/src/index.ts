import http from 'http';
import dotenv from 'dotenv';
import { Connection } from '@solana/web3.js';
import app from './app';
import { MintWatcherService } from './services/mintWatcher';
import { MarketcapUpdaterService } from './services/marketcapUpdater';
import { MetadataEnricherService } from './services/metadataEnricherService';
import db from './db/connection';
import { tokenRepository } from './db/repository';
import { logger } from './utils/logger';

dotenv.config();

const PORT = process.env.PORT || 8080;

// Create HTTP server
const server = http.createServer(app);

// Get required environment variables
const HELIUS_RPC_URL = process.env.HELIUS_RPC_URL;
const JUPITER_API_KEY = process.env.JUPITER_API_KEY || '';
const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY || '';

if (!HELIUS_RPC_URL) {
    logger.error('HELIUS_RPC_URL environment variable is required');
    process.exit(1);
}

// Initialize services
const mintWatcher = new MintWatcherService(HELIUS_RPC_URL);
const marketcapUpdater = new MarketcapUpdaterService(JUPITER_API_KEY, BIRDEYE_API_KEY);
const metadataEnricher = new MetadataEnricherService(
    new Connection(HELIUS_RPC_URL, 'confirmed'),
    tokenRepository
);

// Graceful shutdown function
const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    try {
        // Stop all services
        await mintWatcher.stop();
        await marketcapUpdater.stop();
        await metadataEnricher.stop();
        
        // Close database connections
        await db.close();
        
        // Close HTTP server
        server.close(() => {
            logger.info('HTTP server closed');
            process.exit(0);
        });
        
        // Force exit after 10 seconds
        setTimeout(() => {
            logger.error('Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
        
    } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
    }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
});

// Start the server
const startServer = async () => {
    try {
        // Test database connection
        const dbConnected = await db.testConnection();
        if (!dbConnected) {
            logger.error('Failed to connect to database. Exiting...');
            process.exit(1);
        }

        // Database schema already fixed manually - skipping ensureSchema
        // await db.ensureSchema();
        logger.info('✅ Database schema already fixed manually');

        // Start background services
        logger.info('Starting Solana Mint Discovery System...');
        
        // Start mint watcher service
        await mintWatcher.start();
        logger.info('✅ Mint Watcher: Real-time InitializeMint detection');
        
        // Start marketcap updater service
        await marketcapUpdater.start();
        logger.info('✅ Marketcap Updater: Price updates every 30 seconds');
        
        // Start metadata enricher service
        await metadataEnricher.start();
        logger.info('✅ Metadata Enricher: Enriching tokens every 10 seconds');
        
        logger.info('🚀 Solana Mint Discovery System started successfully!');
        logger.info('🔍 Watching for new token mints via Helius WebSocket');
        logger.info('💰 Tracking marketcap from Jupiter, Birdeye, and DexScreener');
        logger.info('📊 Tokens progress: fresh → curve → active (when migrating to AMM)');

        // Start HTTP server
        server.listen(PORT, () => {
            logger.info(`🚀 Solana Mint Discovery System is running on port ${PORT}`);
            logger.info(`📊 API available at http://localhost:${PORT}`);
            logger.info(`🐘 Database connection established`);
            logger.info(`🔍 Fresh mints: /api/tokens/fresh`);
            logger.info(`💰 Active tokens: /api/tokens/active`);
        });

    } catch (error) {
        logger.error('Error starting server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();
