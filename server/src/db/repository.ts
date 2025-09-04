import { Token, MarketCap, TokenWithMarketCap } from './types';
import { logger } from '../utils/logger';
import db from './connection';

export class TokenRepository {

    async createToken(
        mint: string, 
        decimals: number, 
        supply: number, 
        blocktime: Date, 
        name?: string, 
        symbol?: string,
        metadataUri?: string,
        imageUrl?: string,
        bondingCurveAddress?: string,
        isOnCurve: boolean = false,
        status: 'fresh' | 'active' | 'curve' = 'fresh'
    ): Promise<Token> {
        const query = `
            INSERT INTO tokens (
                mint, 
                name, 
                symbol, 
                source, 
                decimals, 
                supply, 
                blocktime, 
                status,
                metadata_uri,
                image_url,
                bonding_curve_address,
                is_on_curve
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (mint) DO UPDATE SET
                name = COALESCE(tokens.name, EXCLUDED.name),
                symbol = COALESCE(tokens.symbol, EXCLUDED.symbol),
                metadata_uri = COALESCE(tokens.metadata_uri, EXCLUDED.metadata_uri),
                image_url = COALESCE(tokens.image_url, EXCLUDED.image_url),
                bonding_curve_address = COALESCE(tokens.bonding_curve_address, EXCLUDED.bonding_curve_address),
                is_on_curve = EXCLUDED.is_on_curve OR tokens.is_on_curve,
                status = CASE
                    WHEN tokens.status = 'active' THEN 'active'
                    ELSE EXCLUDED.status
                END
            RETURNING *
        `;
        
        try {
            const source = 'helius';
            
            const result = await db.query(query, [
                mint, 
                name, 
                symbol, 
                source, 
                decimals, 
                supply, 
                blocktime, 
                status,
                metadataUri,
                imageUrl,
                bondingCurveAddress,
                isOnCurve
            ]);
            logger.info(`Created new token: ${mint} status=${status} curve=${isOnCurve}`);
            return result.rows[0];
        } catch (error: any) {
            logger.error(`Error creating token ${mint}:`, error);
            throw error;
        }
    }

    async findByMint(mint: string): Promise<Token | null> {
        const query = 'SELECT * FROM tokens WHERE mint = $1';
        const result = await db.query(query, [mint]);
        return result.rows[0] || null;
    }

    async searchTokens(query: string, limit: number = 50): Promise<TokenWithMarketCap[]> {
        const searchQuery = `
            SELECT t.*, 
                COALESCE(t.name, t.symbol, SUBSTRING(t.mint,1,4) || '…' || SUBSTRING(t.mint FROM LENGTH(t.mint)-3)) AS display_name,
                m.price_usd, m.marketcap, m.volume_24h, m.liquidity
            FROM tokens t
            LEFT JOIN LATERAL (
                SELECT * FROM marketcaps 
                WHERE token_id = t.id 
                ORDER BY timestamp DESC 
                LIMIT 1
            ) m ON true
            WHERE (
                LOWER(t.name) ILIKE $1 
                OR LOWER(t.symbol) ILIKE $1 
                OR LOWER(t.mint) ILIKE $1
            )
            ORDER BY 
                CASE 
                    WHEN LOWER(t.name) ILIKE $1 THEN 1
                    WHEN LOWER(t.symbol) ILIKE $1 THEN 2
                    WHEN LOWER(t.mint) ILIKE $1 THEN 3
                    ELSE 4
                END,
                COALESCE(t.blocktime, t.created_at) DESC
            LIMIT $2
        `;
        
        const searchTerm = `%${query.toLowerCase()}%`;
        const result = await db.query(searchQuery, [searchTerm, limit]);
        return result.rows;
    }

    async findFreshTokens(limit: number = 100, offset: number = 0): Promise<TokenWithMarketCap[]> {
        const query = `
            SELECT t.*, 
                COALESCE(t.name, t.symbol, SUBSTRING(t.mint,1,4) || '…' || SUBSTRING(t.mint FROM LENGTH(t.mint)-3)) AS display_name,
                m.price_usd, m.marketcap, m.volume_24h, m.liquidity
            FROM tokens t
            LEFT JOIN LATERAL (
                SELECT * FROM marketcaps 
                WHERE token_id = t.id 
                ORDER BY timestamp DESC 
                LIMIT 1
            ) m ON true
            WHERE t.status = 'fresh' 
            ORDER BY COALESCE(t.blocktime, t.created_at) DESC 
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

    async findTokensByStatus(status: string, limit: number = 100, offset: number = 0): Promise<Token[]> {
        const query = `
            SELECT * FROM tokens 
            WHERE status = $1 
            ORDER BY COALESCE(blocktime, created_at) DESC 
            LIMIT $2 OFFSET $3
        `;
        const result = await db.query(query, [status, limit, offset]);
        return result.rows;
    }

    async countActiveTokens(): Promise<number> {
        const query = `SELECT COUNT(*)::int AS count FROM tokens WHERE status = 'active'`;
        const result = await db.query(query);
        return result.rows[0]?.count || 0;
    }

    async updateTokenStatus(id: number, status: 'fresh' | 'active' | 'curve'): Promise<void> {
        const query = 'UPDATE tokens SET status = $1 WHERE id = $2';
        await db.query(query, [status, id]);
        logger.info(`Updated token ${id} status to ${status}`);
    }

    async updateTokenMetadata(
        id: number, 
        name?: string, 
        symbol?: string, 
        metadataUri?: string, 
        imageUrl?: string,
        bondingCurveAddress?: string,
        isOnCurve?: boolean
    ): Promise<void> {
        const updates: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (name !== undefined) {
            updates.push(`name = $${paramCount++}`);
            values.push(name);
        }
        if (symbol !== undefined) {
            updates.push(`symbol = $${paramCount++}`);
            values.push(symbol);
        }
        if (metadataUri !== undefined) {
            updates.push(`metadata_uri = $${paramCount++}`);
            values.push(metadataUri);
        }
        if (imageUrl !== undefined) {
            updates.push(`image_url = $${paramCount++}`);
            values.push(imageUrl);
        }
        if (bondingCurveAddress !== undefined) {
            updates.push(`bonding_curve_address = $${paramCount++}`);
            values.push(bondingCurveAddress);
        }
        if (isOnCurve !== undefined) {
            updates.push(`is_on_curve = $${paramCount++}`);
            values.push(isOnCurve);
        }

        if (updates.length === 0) return;

        updates.push(`updated_at = NOW()`);
        values.push(id);

        const query = `UPDATE tokens SET ${updates.join(', ')} WHERE id = $${paramCount}`;
        await db.query(query, values);
        logger.info(`Updated token ${id} metadata`);
    }

    async findMintsNeedingMetadata(limit: number): Promise<string[]> {
        const { rows } = await db.query(
            `
            SELECT mint
            FROM tokens
            WHERE
                (name IS NULL OR name = '')
                OR (symbol IS NULL OR symbol = '')
                OR (metadata_uri IS NULL OR metadata_uri = '')
                OR (image_url IS NULL OR image_url = '')
            ORDER BY blocktime DESC NULLS LAST
            LIMIT $1
            `,
            [limit]
        );
        return rows.map((r: any) => r.mint);
    }

    async updateTokenMetadataByMint(
        mint: string,
        fields: {
            name?: string; 
            symbol?: string;
            metadata_uri?: string; 
            image_url?: string;
        }
    ): Promise<void> {
        const q = `
            UPDATE tokens SET
                name = COALESCE($2, name),
                symbol = COALESCE($3, symbol),
                metadata_uri = COALESCE($4, metadata_uri),
                image_url = COALESCE($5, image_url)
            WHERE mint = $1
        `;
        await db.query(q, [
            mint,
            fields.name ?? null,
            fields.symbol ?? null,
            fields.metadata_uri ?? null,
            fields.image_url ?? null
        ]);
        logger.info(`Updated token ${mint} metadata`);
    }

    async getAllTokens(): Promise<TokenWithMarketCap[]> {
        const query = `
            SELECT t.*, m.price_usd, m.marketcap, m.volume_24h, m.liquidity
            FROM tokens t
            LEFT JOIN LATERAL (
                SELECT * FROM marketcaps 
                WHERE token_id = t.id 
                ORDER BY timestamp DESC 
                LIMIT 1
            ) m ON true
            ORDER BY t.created_at DESC
        `;
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
