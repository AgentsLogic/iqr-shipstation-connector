/**
 * Activity Tracker - Tracks sync history and stats
 * Stores recent activity in memory (resets on restart)
 */

export interface SyncActivity {
  id: string;
  timestamp: Date;
  type: 'sync' | 'webhook' | 'error';
  success: boolean;
  ordersProcessed: number;
  ordersFailed: number;
  duration: number; // milliseconds
  message?: string;
}

export interface ActivityStats {
  last24Hours: {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    ordersProcessed: number;
    ordersFailed: number;
    lastSyncTime: Date | null;
  };
  allTime: {
    totalSyncs: number;
    ordersProcessed: number;
    startTime: Date;
  };
  recentActivity: SyncActivity[];
}

class ActivityTracker {
  private activities: SyncActivity[] = [];
  private readonly maxActivities = 100; // Keep last 100 activities
  private startTime: Date = new Date();
  private totalSyncs = 0;
  private totalOrdersProcessed = 0;

  /**
   * Record a sync activity
   */
  recordSync(data: {
    success: boolean;
    ordersProcessed: number;
    ordersFailed: number;
    duration: number;
    message?: string;
  }): void {
    const activity: SyncActivity = {
      id: this.generateId(),
      timestamp: new Date(),
      type: 'sync',
      ...data,
    };

    this.activities.unshift(activity); // Add to beginning
    this.totalSyncs++;
    this.totalOrdersProcessed += data.ordersProcessed;

    // Trim old activities
    if (this.activities.length > this.maxActivities) {
      this.activities = this.activities.slice(0, this.maxActivities);
    }
  }

  /**
   * Record a webhook activity
   */
  recordWebhook(data: {
    success: boolean;
    message?: string;
  }): void {
    const activity: SyncActivity = {
      id: this.generateId(),
      timestamp: new Date(),
      type: 'webhook',
      success: data.success,
      ordersProcessed: data.success ? 1 : 0,
      ordersFailed: data.success ? 0 : 1,
      duration: 0,
      message: data.message,
    };

    this.activities.unshift(activity);
    
    if (this.activities.length > this.maxActivities) {
      this.activities = this.activities.slice(0, this.maxActivities);
    }
  }

  /**
   * Record an error
   */
  recordError(message: string): void {
    const activity: SyncActivity = {
      id: this.generateId(),
      timestamp: new Date(),
      type: 'error',
      success: false,
      ordersProcessed: 0,
      ordersFailed: 0,
      duration: 0,
      message,
    };

    this.activities.unshift(activity);
    
    if (this.activities.length > this.maxActivities) {
      this.activities = this.activities.slice(0, this.maxActivities);
    }
  }

  /**
   * Get activity statistics
   */
  getStats(): ActivityStats {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const last24HourActivities = this.activities.filter(
      a => a.timestamp >= oneDayAgo
    );

    const syncsLast24h = last24HourActivities.filter(a => a.type === 'sync');
    const lastSync = syncsLast24h.length > 0 ? syncsLast24h[0].timestamp : null;

    return {
      last24Hours: {
        totalSyncs: syncsLast24h.length,
        successfulSyncs: syncsLast24h.filter(a => a.success).length,
        failedSyncs: syncsLast24h.filter(a => !a.success).length,
        ordersProcessed: syncsLast24h.reduce((sum, a) => sum + a.ordersProcessed, 0),
        ordersFailed: syncsLast24h.reduce((sum, a) => sum + a.ordersFailed, 0),
        lastSyncTime: lastSync,
      },
      allTime: {
        totalSyncs: this.totalSyncs,
        ordersProcessed: this.totalOrdersProcessed,
        startTime: this.startTime,
      },
      recentActivity: this.activities.slice(0, 10), // Last 10 activities
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }
}

// Singleton instance
export const activityTracker = new ActivityTracker();

