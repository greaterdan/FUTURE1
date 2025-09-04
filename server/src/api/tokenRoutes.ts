import { Router, Request, Response } from 'express';
import { tokenRepository } from '../db/repository';
import { logger } from '../utils/logger';

const router = Router();

// GET /tokens/fresh - Get latest fresh and curve tokens, ordered by blocktime DESC
router.get('/fresh', async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 100;
        const offset = parseInt(req.query.offset as string) || 0;
        
        if (limit < 1 || limit > 1000) {
            return res.status(400).json({
                error: 'Invalid limit. Must be between 1 and 1000.'
            });
        }

        // Get both fresh and curve tokens
        const [freshTokens, curveTokens] = await Promise.all([
            tokenRepository.findFreshTokens(limit, offset),
            tokenRepository.findTokensByStatus('curve', limit, offset)
        ]);
        
        // Combine and sort by blocktime
        const allTokens = [...freshTokens, ...curveTokens]
            .sort((a, b) => {
                const aTime = a.blocktime || a.created_at;
                const bTime = b.blocktime || b.created_at;
                return new Date(bTime).getTime() - new Date(aTime).getTime();
            })
            .slice(0, limit);
        
        const total = freshTokens.length + curveTokens.length;
        
        logger.info(`Fresh/curve tokens fetched successfully. Count: ${total}`);
        
        return res.json({
            total,
            items: allTokens
        });
        
    } catch (error) {
        logger.error('Error fetching fresh tokens:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /tokens/active - Get latest active tokens, ordered by marketcap DESC
router.get('/active', async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 100;
        const offset = parseInt(req.query.offset as string) || 0;
        
        if (limit < 1 || limit > 1000) {
            return res.status(400).json({
                error: 'Invalid limit. Must be between 1 and 1000.'
            });
        }

        const [tokens, total] = await Promise.all([
            tokenRepository.findActiveTokens(limit, offset),
            tokenRepository.countActiveTokens()
        ]);
        
        return res.json({
            total,
            items: tokens
        });
        
    } catch (error) {
        logger.error('Error fetching active tokens:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /tokens - Get all tokens (for debugging/admin purposes)
router.get('/', async (_req: Request, res: Response) => {
    try {
        const tokens = await tokenRepository.getAllTokens();
        
        return res.json({
            total: tokens.length,
            items: tokens
        });
        
    } catch (error) {
        logger.error('Error fetching all tokens:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /tokens/search - Search tokens by name, symbol, or mint address
router.get('/search', async (req: Request, res: Response) => {
    try {
        const query = req.query.q as string;
        const limit = parseInt(req.query.limit as string) || 50;
        
        if (!query || query.trim().length < 2) {
            return res.status(400).json({
                error: 'Search query must be at least 2 characters long.'
            });
        }
        
        if (limit < 1 || limit > 100) {
            return res.status(400).json({
                error: 'Invalid limit. Must be between 1 and 100.'
            });
        }
        
        const tokens = await tokenRepository.searchTokens(query.trim(), limit);
        
        logger.info(`Token search completed. Query: "${query}", Results: ${tokens.length}`);
        
        return res.json({
            query: query.trim(),
            total: tokens.length,
            items: tokens
        });
        
    } catch (error) {
        logger.error('Error searching tokens:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /tokens/:mint/holders - Top holders of a mint
router.get('/:mint/holders', async (req: Request, res: Response) => {
    try {
        const { mint } = req.params;
        const limit = Number(req.query.limit ?? 50);
        const rows = await tokenRepository.getTopHolders(mint, limit);
        res.json({ mint, holders: rows });
    } catch (e) {
        logger.error('Error fetching holders:', e);
        res.status(500).json({ error: "failed to load holders" });
    }
});

// GET /wallet/:owner/positions - Wallet positions
router.get('/wallet/:owner/positions', async (req: Request, res: Response) => {
    try {
        const { owner } = req.params;
        const min = Number(req.query.min ?? 0);
        const rows = await tokenRepository.getWalletPositions(owner, min);
        res.json({ owner, positions: rows });
    } catch (e) {
        logger.error('Error fetching wallet positions:', e);
        res.status(500).json({ error: "failed to load positions" });
    }
});

export default router;
