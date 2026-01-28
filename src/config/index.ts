import dotenv from 'dotenv';

dotenv.config({ quiet: true });

export const config = {
    // Twilio Configuration
    twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID || '',
        authToken: process.env.TWILIO_AUTH_TOKEN || '',
        whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886',
    },

    // API Configuration
    api: {
        baseUrl: process.env.API_BASE_URL || 'https://www.ticketagent.co.il',
        openaiKey: process.env.OPENAI_API_KEY || '',
        geminiKey: process.env.GEMINI_API_KEY || '',
    },

    // Server Configuration
    server: {
        port: parseInt(process.env.PORT || '3100', 10),
    },
};
