import express from 'express';
import path from 'path';
import { config } from './config';
import webhookRouter from './routes/webhook';
import { imageHostingService } from './services/imageHostingService';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve generated images statically
app.use('/images', express.static(imageHostingService.getServingPath()));

// Routes
app.use('/webhook', webhookRouter);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

// Root
app.get('/', (req, res) => {
    res.json({
        name: 'WhatsApp Bot - TicketAgent',
        version: '1.0.0',
        endpoints: {
            webhook: '/webhook',
            health: '/health',
            images: '/images/:filename',
        },
    });
});

// Start server
app.listen(config.server.port, () => {
    console.log(`
🤖 WhatsApp Bot Server Started!
================================
📡 Port: ${config.server.port}
🔗 Webhook URL: http://localhost:${config.server.port}/webhook
🏥 Health Check: http://localhost:${config.server.port}/health
🖼️  Images: http://localhost:${config.server.port}/images/
================================
📝 Configure this webhook URL in Twilio Console:
   https://console.twilio.com/
================================
  `);
});

export default app;
