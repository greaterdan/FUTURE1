import { Connection } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { tokenRepository } from '../db/repository';
import { logger } from '../utils/logger';

export class MintWatcherService {
    private connection: Connection;
    private isRunning: boolean = false;
    private subscriptionId: number | null = null;

    constructor(rpcUrl: string) {
        this.connection = new Connection(rpcUrl, 'confirmed');
    }

    async start(): Promise<void> {
        if (this.isRunning) {
            logger.info('Mint watcher is already running');
            return;
        }

        try {
            logger.info('Starting mint watcher service...');
            
            // Subscribe to Token Program logs
            this.subscriptionId = this.connection.onLogs(
                TOKEN_PROGRAM_ID,
                async (logs) => {
                    if (logs.err) return;
                    
                    // Check if this is an InitializeMint instruction
                    const hasInitializeMint = logs.logs.some(
                        (log) => log.includes("Instruction: InitializeMint") || log.includes("Instruction: InitializeMint2")
                    );
                    
                    if (hasInitializeMint) {
                        await this.processInitializeMint(logs.signature);
                    }
                },
                'confirmed'
            );

            this.isRunning = true;
            logger.info('Mint watcher service started successfully');
            
        } catch (error) {
            logger.error('Failed to start mint watcher service:', error);
            throw error;
        }
    }

    async stop(): Promise<void> {
        if (!this.isRunning) {
            logger.info('Mint watcher is not running');
            return;
        }

        try {
            if (this.subscriptionId !== null) {
                await this.connection.removeOnLogsListener(this.subscriptionId);
                this.subscriptionId = null;
            }
            
            this.isRunning = false;
            logger.info('Mint watcher service stopped');
            
        } catch (error) {
            logger.error('Error stopping mint watcher service:', error);
            throw error;
        }
    }

    private async processInitializeMint(signature: string): Promise<void> {
        try {
            logger.info(`Processing InitializeMint transaction: ${signature}`);
            
            // Get transaction details
            const tx = await this.connection.getParsedTransaction(signature, {
                maxSupportedTransactionVersion: 0,
                commitment: 'confirmed'
            });
            
            if (!tx?.meta) {
                logger.warn(`No transaction metadata for ${signature}`);
                return;
            }

            // Extract mint address and decimals from the transaction
            const mintInfo = this.extractMintInfo(tx);
            if (!mintInfo) {
                logger.warn(`Could not extract mint info from ${signature}`);
                return;
            }

            // Save to database
            await tokenRepository.createToken(
                mintInfo.mint,
                mintInfo.decimals,
                mintInfo.supply,
                new Date(mintInfo.blocktime * 1000),
                undefined, // name - fresh mints often don't have metadata yet
                undefined  // symbol - fresh mints often don't have metadata yet
            );

            logger.info(`Successfully processed mint: ${mintInfo.mint} (${mintInfo.decimals} decimals)`);
            
        } catch (error) {
            logger.error(`Error processing InitializeMint transaction ${signature}:`, error);
        }
    }

    private extractMintInfo(tx: any): { mint: string; decimals: number; supply: number; blocktime: number } | null {
        try {
            // Check main instructions
            for (const ix of tx.transaction.message.instructions as any[]) {
                if (ix.programId?.toString() === TOKEN_PROGRAM_ID.toString() && 
                    'parsed' in ix && ix.parsed && 
                    (ix.parsed.type === "initializeMint" || ix.parsed.type === "initializeMint2")) {
                    
                    return {
                        mint: ix.parsed.info.mint,
                        decimals: ix.parsed.info.decimals,
                        supply: ix.parsed.info.supply || 0,
                        blocktime: tx.blockTime || Math.floor(Date.now() / 1000)
                    };
                }
            }

            // Check inner instructions
            for (const inner of tx.meta.innerInstructions ?? []) {
                for (const ix of inner.instructions ?? []) {
                    if (ix.programId?.toString() === TOKEN_PROGRAM_ID.toString() && 
                        'parsed' in ix && ix.parsed && 
                        (ix.parsed.type === "initializeMint" || ix.parsed.type === "initializeMint2")) {
                        
                        return {
                            mint: ix.parsed.info.mint,
                            decimals: ix.parsed.info.decimals,
                            supply: ix.parsed.info.supply || 0,
                            blocktime: tx.blockTime || Math.floor(Date.now() / 1000)
                        };
                    }
                }
            }

            return null;
        } catch (error) {
            logger.error('Error extracting mint info:', error);
            return null;
        }
    }

}
