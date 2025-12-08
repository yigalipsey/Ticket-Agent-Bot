import axios from 'axios';
import { config } from '../config';
import { OffersResponse } from '../types';

/**
 * Service for communicating with the Ticket Agent API
 */
export class ApiService {
    private baseUrl: string;
    private offersEndpoint: string;

    constructor() {
        this.baseUrl = config.api.baseUrl;
        this.offersEndpoint = config.api.offersEndpoint;
    }

    /**
     * Search for offers using natural language query
     */
    async searchOffers(query: string, userPhone?: string): Promise<OffersResponse> {
        try {
            const url = `${this.baseUrl}${this.offersEndpoint}`;

            console.log(`[API] ========================================`);
            console.log(`[API] Base URL: ${this.baseUrl}`);
            console.log(`[API] Full URL: ${url}`);
            console.log(`[API] Query: "${query}"`);
            console.log(`[API] ========================================`);

            const response = await axios.post<OffersResponse>(url, {
                query,
                userPhone,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 30000, // 30 seconds timeout
            });

            console.log(`[API] Response success: ${response.data.success}`);
            console.log(`[API] Found ${response.data.data?.length || 0} offers`);

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error(`[API] Error: ${error.message}`);
                if (error.response) {
                    console.error(`[API] Response status: ${error.response.status}`);
                    console.error(`[API] Response data:`, error.response.data);
                }
            } else {
                console.error('[API] Unknown error:', error);
            }

            // Return empty response on error
            return {
                success: false,
                code: 'ERROR',
                message: 'API Error',
                data: [],
            };
        }
    }
}

// Export singleton instance
export const apiService = new ApiService();
