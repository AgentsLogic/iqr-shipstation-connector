/**
 * Health check routes
 */

import { Router, Request, Response } from 'express';
import { iqrClient } from '../clients/iqr-client';
import { shipStationClient } from '../clients/shipstation-client';
import { logger } from '../utils/logger';
import { performanceMonitor } from '../utils/performance';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    iqr: 'up' | 'down' | 'unknown';
    shipstation: 'up' | 'down' | 'unknown';
  };
}

/**
 * Basic health check - always returns 200 if server is running
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Detailed health check - tests external service connectivity
 */
router.get('/health/detailed', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      iqr: 'unknown',
      shipstation: 'unknown',
    },
  };

  // Test IQR connectivity
  try {
    await iqrClient.authenticate();
    health.services.iqr = 'up';
    await iqrClient.endSession();
  } catch (error) {
    logger.error('IQR health check failed', error as Error);
    health.services.iqr = 'down';
    health.status = 'degraded';
  }

  // Test ShipStation connectivity
  try {
    // Simple API call to test connectivity
    const response = await fetch(
      `${process.env.SHIPSTATION_API_BASE_URL}/stores`,
      {
        method: 'GET',
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${process.env.SHIPSTATION_API_KEY}:${process.env.SHIPSTATION_API_SECRET}`
          ).toString('base64')}`,
        },
      }
    );
    
    if (response.ok) {
      health.services.shipstation = 'up';
    } else {
      health.services.shipstation = 'down';
      health.status = 'degraded';
    }
  } catch (error) {
    logger.error('ShipStation health check failed', error as Error);
    health.services.shipstation = 'down';
    health.status = 'degraded';
  }

  // If both services are down, mark as unhealthy
  if (health.services.iqr === 'down' && health.services.shipstation === 'down') {
    health.status = 'unhealthy';
  }

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
  
  logger.info('Health check completed', {
    status: health.status,
    duration: Date.now() - startTime,
  });

  res.status(statusCode).json(health);
});

/**
 * Readiness check - for Kubernetes/container orchestration
 */
router.get('/ready', (req: Request, res: Response) => {
  // Check if the application is ready to accept traffic
  // For now, just check if we can access environment variables
  if (process.env.IQR_API_KEY && process.env.SHIPSTATION_API_KEY) {
    res.status(200).json({ ready: true });
  } else {
    res.status(503).json({ ready: false, reason: 'Missing configuration' });
  }
});

/**
 * Liveness check - for Kubernetes/container orchestration
 */
router.get('/live', (req: Request, res: Response) => {
  // Simple check that the process is alive
  res.status(200).json({ alive: true });
});

/**
 * Performance metrics endpoint
 */
router.get('/metrics', (req: Request, res: Response) => {
  const stats = performanceMonitor.getAllStats();
  const memory = performanceMonitor.getMemoryUsage();

  res.status(200).json({
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory,
    operations: stats,
  });
});

export default router;

