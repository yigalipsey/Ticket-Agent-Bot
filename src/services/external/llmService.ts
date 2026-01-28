import { GoogleGenAI } from "@google/genai";
import { config } from '../../config';
import { teamExtractor } from '../logic/teamExtractor';
import { UserSession } from "../sessionService";
import chalk from 'chalk';

export interface LlmAnalysis {
    intent: 'GREETING' | 'SEARCH' | 'SUPPORT' | 'UNCLEAR';
    message: string;
    slugs: string[];
}

export class LlmService {
    private client: any = null;
    private systemInstruction: string = `
אתה העוזר החכם של TicketAgent ⚽. 
תפקידך: למצוא הצעות למשחקי כדורגל בחו"ל בזמן אמת ע"י סריקת ספקים ישראלים ובינלאומיים.

חוקי הפורמט:
תמיד ענה ב-JSON נקי (בלי תגיות markdown) בפורמט הבא:
{
  "intent": "GREETING" | "SEARCH" | "SUPPORT" | "UNCLEAR",
  "message": "string",
  "slugs": []
}

לוגיקה:
1. אם המשתמש מברך (intent: GREETING): תמיד תכלול בתשובה שלך את הדוגמא המדויקת: *"תמצא לי הצעות לריאל מדריד נגד ליברפול"* כדרך הנכונה לחפש.
2. אם המשתמש כבר מחפש משחק (intent: SEARCH): ענה בקיצור ובאדיבות שאסרוק את המחירים עבורו, אל תכלול את דוגמת החיפוש שוב.
3. אם ההודעה היא ג'יבריש (כמו 'אקראקרא'), טקסט לא מובן, או נושא שממש לא קשור לכדורגל/כרטיסים: החזר intent: UNCLEAR.
4. חלץ סלאגים רק מהרשימה המורשית.
`;

    constructor() {
        const apiKey = config.api.geminiKey || process.env.GEMINI_API_KEY;
        if (apiKey) {
            // האתחול לפי הדוגמה ששלחת
            this.client = new GoogleGenAI({
                apiKey: apiKey
            });
        }
    }

    async analyzeMessage(message: string, session: UserSession, forcedIntent?: 'GREETING' | 'SEARCH' | 'SUPPORT'): Promise<LlmAnalysis> {
        if (!this.client) {
            return { intent: 'SEARCH', message: '', slugs: [] };
        }

        const contents = [
            { role: 'user', parts: [{ text: `System Instruction: ${this.systemInstruction}` }] },
            { role: 'model', parts: [{ text: 'Understood. I will act as TicketAgent and always return JSON.' }] },
            ...session.messages.map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.text }]
            })),
            { role: 'user', parts: [{ text: message }] }
        ];

        try {
            let data: any = { intent: forcedIntent || 'SEARCH', slugs: [], message: '' };

            if (!forcedIntent) {
                console.log(chalk.yellow(` [LLM Step 1] Analyzing with gemini-2.0-flash...`));

                const result = await this.client.models.generateContent({
                    model: "gemini-2.0-flash",
                    contents: contents,
                    config: {
                        responseMimeType: "application/json"
                    }
                });

                const responseText = result.text || '';
                const cleanJson = responseText.replace(/```json|```/g, '').trim();
                data = JSON.parse(cleanJson || '{}');
            }

            if (data.intent !== 'SEARCH' || !slugsNeeded(message, data)) {
                console.log(chalk.magenta(` [LLM Result] Intent: ${data.intent}, Msg: "${data.message?.substring(0, 20)}..."`));
                return {
                    intent: data.intent || 'SEARCH',
                    message: data.message || '',
                    slugs: data.slugs || []
                };
            }

            // שלב 2: חילוץ עמוק אם חסרים סלאגים
            console.log(chalk.yellow(` [LLM Step 2] Fetching Slugs with 2.0-flash...`));
            const availableTeams = teamExtractor.getAvailableTeams();
            const teamsListStr = availableTeams.map(t => `${t.name_he} (${t.slug})`).join(', ');

            const searchPrompt = `
Extract exactly TWO slugs for: "${message}"
Valid Choices (Hebrew Name + Slug): ${teamsListStr}

Return JSON: {"slugs": ["slug1", "slug2"], "message": "string"}
CRITICAL: In your "message", use the Hebrew names (name_he) of the teams, NOT the English slugs.
Example: "כבר בודק לך מחירים למשחק של ארסנל נגד אינטר..."
`;

            const searchResult = await this.client.models.generateContent({
                model: "gemini-2.0-flash",
                contents: [
                    ...contents,
                    { role: 'user', parts: [{ text: searchPrompt }] }
                ],
                config: { responseMimeType: "application/json" }
            });

            const searchCleanJson = (searchResult.text || '').replace(/```json|```/g, '').trim();
            const searchData = JSON.parse(searchCleanJson || '{}');

            return {
                intent: 'SEARCH',
                message: searchData.message || data.message || '',
                slugs: searchData.slugs || []
            };

        } catch (error: any) {
            console.error(chalk.red('[LLM Error]'), error.message);
            return { intent: 'SEARCH', message: '', slugs: [] };
        }
    }
}

function slugsNeeded(msg: string, data: any): boolean {
    return data.intent === 'SEARCH' && (!data.slugs || data.slugs.length < 2);
}

export const llmService = new LlmService();
