/**
 * IQ Reseller ↔ ShipStation Connector
 * 
 * Main entry point for the connector application
 */

import express, { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import { config } from './config';
import { syncOrders, startScheduledSync } from './services/order-sync.service';
import {
  processShipmentWebhook,
  validateWebhookSignature,
  ShipStationShipmentWebhook
} from './services/tracking-sync.service';
import { logger } from './utils/logger';
import { validateEnv, printEnvSummary } from './utils/env-validator';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import healthRoutes from './routes/health.routes';

// Validate environment variables on startup
try {
  const envConfig = validateEnv();
  printEnvSummary(envConfig);
} catch (error) {
  console.error('❌ Failed to start application:', (error as Error).message);
  process.exit(1);
}

const app = express();

// Enable gzip compression for all responses
app.use(compression());

// Parse JSON bodies with size limit
app.use(express.json({
  limit: '10mb',
  verify: (req: Request, _res: Response, buf: Buffer) => {
    // Store raw body for webhook signature validation
    (req as any).rawBody = buf.toString();
  }
}));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.apiResponse(req.method, req.path, res.statusCode, duration, {
      ip: req.ip,
    });
  });

  next();
});

// Health check routes (includes /health, /health/detailed, /ready, /live)
app.use(healthRoutes);

// Manual sync trigger endpoint
app.post('/api/sync/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Manual order sync triggered', { filters: req.body });
    const { fromDate, toDate, orderStatus } = req.body;
    const result = await syncOrders({ fromDate, toDate, orderStatus });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ShipStation webhook endpoint
app.post('/webhooks/shipstation', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Received ShipStation webhook', {
      resourceType: req.body.resource_type,
      resourceUrl: req.body.resource_url,
    });

    const signature = req.headers['x-shipstation-signature'] as string | undefined;
    const rawBody = (req as any).rawBody;

    // Validate webhook signature
    if (!validateWebhookSignature(rawBody, signature || null)) {
      logger.warn('Invalid webhook signature', { ip: req.ip });
      res.status(401).json({ error: 'Invalid webhook signature' });
      return;
    }

    const webhook = req.body as ShipStationShipmentWebhook;

    // Only process shipment events
    if (webhook.resource_type === 'shipment' || webhook.resource_type === 'fulfillment_shipped') {
      const result = await processShipmentWebhook(webhook);
      res.json(result);
    } else {
      logger.debug('Ignoring non-shipment webhook', { resourceType: webhook.resource_type });
      res.json({ success: true, message: `Ignoring event type: ${webhook.resource_type}` });
    }
  } catch (error) {
    next(error);
  }
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
const PORT = config.server.port;

const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║     IQ Reseller ↔ ShipStation Connector                   ║
╠═══════════════════════════════════════════════════════════╣
║  Server running on port ${PORT}                              ║
║  Environment: ${config.server.environment.padEnd(42)}║
║                                                           ║
║  Endpoints:                                               ║
║  - GET  /health              Health check                 ║
║  - GET  /health/detailed     Detailed health + services   ║
║  - GET  /ready               Readiness probe              ║
║  - GET  /live                Liveness probe               ║
║  - POST /api/sync/orders     Trigger manual sync          ║
║  - POST /webhooks/shipstation ShipStation webhooks        ║
╚═══════════════════════════════════════════════════════════╝
  `);

  logger.info('Server started successfully', {
    port: PORT,
    environment: config.server.environment,
  });

  // Start scheduled sync if configured
  if (config.sync.intervalMinutes > 0) {
    logger.info(`Scheduled sync enabled: every ${config.sync.intervalMinutes} minutes`);
    startScheduledSync();
  } else {
    logger.info('Scheduled sync disabled (interval set to 0)');
  }
});

// Graceful shutdown handling
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received, starting graceful shutdown`);

  server.close(() => {
    logger.info('HTTP server closed');

    // Give ongoing requests time to complete
    setTimeout(() => {
      logger.info('Graceful shutdown complete');
      process.exit(0);
    }, 5000);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled rejection', new Error(String(reason)));
  gracefulShutdown('UNHANDLED_REJECTION');
});

export default app;

