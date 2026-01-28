import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    // The SDK doesn't have a listModels method on the main class, 
    // but we can try to use the model names directly.

    const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-2.0-flash", "gemini-flash-latest"];

    for (const m of models) {
        try {
            console.log(`Testing ${m}...`);
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("test");
            console.log(`✅ ${m} works!`);
        } catch (e: any) {
            console.log(`❌ ${m} failed: ${e.message}`);
        }
    }
}

main();
