import { UserSession } from '../sessionService';
import { llmService, LlmAnalysis } from '../external/llmService';

export class IntentRecognizer {
    private GREETING_KEYWORDS = ['היי', 'הי', 'שלום', 'מה קורה', 'אהלן', 'hi', 'hello'];

    /**
     * Fast-track check for simple greetings or special commands
     */
    async recognize(text: string, session: UserSession): Promise<LlmAnalysis | null> {
        const normalizedText = text.trim().toLowerCase();

        // 1. Reset command
        if (normalizedText === 'מחק') {
            return { intent: 'SUPPORT', message: 'מחק', slugs: [] }; // Special signal for delete
        }

        // 2. Explicit Search Prefix
        const IS_EXPLICIT_SEARCH = normalizedText.startsWith('חפש לי הצעות') || normalizedText.startsWith('תמצא לי הצעות');
        if (IS_EXPLICIT_SEARCH) {
            // We return a partially filled analysis to skip intent classification in LLM
            return await llmService.analyzeMessage(text, session, 'SEARCH');
        }

        // 3. Simple Keyword Greeting
        if (this.GREETING_KEYWORDS.includes(normalizedText)) {
            return { intent: 'GREETING', message: '', slugs: [] };
        }

        // 4. Fallback to full LLM analysis
        return await llmService.analyzeMessage(text, session);
    }
}

export const intentRecognizer = new IntentRecognizer();
