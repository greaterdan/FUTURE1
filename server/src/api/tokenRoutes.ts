import { Router, Request, Response } from 'express';
import { tokenRepository } from '../db/repository';
import { logger } from '../utils/logger';

const router = Router();

// GET /tokens/fresh - Get latest fresh tokens, ordered by blocktime DESC
router.get('/fresh', async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 100;
        const offset = parseInt(req.query.offset as string) || 0;
        
        if (limit < 1 || limit > 1000) {
            return res.status(400).json({
                error: 'Invalid limit. Must be between 1 and 1000.'
            });
        }

        const [tokens, total] = await Promise.all([
            tokenRepository.findFreshTokens(limit, offset),
            tokenRepository.countFreshTokens()
        ]);
        
        logger.info(`Fresh tokens fetched successfully. Count: ${total}`);
        
        return res.json({
            total,
            items: tokens
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

export default router;
