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
import { activityTracker } from './utils/activity-tracker';

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

// Beautiful homepage/dashboard
app.get('/', async (_req: Request, res: Response) => {
  // Get service status
  let iqrStatus = '🔄 Checking...';
  let shipstationStatus = '🔄 Checking...';
  let overallStatus = 'checking';

  try {
    const healthResponse = await fetch('http://localhost:' + config.server.port + '/health/detailed');
    const health = await healthResponse.json() as any;
    iqrStatus = health.services?.iqr === 'up' ? '✅ Connected' : '❌ Disconnected';
    shipstationStatus = health.services?.shipstation === 'up' ? '✅ Connected' : '❌ Disconnected';
    overallStatus = health.status === 'healthy' ? 'healthy' : 'unhealthy';
  } catch {
    iqrStatus = '⚠️ Unknown';
    shipstationStatus = '⚠️ Unknown';
    overallStatus = 'unknown';
  }

  // Get activity stats
  const stats = activityTracker.getStats();
  const lastSyncTime = stats.last24Hours.lastSyncTime
    ? formatTimeAgo(stats.last24Hours.lastSyncTime)
    : 'Never';

  const uptimeSeconds = process.uptime();
  const uptimeFormatted = formatUptime(uptimeSeconds);
  const statusColor = overallStatus === 'healthy' ? '#10b981' : overallStatus === 'unhealthy' ? '#ef4444' : '#f59e0b';
  const statusEmoji = overallStatus === 'healthy' ? '🟢' : overallStatus === 'unhealthy' ? '🔴' : '🟡';

  // Build recent activity HTML
  const activityHtml = stats.recentActivity.length > 0
    ? stats.recentActivity.map(a => {
        const icon = a.type === 'sync' ? (a.success ? '✅' : '❌') : a.type === 'webhook' ? '🔔' : '⚠️';
        const time = formatTimeAgo(a.timestamp);
        const msg = a.message || (a.type === 'sync' ? 'Processed ' + a.ordersProcessed + ' orders' : 'Activity');
        return '<div class="activity-row"><span class="activity-icon">' + icon + '</span><span class="activity-msg">' + msg + '</span><span class="activity-time">' + time + '</span></div>';
      }).join('')
    : '<div class="no-activity">No activity yet. First sync will happen soon!</div>';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IQR ↔ ShipStation Connector</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 24px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
      max-width: 500px;
      width: 100%;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      padding: 32px;
      text-align: center;
      color: white;
    }
    .header h1 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .header p {
      opacity: 0.9;
      font-size: 14px;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: ${statusColor}22;
      border: 2px solid ${statusColor};
      color: ${statusColor};
      padding: 8px 16px;
      border-radius: 50px;
      font-weight: 600;
      font-size: 14px;
      margin-top: 16px;
      text-transform: uppercase;
    }
    .content {
      padding: 32px;
    }
    .card {
      background: #f8fafc;
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 16px;
    }
    .card:last-child { margin-bottom: 0; }
    .card-title {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 12px;
      font-weight: 600;
    }
    .service-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .service-row:last-child { border-bottom: none; }
    .service-name {
      font-weight: 500;
      color: #334155;
    }
    .service-status {
      font-size: 14px;
    }
    .stat-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .stat {
      text-align: center;
    }
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
    }
    .stat-label {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
    }
    .footer {
      text-align: center;
      padding: 20px 32px 32px;
      color: #94a3b8;
      font-size: 12px;
    }
    .footer a {
      color: #3b82f6;
      text-decoration: none;
    }
    .pulse {
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
    .activity-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .activity-row:last-child { border-bottom: none; }
    .activity-icon { font-size: 16px; }
    .activity-msg {
      flex: 1;
      font-size: 13px;
      color: #475569;
    }
    .activity-time {
      font-size: 11px;
      color: #94a3b8;
    }
    .no-activity {
      text-align: center;
      color: #94a3b8;
      padding: 20px;
      font-size: 13px;
    }
    .stat-grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }
    .stat-small .stat-value {
      font-size: 20px;
    }
    .stat-small .stat-label {
      font-size: 10px;
    }
    .success-text { color: #10b981; }
    .error-text { color: #ef4444; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📦 IQR ↔ ShipStation</h1>
      <p>Order Synchronization Connector</p>
      <div class="status-badge">
        <span>${statusEmoji}</span>
        <span>${overallStatus === 'healthy' ? 'All Systems Operational' : overallStatus === 'unhealthy' ? 'System Issues Detected' : 'Checking Status...'}</span>
      </div>
    </div>

    <div class="content">
      <div class="card">
        <div class="card-title">🔗 Service Connections</div>
        <div class="service-row">
          <span class="service-name">IQ Reseller API</span>
          <span class="service-status">${iqrStatus}</span>
        </div>
        <div class="service-row">
          <span class="service-name">ShipStation API</span>
          <span class="service-status">${shipstationStatus}</span>
        </div>
      </div>

      <div class="card">
        <div class="card-title">📈 Last 24 Hours</div>
        <div class="stat-grid-4">
          <div class="stat stat-small">
            <div class="stat-value">${stats.last24Hours.totalSyncs}</div>
            <div class="stat-label">Syncs</div>
          </div>
          <div class="stat stat-small">
            <div class="stat-value success-text">${stats.last24Hours.ordersProcessed}</div>
            <div class="stat-label">Orders Synced</div>
          </div>
          <div class="stat stat-small">
            <div class="stat-value error-text">${stats.last24Hours.ordersFailed}</div>
            <div class="stat-label">Failed</div>
          </div>
          <div class="stat stat-small">
            <div class="stat-value">${lastSyncTime}</div>
            <div class="stat-label">Last Sync</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">📊 System Info</div>
        <div class="stat-grid">
          <div class="stat">
            <div class="stat-value">${config.sync.intervalMinutes}m</div>
            <div class="stat-label">Sync Interval</div>
          </div>
          <div class="stat">
            <div class="stat-value">${uptimeFormatted}</div>
            <div class="stat-label">Uptime</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">🕐 Recent Activity</div>
        ${activityHtml}
      </div>
    </div>

    <div class="footer">
      <p>v1.0.0 • Running on <a href="https://render.com" target="_blank">Render</a></p>
      <p style="margin-top: 8px;">Auto-syncing orders every ${config.sync.intervalMinutes} minutes • Last updated: ${new Date().toLocaleTimeString()}</p>
    </div>
  </div>
</body>
</html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// Helper function to format uptime
function formatUptime(seconds: number): string {
  if (seconds < 60) return Math.floor(seconds) + 's';
  if (seconds < 3600) return Math.floor(seconds / 60) + 'm';
  if (seconds < 86400) return Math.floor(seconds / 3600) + 'h';
  return Math.floor(seconds / 86400) + 'd';
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
  if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
  return Math.floor(seconds / 86400) + 'd ago';
}

// API endpoint to get activity stats
app.get('/api/stats', (_req: Request, res: Response) => {
  const stats = activityTracker.getStats();
  res.json(stats);
});

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

