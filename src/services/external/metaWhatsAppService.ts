import axios from 'axios';

/**
 * Meta WhatsApp Business API Service
 * Handles sending messages via Meta's WhatsApp Cloud API
 */
class MetaWhatsAppService {
    private accessToken: string;
    private phoneNumberId: string;
    private apiVersion: string = 'v21.0';

    constructor() {
        this.accessToken = process.env.META_ACCESS_TOKEN || '';
        this.phoneNumberId = process.env.META_PHONE_NUMBER_ID || '';

        if (!this.accessToken) {
            console.warn('⚠️ META_ACCESS_TOKEN not set in environment variables');
        }
        if (!this.phoneNumberId) {
            console.warn('⚠️ META_PHONE_NUMBER_ID not set in environment variables');
        }
    }

    /**
     * Send a text message via Meta WhatsApp API
     * @param to - Recipient phone number (with country code, without +)
     * @param message - Text message to send
     */
    async sendTextMessage(to: string, message: string): Promise<boolean> {
        try {
            if (!this.accessToken || !this.phoneNumberId) {
                console.error('❌ Meta WhatsApp credentials not configured');
                return false;
            }

            const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;

            const payload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: to,
                type: 'text',
                text: {
                    preview_url: false,
                    body: message
                }
            };

            console.log(`📤 [Meta WhatsApp] Sending message to ${to}:`, message);

            const response = await axios.post(url, payload, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ [Meta WhatsApp] Message sent successfully:', response.data);
            return true;

        } catch (error: any) {
            console.error('❌ [Meta WhatsApp] Error sending message:', {
                error: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            return false;
        }
    }

    /**
     * Mark a message as read
     * @param messageId - The message ID to mark as read
     */
    async markAsRead(messageId: string): Promise<boolean> {
        try {
            if (!this.accessToken || !this.phoneNumberId) {
                console.error('❌ Meta WhatsApp credentials not configured');
                return false;
            }

            const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;

            const payload = {
                messaging_product: 'whatsapp',
                status: 'read',
                message_id: messageId
            };

            await axios.post(url, payload, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ [Meta WhatsApp] Message marked as read:', messageId);
            return true;

        } catch (error: any) {
            console.error('❌ [Meta WhatsApp] Error marking message as read:', error.message);
            return false;
        }
    }
}

export default new MetaWhatsAppService();
