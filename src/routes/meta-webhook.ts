import { Router, Request, Response } from 'express';
import metaWhatsAppService from '../services/external/metaWhatsAppService';
import { messageHandler } from '../services/handlers/messageHandler';
import { TwilioWebhookBody } from '../types';

const router = Router();

/**
 * GET /meta-webhook
 * Meta WhatsApp Webhook Verification
 */
router.get('/', (req: Request, res: Response) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('[Meta Webhook] Verification request:', {
        mode,
        token,
        challenge
    });

    // Verify token (you can set this in Meta dashboard)
    const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'ticketagent_verify_token_2026';

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('[Meta Webhook] ✅ Webhook verified successfully!');
        res.status(200).send(challenge);
    } else {
        console.log('[Meta Webhook] ❌ Verification failed');
        res.sendStatus(403);
    }
});

/**
 * POST /meta-webhook
 * Meta WhatsApp incoming messages
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        console.log('='.repeat(80));
        console.log('[Meta Webhook] 📨 POST REQUEST RECEIVED AT:', new Date().toISOString());
        console.log('='.repeat(80));
        console.log('[Meta Webhook] Full body:');
        console.log(JSON.stringify(req.body, null, 2));
        console.log('='.repeat(80));

        // Respond immediately to Meta (must be within 20 seconds)
        res.status(200).send('EVENT_RECEIVED');

        // Extract message data
        const body = req.body;

        if (body.object === 'whatsapp_business_account') {
            body.entry?.forEach((entry: any) => {
                entry.changes?.forEach(async (change: any) => {
                    if (change.field === 'messages') {
                        const value = change.value;

                        console.log('\n🔔 [Meta Webhook] Message Details:');
                        console.log('├─ Metadata:', value.metadata);
                        console.log('├─ Contacts:', value.contacts);
                        console.log('└─ Messages:', value.messages);

                        // Process each message
                        if (value.messages) {
                            for (const message of value.messages) {
                                console.log('\n📩 New Message:');
                                console.log('├─ From:', message.from);
                                console.log('├─ Message ID:', message.id);
                                console.log('├─ Timestamp:', message.timestamp);
                                console.log('├─ Type:', message.type);

                                if (message.type === 'text') {
                                    console.log('└─ Text:', message.text.body);

                                    // Convert Meta webhook format to Twilio format for messageHandler
                                    const webhookBody: TwilioWebhookBody = {
                                        Body: message.text.body,
                                        From: `whatsapp:${message.from}`,
                                        To: `whatsapp:${value.metadata.display_phone_number}`,
                                        MessageSid: message.id,
                                    };

                                    // Mark message as read immediately
                                    await metaWhatsAppService.markAsRead(message.id);

                                    // Process message through messageHandler (same as Twilio)
                                    // The whatsappService will handle sending messages via Meta API
                                    await messageHandler.handleMessage(webhookBody);

                                } else if (message.type === 'image') {
                                    console.log('└─ Image ID:', message.image.id);
                                    // TODO: Handle image messages
                                } else if (message.type === 'audio') {
                                    console.log('└─ Audio ID:', message.audio.id);
                                    // TODO: Handle audio messages
                                }
                            }
                        }

                        // Process statuses (delivery, read receipts, etc.)
                        value.statuses?.forEach((status: any) => {
                            console.log('\n📊 Status Update:');
                            console.log('├─ Message ID:', status.id);
                            console.log('├─ Status:', status.status);
                            console.log('└─ Timestamp:', status.timestamp);
                        });
                    }
                });
            });
        }
    } catch (error) {
        console.error('[Meta Webhook] ❌ Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

export default router;
