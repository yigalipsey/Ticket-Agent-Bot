import { Offer } from '../../types';

export class ResponseFormatter {
    /**
     * Formats a batch of ticket offers for WhatsApp
     * @param offers - Array of offers to format
     * @param startIndex - Starting index for numbering (default: 1)
     */
    formatOffersBatch(offers: Offer[], startIndex: number = 1): string {
        return offers.map((o, index) => {
            const offerNumber = startIndex + index;
            const price = `${o.price}${o.currency === 'ILS' ? '₪' : o.currency}`;
            const link = o.url || 'https://www.ticketagent.co.il/';
            const type = o.ticketType === 'vip' ? 'VIP / Hospitality' : 'כרטיס סטנדרטי';
            const supplier = o.owner?.name || 'TicketAgent';

            return `*הצעה #${offerNumber}*\n🎫 ${type}\n💰 מחיר: ${price}\n🏢 ספק: ${supplier}\n🔗 לקנייה: ${link}`;
        }).join('\n\n---\n\n');
    }

    /**
     * Formats the final summary message after a search
     */
    formatSearchSummary(totalFound: number): string {
        if (totalFound === 0) {
            return `לצערי לא מצאתי כרטיסים זמינים למשחק הזה כרגע. 😓`;
        }
        return `✅ סיימתי לסרוק. מצאתי בסך הכל ${totalFound} הצעות. תהנו! 🏟️`;
    }
}

export const responseFormatter = new ResponseFormatter();
