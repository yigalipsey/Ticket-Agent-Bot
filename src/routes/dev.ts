import { Router, Request, Response } from 'express';
import { messageHandler } from '../services/handlers/messageHandler';
import { sessionService } from '../services/sessionService';
import chalk from 'chalk';

const router = Router();

/**
 * GET /dev/session
 */
router.get('/session', (req: Request, res: Response) => {
    const phone = (req.query.phone as string) || 'dev-user';
    const session = sessionService.getSession(phone);
    res.json(session);
});

/**
 * POST/GET /dev/reset
 */
router.all('/reset', (req: Request, res: Response) => {
    const phone = (req.query.phone as string) || (req.body.phone as string) || 'dev-user';
    sessionService.clearSession(phone);
    res.json({ status: 'cleared', phone });
});

/**
 * GET /dev/extract
 * Now a "Skinny Router" - Simply provides SSE infrastructure and calls the Brain (MessageHandler)
 */
router.get('/extract', async (req: Request, res: Response) => {
    const text = req.query.text as string;
    const phone = 'dev-user';

    if (!text) {
        return res.status(400).json({ error: 'Missing "text" query parameter' });
    }

    // 1. OPEN SSE Infrastructure
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendEvent = (event: string, data: any) => {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // 2. Call the Central Brain (MessageHandler)
    // We pass our sendEvent as a callback so we can show the user what's happening
    try {
        await messageHandler.handleMessage(
            { Body: text, From: phone, To: 'dev', MessageSid: 'dev-' + Date.now() },
            (event, data) => sendEvent(event, data)
        );
    } catch (err: any) {
        console.error(chalk.red('[Dev Route Error]'), err.message);
        sendEvent('error', { message: err.message });
    } finally {
        res.end();
    }
});

export default router;
