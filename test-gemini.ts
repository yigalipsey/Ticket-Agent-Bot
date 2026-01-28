import { llmService } from './src/services/llmService';
import { teamExtractor } from './src/services/teamExtractor';
import chalk from 'chalk';
import dotenv from 'dotenv';

dotenv.config();

async function testGemini() {
    console.log(chalk.bold.yellow('\n--- Testing Gemini Team Extraction ---'));

    const messages = [
        "אני רוצה לראות את המשחק של הבלאנקוס מול הגרמנים ביוני",
        "כרטיסים לדרבי של צפון לונדון",
        "כמה עולה כרטיס למנצסטר סיטי?",
        "יש כרטיסים להפועל תל אביב נגד מכבי חיפה?"
    ];

    for (const msg of messages) {
        console.log(chalk.cyan(`\nInput: "${msg}"`));
        const result = await llmService.extractTeamsWithLlm(msg);
        console.log(chalk.green(`Result: ${result}`));
    }
}

testGemini().catch(console.error);
