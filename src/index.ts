import express from 'express';
import path from 'path';
import { config } from './config';
import webhookRouter from './routes/webhook';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
================================
📝 Configure this webhook URL in Twilio Console:
   https://console.twilio.com/
================================
  `);
});

export default app;
