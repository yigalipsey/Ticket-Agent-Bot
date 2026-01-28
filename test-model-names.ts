import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

async function listAllModels() {
    const key = process.env.GEMINI_API_KEY || "";
    const genAI = new GoogleGenerativeAI(key);

    // There isn't a direct listModels in the main class but we can try to hit the endpoint manually if needed
    // However, let's try a few variations of the model name for 1.5-flash
    const potentialNames = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash-001",
        "gemini-1.5-flash-002"
    ];

    for (const name of potentialNames) {
        console.log(`Trying ${name}...`);
        try {
            const model = genAI.getGenerativeModel({ model: name });
            const result = await model.generateContent("Hi");
            console.log(`Success with ${name}!`);
            return;
        } catch (e: any) {
            console.log(`Failed with ${name}: ${e.message}`);
        }
    }
}

listAllModels().catch(console.error);
