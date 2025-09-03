import { Token, MarketCap, TokenWithMarketCap } from './types';
import { logger } from '../utils/logger';
import db from './connection';

export class TokenRepository {

    async createToken(contractAddress: string, decimals: number, supply: number, blocktime: Date, name?: string, symbol?: string): Promise<Token> {
        const query = `
            INSERT INTO tokens (
                contract_address, 
                name, 
                symbol, 
                source, 
                decimals, 
                supply, 
                blocktime, 
                status, 
                created_at, 
                updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
            ON CONFLICT (contract_address) DO UPDATE SET
                updated_at = NOW(),
                decimals = EXCLUDED.decimals,
                supply = EXCLUDED.supply,
                blocktime = EXCLUDED.blocktime
            RETURNING *
        `;
        
        try {
            // Use provided name/symbol or generate fallbacks
            const tokenName = name || `Token_${contractAddress.slice(0, 8)}`;
            const tokenSymbol = symbol || `TKN${contractAddress.slice(0, 4)}`;
            const source = 'helius';
            const status = 'fresh';
            
            const result = await db.query(query, [
                contractAddress, 
                tokenName, 
                tokenSymbol, 
                source, 
                decimals, 
                supply, 
                blocktime, 
                status
            ]);
            logger.info(`Created new token: ${contractAddress}`);
            return result.rows[0];
        } catch (error: any) {
            logger.error(`Error creating token ${contractAddress}:`, error);
            throw error;
        }
    }

    async findByContractAddress(contractAddress: string): Promise<Token | null> {
        const query = 'SELECT * FROM tokens WHERE contract_address = $1';
        const result = await db.query(query, [contractAddress]);
        return result.rows[0] || null;
    }

    async findFreshTokens(limit: number = 100, offset: number = 0): Promise<Token[]> {
        const query = `
            SELECT *, 
                COALESCE(name, symbol, SUBSTRING(contract_address,1,4) || '…' || SUBSTRING(contract_address FROM LENGTH(contract_address)-3)) AS display_name
            FROM tokens 
            WHERE status = 'fresh' 
            ORDER BY COALESCE(blocktime, created_at) DESC 
            LIMIT $1 OFFSET $2
        `;
        const result = await db.query(query, [limit, offset]);
        return result.rows;
    }

    async countFreshTokens(): Promise<number> {
        const query = `SELECT COUNT(*)::int AS count FROM tokens WHERE status = 'fresh'`;
        const result = await db.query(query);
        return result.rows[0]?.count || 0;
    }

    async findActiveTokens(limit: number = 100, offset: number = 0): Promise<TokenWithMarketCap[]> {
        const query = `
            SELECT t.*, m.price_usd, m.marketcap, m.volume_24h, m.liquidity
            FROM tokens t
            LEFT JOIN LATERAL (
                SELECT * FROM marketcaps 
                WHERE token_id = t.id 
                ORDER BY timestamp DESC 
                LIMIT 1
            ) m ON true
            WHERE t.status = 'active'
            ORDER BY m.marketcap DESC NULLS LAST
            LIMIT $1 OFFSET $2
        `;
        const result = await db.query(query, [limit, offset]);
        return result.rows;
    }

    async countActiveTokens(): Promise<number> {
        const query = `SELECT COUNT(*)::int AS count FROM tokens WHERE status = 'active'`;
        const result = await db.query(query);
        return result.rows[0]?.count || 0;
    }

    async updateTokenStatus(id: number, status: 'fresh' | 'active'): Promise<void> {
        const query = 'UPDATE tokens SET status = $1 WHERE id = $2';
        await db.query(query, [status, id]);
        logger.info(`Updated token ${id} status to ${status}`);
    }

    async getAllTokens(): Promise<Token[]> {
        const query = 'SELECT * FROM tokens ORDER BY created_at DESC';
        const result = await db.query(query);
        return result.rows;
    }
}

export class MarketCapRepository {

    async createMarketCap(tokenId: number, priceUsd: number, marketcap: number, volume24h: number, liquidity: number): Promise<MarketCap> {
        const query = `
            INSERT INTO marketcaps (token_id, price_usd, marketcap, volume_24h, liquidity)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        
        const result = await db.query(query, [tokenId, priceUsd, marketcap, volume24h, liquidity]);
        logger.info(`Created marketcap record for token ${tokenId}`);
        return result.rows[0];
    }

    async findLatestByTokenId(tokenId: number): Promise<MarketCap | null> {
        const query = `
            SELECT * FROM marketcaps 
            WHERE token_id = $1 
            ORDER BY timestamp DESC 
            LIMIT 1
        `;
        const result = await db.query(query, [tokenId]);
        return result.rows[0] || null;
    }

    async findHistoryByTokenId(tokenId: number, limit: number = 100): Promise<MarketCap[]> {
        const query = `
            SELECT * FROM marketcaps
            WHERE token_id = $1 
            ORDER BY timestamp DESC 
            LIMIT $2
        `;
        const result = await db.query(query, [tokenId, limit]);
        return result.rows;
    }
}

// Export singleton instances
export const tokenRepository = new TokenRepository();
export const marketCapRepository = new MarketCapRepository();
