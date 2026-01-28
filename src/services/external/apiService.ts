import axios from 'axios';
import { EventSource } from 'eventsource';
import { config } from '../../config';
import { ApiResponse, Offer } from '../../types';
import chalk from 'chalk';

/**
 * Service for communicating with the Ticket Agent API
 */
export class ApiService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = config.api.baseUrl;
    }

    /**
     * Streams offers for a specific match using SSE
     * Endpoint: GET /api/offers/fixture-slug-stream/:slug
     */
    streamOffersBySlug(
        matchSlug: string,
        onOffer: (offer: Offer) => void,
        onEnd: () => void,
        onError: (error: any) => void
    ): EventSource {
        const url = `${this.baseUrl}/api/offers/fixture-slug/stream/${matchSlug}`;
        console.log(chalk.bgCyan.black(` [SSE Connect] `) + chalk.cyan(` ${url}`));

        const source = new EventSource(url);

        // 1. Single offer event
        source.addEventListener('offer', (event: any) => {
            try {
                const rawData = JSON.parse(event.data);
                // The server might send the offer directly or wrap it in an "offer" property
                const offer: Offer = rawData.offer || rawData;

                if (!offer.id && !offer.price) {
                    console.warn(chalk.yellow(` [SSE Warning] `) + `Parsed object might be missing fields. Keys: ${Object.keys(rawData).join(', ')}`);
                }

                console.log(chalk.bgYellow.greenBright(` [SSE Offer] `) + chalk.yellow(` Received: ${offer.ticketType} - ${offer.price}${offer.currency} from ${offer.owner?.name}`));
                onOffer(offer);
            } catch (err) {
                console.error(chalk.red(` [SSE Parse Error (offer)] `), err);
            }
        });

        // 2. Batch of offers event
        source.addEventListener('offers', (event: any) => {
            try {
                const rawData = JSON.parse(event.data);
                // Might be a direct array or { "offers": [...] }
                const offers: Offer[] = rawData.offers || (Array.isArray(rawData) ? rawData : []);

                console.log(chalk.bgYellow.greenBright(` [SSE Offers] `) + chalk.yellow(` Received batch of ${offers.length} offers`));
                offers.forEach(o => onOffer(o));
            } catch (err) {
                console.error(chalk.red(` [SSE Parse Error (offers)] `), err);
            }
        });

        // 3. Complete event
        source.addEventListener('complete', () => {
            console.log(chalk.bgGreen.black(` [SSE Complete] `) + chalk.green(` Stream finished for "${matchSlug}"`));
            onEnd();
            source.close();
        });

        // 4. Error event (from server)
        source.addEventListener('error', (event: any) => {
            if (event.data) {
                try {
                    const errorData = JSON.parse(event.data);
                    console.error(chalk.bgRed.white(` [Server SSE Error] `), errorData);
                } catch {
                    console.error(chalk.bgRed.white(` [Server SSE Error Raw] `), event.data);
                }
            }
        });

        // Connection-level error (closed, timeout, etc.)
        source.onerror = (err: any) => {
            // Only log if connection wasn't closed by us
            if (source.readyState !== 2) { // 2 = CLOSED
                console.error(chalk.bgRed.white(` [SSE Connection Error] `), {
                    msg: err.message,
                    status: err.status,
                    type: err.type
                });
                onError(err);
                source.close();
            }
        };

        // Handle specific "end" event if your server sends it
        source.addEventListener('end', () => {
            console.log(chalk.bgGreen.black(` [SSE End Event] `) + chalk.green(` Stream ended for "${matchSlug}"`));
            onEnd();
            source.close();
        });

        return source;
    }

    /**
     * Fetches offers for a specific match using its slug (Standard REST)
     * Endpoint: GET /api/offers/fixture-slug/:slug
     */
    async getOffersBySlug(matchSlug: string): Promise<Offer[]> {
        const start = performance.now();
        const url = `${this.baseUrl}/api/offers/fixture-slug/${matchSlug}`;

        console.log(chalk.bgCyan.black(` [API Request] `) + chalk.cyan(` GET ${url}`));

        try {
            const response = await axios.get<ApiResponse<Offer[]>>(url, {
                timeout: 10000, // 10 seconds
            });

            const end = performance.now();
            const offers = response.data.data || [];

            console.log(
                chalk.bgGreen.black(` [API Success] `) +
                chalk.green(` Found ${offers.length} offers for "${matchSlug}" `) +
                chalk.gray(`(${(end - start).toFixed(2)}ms)`)
            );

            return offers;
        } catch (error) {
            const end = performance.now();
            console.error(
                chalk.bgRed.white(` [API Error] `) +
                chalk.red(` Failed to fetch offers for "${matchSlug}": ${error instanceof Error ? error.message : 'Unknown error'} `) +
                chalk.gray(`(${(end - start).toFixed(2)}ms)`)
            );
            return [];
        }
    }
}

export const apiService = new ApiService();
