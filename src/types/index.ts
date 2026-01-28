// Basic Offer structure
export interface Offer {
    id: string;
    price: number;
    currency: string;
    url: string;
    ticketType: 'standard' | 'vip';
    isHospitality: boolean;
    owner: {
        name: string;
    };
}

// Fixture structure
export interface Fixture {
    id: string;
    slug: string;
    homeTeam: { name: string };
    awayTeam: { name: string };
    date: string;
    venue: { name: string };
    offers?: Offer[];
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
}

// Twilio Webhook body
export interface TwilioWebhookBody {
    Body: string;
    From: string;
    To: string;
    MessageSid: string;
    NumMedia?: string;
    MediaUrl0?: string;
}
