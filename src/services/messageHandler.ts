import { TwilioWebhookBody, Offer } from '../types';
import { apiService } from './apiService';
import { twilioService } from './twilioService';

/**
 * Main message handler
 */
export class MessageHandler {
    async handleMessage(webhookBody: TwilioWebhookBody): Promise<void> {
        const { Body: messageText, From: userPhone } = webhookBody;

        console.log(`[Handler] Received message from ${userPhone}: "${messageText}"`);

        if (this.isSpecialCommand(messageText)) {
            await this.handleSpecialCommand(messageText, userPhone);
            return;
        }

        try {
            await twilioService.sendProcessingMessage(userPhone);

            console.log('[Handler] Calling API...');
            const response = await apiService.searchOffers(messageText, userPhone);
            console.log('[Handler] API Response:', JSON.stringify(response, null, 2));

            if (!response.success || !response.data || response.data.length === 0) {
                await twilioService.sendNoOffersMessage(userPhone, messageText);
                return;
            }

            const offersText = this.formatOffersAsText(response.data, messageText);
            await twilioService.sendTextMessage(userPhone, offersText);

        } catch (error) {
            console.error('[Handler] Error processing message:', error);
            await twilioService.sendTextMessage(
                userPhone,
                '😓 אופס! משהו השתבש. נסה שוב בעוד רגע.'
            );
        }
    }

    private formatOffersAsText(offers: Offer[], query: string): string {
        const limitedOffers = offers.slice(0, 5);

        let text = `🎫 *TicketAgent*\n\n`;
        text += `מצאתי *${offers.length} כרטיסים* עבור "${query}"\n\n`;

        limitedOffers.forEach((offer, index) => {
            const ticketType = offer.ticketType === 'vip' || offer.isHospitality
                ? '👑 VIP'
                : '🎟️ רגיל';

            const rating = offer.owner.externalRating
                ? ` • ⭐ ${offer.owner.externalRating.rating}`
                : '';

            const price = this.formatPrice(offer.price, offer.currency);

            text += `*${index + 1}. ${offer.owner.name}*${rating}\n`;
            text += `${ticketType} • ${price}\n`;
            text += `${offer.url}\n\n`;
        });

        text += `🌐 *כל ההצעות באתר:*\nhttps://www.ticketagent.co.il/`;

        return text;
    }

    private formatPrice(price: number, currency: string): string {
        const symbols: Record<string, string> = {
            'ILS': '₪',
            'EUR': '€',
            'USD': '$',
            'GBP': '£',
        };
        const symbol = symbols[currency] || currency;
        return `${price.toLocaleString()} ${symbol}`;
    }

    private isSpecialCommand(text: string): boolean {
        const commands = ['התחל', 'start', 'עזרה', 'help', 'שלום', 'היי', 'hi', 'hello'];
        return commands.includes(text.toLowerCase().trim());
    }

    private async handleSpecialCommand(command: string, userPhone: string): Promise<void> {
        const lowerCommand = command.toLowerCase().trim();

        if (['התחל', 'start', 'שלום', 'היי', 'hi', 'hello'].includes(lowerCommand)) {
            const welcome = `🎫 *TicketAgent*

היי! 👋
אני עוזר לך למצוא כרטיסים למשחקי כדורגל

*איך זה עובד?*
כתוב לי שם קבוצה או משחק ואני אמצא לך את ההצעות הטובות ביותר

*דוגמאות:*
• צ'לסי
• ארסנל נגד ליברפול
• ריאל מדריד VIP

נסה עכשיו! ⚽`;
            await twilioService.sendTextMessage(userPhone, welcome);

        } else if (['עזרה', 'help'].includes(lowerCommand)) {
            const help = `🎫 *עזרה*

*חיפוש כרטיסים:*
• שם קבוצה: "מנצ'סטר יונייטד"
• משחק: "ריאל מדריד נגד ברצלונה"
• VIP: "VIP לליברפול"

*פקודות:*
• התחל - הודעת פתיחה
• עזרה - המדריך הזה

*צור קשר:*
support@ticketagent.co.il`;
            await twilioService.sendTextMessage(userPhone, help);
        }
    }
}

export const messageHandler = new MessageHandler();
