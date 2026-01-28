import express from 'express';
import path from 'path';
import cors from 'cors';
import chalk from 'chalk';
import { config } from './config';
import webhookRouter from './routes/webhook';
import devRouter from './routes/dev';
import metaWebhookRouter from './routes/meta-webhook';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Logger Middleware
app.use((req, res, next) => {
    console.log(`[Trace] ${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/webhook', webhookRouter);
app.use('/dev', devRouter);
app.use('/meta-webhook', metaWebhookRouter);

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
console.log('[DEBUG] About to start server on port', config.server.port);
const server = app.listen(config.server.port, () => {
    console.log(chalk.green(`🚀 WhatsApp Bot live on port ${config.server.port} (http://localhost:${config.server.port}/health)`));
    console.log('[DEBUG] Server is now listening for requests');
});

server.on('error', (error: any) => {
    console.error('[ERROR] Server failed to start:', error);
});

console.log('[DEBUG] After app.listen() call');

export default app;
