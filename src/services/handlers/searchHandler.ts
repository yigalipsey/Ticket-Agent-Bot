import { Offer } from '../../types';
import { apiService } from '../external/apiService';
import { whatsappService } from '../external/whatsappService';
import { teamExtractor } from '../logic/teamExtractor';
import { responseFormatter } from '../logic/responseFormatter';
import { BOT_MESSAGES } from '../../config/messages';
import chalk from 'chalk';

export class SearchHandler {
    /**
     * Orchestrates the full search and results delivery process
     */
    async handleSearch(userPhone: string, slugs: string[], customMessage?: string, onStatus?: (event: string, data: any) => void): Promise<void> {
        const matchSlug = teamExtractor.buildMatchSlug(slugs);
        if (!matchSlug) return;

        const teamAName = teamExtractor.getTeamNameBySlug(slugs[0]);
        const teamBName = teamExtractor.getTeamNameBySlug(slugs[1]);
        const confirmation = customMessage || BOT_MESSAGES.SEARCH_SUCCESS(teamAName, teamBName);

        console.log(chalk.green(`[Search] Triggered for ${userPhone}: ${matchSlug}`));
        await whatsappService.sendTextMessage(userPhone, confirmation);

        let offersFound: Offer[] = [];
        let totalSent = 0;

        // Start SSE Stream
        apiService.streamOffersBySlug(
            matchSlug,
            async (offer) => {
                offersFound.push(offer);
                if (onStatus) onStatus('offer', offer);

                // Send in batches of 3
                if (offersFound.length >= 3) {
                    const batch = offersFound.splice(0, 3);
                    const startIndex = totalSent + 1; // Start numbering from the next offer
                    totalSent += batch.length;
                    const text = responseFormatter.formatOffersBatch(batch, startIndex);
                    if (onStatus) onStatus('status', { message: `נשלחה הודעת וואטסאפ עם ${batch.length} הצעות.` });
                    await whatsappService.sendTextMessage(userPhone, text);
                }
            },
            async () => {
                // Finalize remaining offers
                if (offersFound.length > 0) {
                    const startIndex = totalSent + 1; // Start numbering from the next offer
                    totalSent += offersFound.length;
                    const text = responseFormatter.formatOffersBatch(offersFound, startIndex);
                    if (onStatus) onStatus('status', { message: `נשלחה הודעת וואטסאפ אחרונה עם ${offersFound.length} הצעות.` });
                    await whatsappService.sendTextMessage(userPhone, text);
                    offersFound = [];
                }

                const summary = responseFormatter.formatSearchSummary(totalSent);
                if (onStatus) onStatus('status', { message: summary });
                await whatsappService.sendTextMessage(userPhone, summary);
            },
            async (error) => {
                console.error(chalk.red(`[Search Error]`), error);
                if (onStatus) onStatus('error', { message: 'חיפוש הכרטיסים הופסק עקב שגיאה' });
                if (totalSent === 0) {
                    await whatsappService.sendTextMessage(userPhone, `משהו השתבש בחיפוש הכרטיסים. נסה שוב בעוד כמה דקות.`);
                }
            }
        );
    }
}

export const searchHandler = new SearchHandler();
