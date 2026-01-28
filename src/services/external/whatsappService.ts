import { twilioService } from './twilioService';
import metaWhatsAppService from './metaWhatsAppService';

/**
 * Unified WhatsApp Service
 * Routes messages to the appropriate provider (Twilio or Meta) based on phone number format
 */
class WhatsAppService {
    /**
     * Send a text message via the appropriate WhatsApp provider
     * @param to - Recipient phone number (with whatsapp: prefix)
     * @param message - Text message to send
     */
    async sendTextMessage(to: string, message: string): Promise<boolean> {
        try {
            // Extract the actual phone number (remove whatsapp: prefix)
            const phoneNumber = to.replace('whatsapp:', '');

            // For now, we'll use Meta API for all messages
            // You can add logic here to determine which provider to use
            // For example, check if the number is in a specific format or range

            console.log(`[WhatsApp Service] Sending message to ${phoneNumber}`);
            return await metaWhatsAppService.sendTextMessage(phoneNumber, message);

        } catch (error: any) {
            console.error('[WhatsApp Service] Error sending message:', error.message);
            return false;
        }
    }
}

export const whatsappService = new WhatsAppService();
