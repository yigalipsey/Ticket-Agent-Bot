import { Router, Request, Response } from 'express';
import { messageHandler } from '../services/messageHandler';
import { TwilioWebhookBody } from '../types';

const router = Router();

/**
 * POST /webhook
 * Twilio WhatsApp webhook endpoint
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const webhookBody: TwilioWebhookBody = req.body;

        console.log('[Webhook] Received:', {
            from: webhookBody.From,
            body: webhookBody.Body?.substring(0, 50),
        });

        // Respond immediately to Twilio (within 15 seconds)
        res.status(200).send('OK');

        // Process message asynchronously
        messageHandler.handleMessage(webhookBody).catch((error) => {
            console.error('[Webhook] Error handling message:', error);
        });
    } catch (error) {
        console.error('[Webhook] Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

/**
 * GET /webhook
 * Health check for the webhook
 */
router.get('/', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        message: 'WhatsApp Bot Webhook is running',
        timestamp: new Date().toISOString(),
    });
});

export default router;
