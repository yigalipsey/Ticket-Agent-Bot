import twilio from 'twilio';
import { config } from '../../config';

/**
 * Service for sending messages via Twilio WhatsApp
 */
export class TwilioService {
    private client: twilio.Twilio;
    private fromNumber: string;

    constructor() {
        this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
        this.fromNumber = config.twilio.whatsappNumber;
    }

    /**
     * Send a text message
     */
    async sendTextMessage(to: string, body: string): Promise<string> {
        try {
            // Clean prefixes and ensure exactly one 'whatsapp:' prefix
            const cleanFrom = this.fromNumber.replace(/^whatsapp:/, '');
            const cleanTo = to.replace(/^whatsapp:/, '');

            const fromNumber = `whatsapp:${cleanFrom}`;
            const toNumber = `whatsapp:${cleanTo}`;

            // Mocking for Dev testing
            if (cleanTo === 'dev-user' || cleanTo === 'dev') {
                console.log(`[Twilio Mock] Msg to Dev: "${body.substring(0, 50)}..."`);
                return 'MockSid_' + Date.now();
            }

            console.log(`[Twilio] Sending message from: ${fromNumber} to: ${toNumber}`);

            const message = await this.client.messages.create({
                body,
                from: fromNumber,
                to: toNumber,
            });

            console.log(`[Twilio] Sent text message: ${message.sid}`);
            return message.sid;
        } catch (error) {
            console.error('[Twilio] Error sending text message:', error);
            throw error;
        }
    }

    /**
     * Send an image message with optional caption
     */
    async sendImageMessage(to: string, imageUrl: string, caption?: string): Promise<string> {
        try {
            const fromNumber = this.fromNumber.startsWith('whatsapp:')
                ? this.fromNumber
                : `whatsapp:${this.fromNumber}`;
            const toNumber = to.startsWith('whatsapp:')
                ? to
                : `whatsapp:${to}`;

            if (to.includes('dev-user') || to.includes('dev')) {
                console.log(`[Twilio Mock Image] to Dev: ${imageUrl} (caption: ${caption})`);
                return 'MockImageSid_' + Date.now();
            }

            const message = await this.client.messages.create({
                body: caption || '',
                from: fromNumber,
                to: toNumber,
                mediaUrl: [imageUrl],
            });

            console.log(`[Twilio] Sent image message: ${message.sid}`);
            return message.sid;
        } catch (error) {
            console.error('[Twilio] Error sending image message:', error);
            throw error;
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export singleton instance
export const twilioService = new TwilioService();
