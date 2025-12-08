import twilio from 'twilio';
import { config } from '../config';

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
            // Ensure both from and to have whatsapp: prefix
            const fromNumber = this.fromNumber.startsWith('whatsapp:')
                ? this.fromNumber
                : `whatsapp:${this.fromNumber}`;
            const toNumber = to.startsWith('whatsapp:')
                ? to
                : `whatsapp:${to}`;

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
            // Ensure both from and to have whatsapp: prefix
            const fromNumber = this.fromNumber.startsWith('whatsapp:')
                ? this.fromNumber
                : `whatsapp:${this.fromNumber}`;
            const toNumber = to.startsWith('whatsapp:')
                ? to
                : `whatsapp:${to}`;

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

    /**
     * Send multiple images
     */
    async sendMultipleImages(to: string, imageUrls: string[], captions?: string[]): Promise<string[]> {
        const messageIds: string[] = [];

        for (let i = 0; i < imageUrls.length; i++) {
            const caption = captions?.[i];
            const sid = await this.sendImageMessage(to, imageUrls[i], caption);
            messageIds.push(sid);

            // Small delay between messages to avoid rate limiting
            await this.delay(500);
        }

        return messageIds;
    }

    /**
     * Send a message with interactive buttons (using templates or list messages)
     */
    async sendWelcomeMessage(to: string): Promise<string> {
        const welcomeText = `🎫 *ברוכים הבאים ל-TicketAgent!*

אני כאן לעזור לך למצוא כרטיסים למשחקים הכי חמים.

*איך להשתמש?*
פשוט כתוב לי מה אתה מחפש, לדוגמה:
• "כרטיסים לארסנל"
• "ליברפול נגד מנצ'סטר יונייטד"
• "משחקים של ברצלונה בדצמבר"
• "VIP לאלקלאסיקו"

💡 *טיפ:* אתה יכול לחפש לפי קבוצה, תאריך, סוג כרטיס (VIP/רגיל) או כל שילוב ביניהם!`;

        return this.sendTextMessage(to, welcomeText);
    }

    /**
     * Send "no offers found" message
     */
    async sendNoOffersMessage(to: string, query: string): Promise<string> {
        const message = `🎫 *TicketAgent*

לא מצאתי כרטיסים עבור "${query}" 😔

*נסה:*
• שם קבוצה באנגלית (Chelsea, Arsenal)
• חיפוש כללי יותר
• בלי תאריך ספציפי

שלח *עזרה* לטיפים נוספים`;

        return this.sendTextMessage(to, message);
    }

    /**
     * Send "processing" message
     */
    async sendProcessingMessage(to: string): Promise<string> {
        return this.sendTextMessage(to, '🔍 מחפש כרטיסים...');
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export singleton instance
export const twilioService = new TwilioService();
