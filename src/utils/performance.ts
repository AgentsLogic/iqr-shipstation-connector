/**
 * Performance Monitoring Utilities
 * 
 * Track and report performance metrics
 */

import { logger } from './logger';

interface PerformanceMetrics {
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private completedMetrics: PerformanceMetrics[] = [];
  private maxStoredMetrics: number = 1000;

  /**
   * Start tracking an operation
   */
  start(operationName: string, metadata?: Record<string, any>): void {
    this.metrics.set(operationName, {
      operationName,
      startTime: Date.now(),
      metadata,
    });
  }

  /**
   * End tracking an operation and log the duration
   */
  end(operationName: string, additionalMetadata?: Record<string, any>): number {
    const metric = this.metrics.get(operationName);
    
    if (!metric) {
      logger.warn('Performance metric not found', { operationName });
      return 0;
    }

    const endTime = Date.now();
    const duration = endTime - metric.startTime;

    const completedMetric: PerformanceMetrics = {
      ...metric,
      endTime,
      duration,
      metadata: { ...metric.metadata, ...additionalMetadata },
    };

    this.metrics.delete(operationName);
    this.completedMetrics.push(completedMetric);

    // Trim old metrics if we exceed max
    if (this.completedMetrics.length > this.maxStoredMetrics) {
      this.completedMetrics.shift();
    }

    logger.debug('Operation completed', {
      operation: operationName,
      duration,
      ...completedMetric.metadata,
    });

    return duration;
  }

  /**
   * Measure an async operation
   */
  async measure<T>(
    operationName: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.start(operationName, metadata);
    
    try {
      const result = await fn();
      this.end(operationName, { success: true });
      return result;
    } catch (error) {
      this.end(operationName, { success: false, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get statistics for a specific operation
   */
  getStats(operationName: string): {
    count: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    successRate: number;
  } | null {
    const metrics = this.completedMetrics.filter(
      (m) => m.operationName === operationName
    );

    if (metrics.length === 0) {
      return null;
    }

    const durations = metrics.map((m) => m.duration!);
    const successes = metrics.filter((m) => m.metadata?.success !== false).length;

    return {
      count: metrics.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      successRate: (successes / metrics.length) * 100,
    };
  }

  /**
   * Get all operation statistics
   */
  getAllStats(): Record<string, ReturnType<typeof this.getStats>> {
    const operationNames = new Set(
      this.completedMetrics.map((m) => m.operationName)
    );

    const stats: Record<string, ReturnType<typeof this.getStats>> = {};
    
    for (const name of operationNames) {
      stats[name] = this.getStats(name);
    }

    return stats;
  }

  /**
   * Get memory usage
   */
  getMemoryUsage(): {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  } {
    const usage = process.memoryUsage();
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
      rss: Math.round(usage.rss / 1024 / 1024), // MB
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
    this.completedMetrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

