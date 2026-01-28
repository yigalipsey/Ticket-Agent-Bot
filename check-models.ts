import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

async function listModels() {
    const key = process.env.GEMINI_API_KEY || "";
    console.log("Using API Key starting with:", key.substring(0, 10));
    const genAI = new GoogleGenerativeAI(key);

    const models = ["gemini-pro", "gemini-1.5-flash", "gemini-1.5-pro"];

    for (const m of models) {
        console.log(`Checking ${m}...`);
        try {
            const model = genAI.getGenerativeModel({ model: m });
            const res = await model.generateContent("test");
            console.log(`${m} works!`);
        } catch (e: any) {
            console.error(`${m} failed:`, e.message);
        }
    }
}

listModels().catch(console.error);
