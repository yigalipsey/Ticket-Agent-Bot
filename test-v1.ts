import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

async function testV1() {
    const key = process.env.GEMINI_API_KEY || "";
    const genAI = new GoogleGenerativeAI(key);

    console.log("Trying gemini-1.5-flash with v1...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: 'v1' });
        const result = await model.generateContent("Hi");
        console.log("Success with v1!");
    } catch (e: any) {
        console.log("Failed with v1:", e.message);
    }
}

testV1();
