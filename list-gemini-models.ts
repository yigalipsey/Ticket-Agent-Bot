import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
    const key = process.env.GEMINI_API_KEY || "";
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    try {
        const response = await axios.get(url);
        console.log("Available Models:");
        response.data.models.forEach((m: any) => {
            console.log(`- ${m.name} (${m.displayName})`);
        });
    } catch (e: any) {
        console.error("Error listing models:", e.response?.data || e.message);
    }
}

listModels();
