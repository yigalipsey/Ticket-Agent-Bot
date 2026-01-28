import { LRUCache } from 'lru-cache';
import chalk from 'chalk';

export interface ChatMessage {
    role: 'user' | 'bot';
    text: string;
    timestamp: number;
}

export interface UserSession {
    messages: ChatMessage[];
    identifiedSlugs: string[];
    lastAction?: string;
    lastGreetingTime?: number;
}

export class SessionService {
    private cache: LRUCache<string, UserSession>;

    constructor() {
        this.cache = new LRUCache<string, UserSession>({
            max: 500, // Store context for up to 500 active users
            ttl: 1000 * 60 * 60 * 24, // 24 hours TTL
        });
    }

    /**
     * Get or create a session for a user
     */
    getSession(phone: string): UserSession {
        let session = this.cache.get(phone);
        if (!session) {
            session = {
                messages: [],
                identifiedSlugs: []
            };
            this.cache.set(phone, session);
        }
        return session;
    }

    /**
     * Add a message to the session history
     */
    addMessage(phone: string, role: 'user' | 'bot', text: string) {
        const session = this.getSession(phone);
        session.messages.push({
            role,
            text,
            timestamp: Date.now()
        });

        // Keep only the last 6 messages
        if (session.messages.length > 6) {
            session.messages.shift();
        }

        this.cache.set(phone, session);
    }

    /**
     * Update slugs in the session (merging with existing)
     */
    updateSlugs(phone: string, slugs: string[]) {
        const session = this.getSession(phone);
        // Combine and take unique
        const combined = [...new Set([...session.identifiedSlugs, ...slugs])];
        session.identifiedSlugs = combined.slice(-2); // Keep only the 2 most relevant/recent slugs
        this.cache.set(phone, session);
    }

    /**
     * Update the last time a greeting was sent
     */
    setGreetingTime(phone: string) {
        const session = this.getSession(phone);
        session.lastGreetingTime = Date.now();
        this.cache.set(phone, session);
    }

    /**
     * Check if 15 minutes have passed since last greeting
     */
    shouldSendPrimaryGreeting(phone: string): boolean {
        const session = this.getSession(phone);
        if (!session.lastGreetingTime) return true;
        const fifteenMinutes = 1000 * 60 * 15;
        return Date.now() - session.lastGreetingTime > fifteenMinutes;
    }

    /**
     * Clear session (for debugging or reset)
     */
    clearSession(phone: string) {
        this.cache.delete(phone);
        console.log(chalk.gray(` [Session] Cleared for ${phone}`));
    }
}

export const sessionService = new SessionService();
