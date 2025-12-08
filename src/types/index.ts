// Actual Offer structure from the API
export interface Offer {
    id: string;
    fixtureId: string;
    ownerType: string;
    price: number;
    currency: string;
    url: string;
    fallbackContact: string | null;
    isAvailable: boolean;
    ticketType: 'standard' | 'vip';
    isHospitality: boolean;
    notes: string | null;
    owner: {
        id: string;
        name: string;
        slug: string;
        logoUrl: string;
        imageUrl: string;
        externalRating?: {
            rating: number;
            url: string;
            provider: string;
        };
    };
    // Optional fixture info if included
    fixture?: {
        homeTeam?: { name: string };
        awayTeam?: { name: string };
        venue?: string;
        eventDate?: string;
    };
}

// API Response structure
export interface OffersResponse {
    success: boolean;
    code: string;
    message: string;
    data: Offer[];
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
