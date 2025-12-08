import fs from 'fs';
import path from 'path';
import { config } from '../config';

/**
 * Service for hosting images temporarily so Twilio can access them
 * In production, you'd use S3/Cloudinary/etc.
 * For now, we serve them from the Express server
 */
export class ImageHostingService {
    private baseUrl: string;
    private imagesPath: string;

    constructor() {
        // In production, this would be your public URL
        this.baseUrl = process.env.PUBLIC_URL || `http://localhost:${config.server.port}`;
        this.imagesPath = path.join(process.cwd(), 'temp', 'graphics');
    }

    /**
     * Get public URL for a local image file
     */
    getPublicUrl(localPath: string): string {
        const fileName = path.basename(localPath);
        return `${this.baseUrl}/images/${fileName}`;
    }

    /**
     * Upload a local file and return its public URL
     * For now, just returns the URL since we serve locally
     * In production, this would upload to S3/Cloudinary
     */
    async upload(localPath: string): Promise<string> {
        // Verify file exists
        if (!fs.existsSync(localPath)) {
            throw new Error(`File not found: ${localPath}`);
        }

        const url = this.getPublicUrl(localPath);
        console.log(`[ImageHosting] URL for ${path.basename(localPath)}: ${url}`);

        return url;
    }

    /**
     * Upload multiple files
     */
    async uploadMultiple(localPaths: string[]): Promise<string[]> {
        const urls: string[] = [];

        for (const localPath of localPaths) {
            const url = await this.upload(localPath);
            urls.push(url);
        }

        return urls;
    }

    /**
     * Get the local path for serving images via Express
     */
    getServingPath(): string {
        return this.imagesPath;
    }
}

// Export singleton instance
export const imageHostingService = new ImageHostingService();
