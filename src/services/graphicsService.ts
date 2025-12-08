import { createCanvas, loadImage, registerFont, CanvasRenderingContext2D } from 'canvas';
import { Offer } from '../types';
import path from 'path';
import fs from 'fs';

/**
 * Service for generating offer graphics
 */
export class GraphicsService {
    private readonly cardWidth = 800;
    private readonly cardHeight = 400;
    private readonly outputDir: string;

    constructor() {
        this.outputDir = path.join(process.cwd(), 'temp', 'graphics');
        this.ensureOutputDir();
    }

    private ensureOutputDir(): void {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    /**
     * Generate a graphic card for a single offer
     */
    async generateOfferCard(offer: Offer): Promise<string> {
        const canvas = createCanvas(this.cardWidth, this.cardHeight);
        const ctx = canvas.getContext('2d');

        // Draw background gradient
        this.drawBackground(ctx);

        // Draw content
        await this.drawTeamLogos(ctx, offer);
        this.drawMatchInfo(ctx, offer);
        this.drawTicketInfo(ctx, offer);
        this.drawPrice(ctx, offer);
        this.drawFooter(ctx);

        // Save to file
        const fileName = `offer_${offer._id}_${Date.now()}.png`;
        const filePath = path.join(this.outputDir, fileName);

        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(filePath, buffer);

        console.log(`[Graphics] Generated card: ${filePath}`);
        return filePath;
    }

    /**
     * Generate multiple cards for offers list
     */
    async generateOfferCards(offers: Offer[]): Promise<string[]> {
        const paths: string[] = [];

        // Limit to first 5 offers for WhatsApp
        const limitedOffers = offers.slice(0, 5);

        for (const offer of limitedOffers) {
            const path = await this.generateOfferCard(offer);
            paths.push(path);
        }

        return paths;
    }

    private drawBackground(ctx: CanvasRenderingContext2D): void {
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, this.cardWidth, this.cardHeight);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f3460');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.cardWidth, this.cardHeight);

        // Add subtle pattern/glow
        ctx.beginPath();
        ctx.arc(this.cardWidth * 0.2, this.cardHeight * 0.3, 150, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(231, 76, 60, 0.1)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.cardWidth * 0.8, this.cardHeight * 0.7, 150, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(52, 152, 219, 0.1)';
        ctx.fill();
    }

    private async drawTeamLogos(ctx: CanvasRenderingContext2D, offer: Offer): Promise<void> {
        const logoSize = 80;
        const logoY = 50;

        // Draw placeholder circles for team logos
        // Home team - left side
        ctx.beginPath();
        ctx.arc(150, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#e74c3c';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Away team - right side
        ctx.beginPath();
        ctx.arc(this.cardWidth - 150, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#3498db';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // VS text in center
        ctx.font = 'bold 36px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('VS', this.cardWidth / 2, logoY + logoSize / 2 + 12);

        // Try to load actual logos if available
        if (offer.homeTeam.logo) {
            try {
                const homeImg = await loadImage(offer.homeTeam.logo);
                ctx.save();
                ctx.beginPath();
                ctx.arc(150, logoY + logoSize / 2, logoSize / 2 - 2, 0, Math.PI * 2);
                ctx.clip();
                ctx.drawImage(homeImg, 150 - logoSize / 2, logoY, logoSize, logoSize);
                ctx.restore();
            } catch (e) {
                // Keep placeholder
            }
        }

        if (offer.awayTeam.logo) {
            try {
                const awayImg = await loadImage(offer.awayTeam.logo);
                ctx.save();
                ctx.beginPath();
                ctx.arc(this.cardWidth - 150, logoY + logoSize / 2, logoSize / 2 - 2, 0, Math.PI * 2);
                ctx.clip();
                ctx.drawImage(awayImg, this.cardWidth - 150 - logoSize / 2, logoY, logoSize, logoSize);
                ctx.restore();
            } catch (e) {
                // Keep placeholder
            }
        }
    }

    private drawMatchInfo(ctx: CanvasRenderingContext2D, offer: Offer): void {
        // Team names
        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';

        // Home team name
        ctx.fillText(offer.homeTeam.name, 150, 160);

        // Away team name  
        ctx.fillText(offer.awayTeam.name, this.cardWidth - 150, 160);

        // Event name / venue
        ctx.font = '20px Arial';
        ctx.fillStyle = '#bdc3c7';
        ctx.fillText(offer.venue, this.cardWidth / 2, 200);

        // Date
        const eventDate = new Date(offer.eventDate);
        const dateStr = eventDate.toLocaleDateString('he-IL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        const timeStr = eventDate.toLocaleTimeString('he-IL', {
            hour: '2-digit',
            minute: '2-digit',
        });

        ctx.font = 'bold 22px Arial';
        ctx.fillStyle = '#f39c12';
        ctx.fillText(`📅 ${dateStr}`, this.cardWidth / 2, 240);
        ctx.fillText(`⏰ ${timeStr}`, this.cardWidth / 2, 270);
    }

    private drawTicketInfo(ctx: CanvasRenderingContext2D, offer: Offer): void {
        const infoY = 310;

        // Ticket type badge
        const isVIP = offer.ticketType === 'vip';
        const badgeColor = isVIP ? '#9b59b6' : '#27ae60';
        const badgeText = isVIP ? '🌟 VIP' : '🎫 Standard';

        ctx.font = 'bold 18px Arial';

        // Draw badge background
        const badgeWidth = ctx.measureText(badgeText).width + 30;
        const badgeX = 50;

        ctx.fillStyle = badgeColor;
        this.roundRect(ctx, badgeX, infoY - 20, badgeWidth, 35, 8);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(badgeText, badgeX + 15, infoY + 5);

        // Section and row if available
        if (offer.section || offer.row) {
            ctx.font = '16px Arial';
            ctx.fillStyle = '#bdc3c7';
            const sectionText = [
                offer.section && `Section: ${offer.section}`,
                offer.row && `Row: ${offer.row}`,
            ].filter(Boolean).join(' | ');
            ctx.fillText(sectionText, badgeX + badgeWidth + 20, infoY + 5);
        }

        // Quantity
        ctx.font = '16px Arial';
        ctx.fillStyle = '#bdc3c7';
        ctx.textAlign = 'right';
        ctx.fillText(`${offer.quantity} כרטיסים זמינים`, this.cardWidth - 50, infoY + 5);
    }

    private drawPrice(ctx: CanvasRenderingContext2D, offer: Offer): void {
        const priceY = 360;

        // Price background
        const priceText = `${offer.currency} ${offer.price.toLocaleString()}`;
        ctx.font = 'bold 32px Arial';
        const priceWidth = ctx.measureText(priceText).width + 40;

        ctx.fillStyle = '#e74c3c';
        this.roundRect(ctx, this.cardWidth / 2 - priceWidth / 2, priceY - 25, priceWidth, 45, 10);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(priceText, this.cardWidth / 2, priceY + 10);
    }

    private drawFooter(ctx: CanvasRenderingContext2D): void {
        ctx.font = '12px Arial';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.textAlign = 'center';
        ctx.fillText('TicketAgent - הכרטיסים הכי טובים למשחקים הכי גדולים', this.cardWidth / 2, this.cardHeight - 10);
    }

    private roundRect(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number
    ): void {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    /**
     * Clean up old graphics files
     */
    cleanup(olderThanMs: number = 3600000): void {
        const now = Date.now();
        const files = fs.readdirSync(this.outputDir);

        for (const file of files) {
            const filePath = path.join(this.outputDir, file);
            const stats = fs.statSync(filePath);

            if (now - stats.mtimeMs > olderThanMs) {
                fs.unlinkSync(filePath);
                console.log(`[Graphics] Cleaned up: ${file}`);
            }
        }
    }
}

// Export singleton instance
export const graphicsService = new GraphicsService();
