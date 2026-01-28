import { TwilioWebhookBody } from '../../types';
import { whatsappService } from '../external/whatsappService';
import { teamExtractor } from '../logic/teamExtractor';
import { sessionService } from '../sessionService';
import { intentRecognizer } from '../logic/intentRecognizer';
import { searchHandler } from './searchHandler';
import { BOT_MESSAGES } from '../../config/messages';
import chalk from 'chalk';

type StatusCallback = (event: string, data: any) => void;

/**
 * Main message handler - The "Router" of the brain.
 * Delegates specialized tasks to other services.
 */
export class MessageHandler {
    /**
     * Primary entry point for any user message (WhatsApp or Dev)
     */
    async handleMessage(webhookBody: TwilioWebhookBody, onStatus?: StatusCallback): Promise<void> {
        const { Body: messageText, From: userPhone } = webhookBody;

        console.log(chalk.hex('#FFA500')(`\n[Input] (${userPhone}): "${messageText}"`));

        try {
            const session = sessionService.getSession(userPhone);

            // 1. Recognize Intent (Quick check for greetings/commands + LLM)
            console.log(chalk.gray(` [System] Analyzing intent...`));
            const analysis = await intentRecognizer.recognize(messageText, session);

            if (!analysis) return;

            // 2. Handle System Commands (Delete/Reset)
            if (analysis.intent === 'SUPPORT' && analysis.message === 'מחק') {
                sessionService.clearSession(userPhone);
                const resetMsg = '🗑️ הקאש אופס בהצלחה! השיחה הבאה תיחשב כשיחה חדשה.';
                if (onStatus) onStatus('status', { message: resetMsg });
                await whatsappService.sendTextMessage(userPhone, resetMsg);
                return;
            }

            sessionService.addMessage(userPhone, 'user', messageText);

            // 3. Extract and Context Merge
            let slugs = teamExtractor.extractSlugs(messageText);

            // Merge with Session (Contextual memory)
            if (analysis.slugs && analysis.slugs.length > 0) {
                slugs = [...new Set([...slugs, ...analysis.slugs])];
            }
            if (slugs.length === 1 && session.identifiedSlugs.length > 0) {
                const combined = [...new Set([slugs[0], ...session.identifiedSlugs])];
                if (combined.length >= 2) slugs = combined.slice(0, 2);
            }

            if (slugs.length > 0) sessionService.updateSlugs(userPhone, slugs);

            // 4. Dispatch based on State

            // IF SEARCH (We have enough info)
            if (slugs.length >= 2) {
                const teamAName = teamExtractor.getTeamNameBySlug(slugs[0]);
                const teamBName = teamExtractor.getTeamNameBySlug(slugs[1]);
                const searchMsg = analysis.message || BOT_MESSAGES.SEARCH_SUCCESS(teamAName, teamBName);

                if (onStatus) onStatus('status', { message: searchMsg, slugs });
                await searchHandler.handleSearch(userPhone, slugs, searchMsg, onStatus);
                return;
            }

            // IF GREETING, UNCLEAR or REPLIES
            let reply = analysis.message;
            if (analysis.intent === 'UNCLEAR') {
                reply = 'אופס, לא ממש הבנתי למה הכוונה. 😅\nאפשר לחפש כרטיסים למשל ככה: *"חפש לי הצעות לריאל מדריד נגד סיטי"*';
            } else if (analysis.intent === 'GREETING') {
                if (sessionService.shouldSendPrimaryGreeting(userPhone)) {
                    // Send branded opening only once every 15 minutes
                    const greetings = BOT_MESSAGES.GREETING_PRIMARY_LIST;
                    reply = greetings[Math.floor(Math.random() * greetings.length)];
                    sessionService.setGreetingTime(userPhone);
                } else {
                    // It's a repeat greeting within 15m -> Use LLM's natural response
                    reply = analysis.message || BOT_MESSAGES.GREETING_SECONDARY;
                }
            } else if (!reply) {
                // Fallback for missing teams or unclear intent
                const greetings = BOT_MESSAGES.GREETING_PRIMARY_LIST;
                const fallback = greetings[Math.floor(Math.random() * greetings.length)];
                reply = (slugs.length === 1 ? BOT_MESSAGES.SEARCH_SINGLE_TEAM(slugs[0]) : fallback);
            }

            sessionService.addMessage(userPhone, 'bot', reply);
            if (onStatus) onStatus('status', { intent: analysis.intent, message: reply });
            await whatsappService.sendTextMessage(userPhone, reply);

        } catch (error: any) {
            console.error(chalk.red('[MessageHandler Error]'), error.message);
            const errMsg = `❌ אופס, משהו השתבש בעיבוד ההודעה. נסה שוב בעוד רגע.`;
            if (onStatus) onStatus('error', { message: error.message });
            await whatsappService.sendTextMessage(userPhone, errMsg);
        }
    }
}

export const messageHandler = new MessageHandler();
