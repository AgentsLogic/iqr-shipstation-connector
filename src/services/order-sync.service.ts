/**
 * Order Sync Service
 * 
 * Handles synchronization of orders from IQ Reseller to ShipStation
 */

import { iqrClient, IQROrder } from '../clients/iqr-client';
import { shipStationClient, ShipStationOrder } from '../clients/shipstation-client';
import { config } from '../config';
import { logger } from '../utils/logger';
import { processInBatches } from '../utils/parallel';
import { performanceMonitor } from '../utils/performance';
import { activityTracker } from '../utils/activity-tracker';

export interface SyncResult {
  success: boolean;
  ordersProcessed: number;
  ordersFailed: number;
  errors: Array<{ orderNumber: string; error: string }>;
}

/**
 * Normalize country code to 2-character ISO format
 */
function normalizeCountryCode(country: string): string {
  if (!country) return 'US';

  const normalized = country.trim().toUpperCase();

  // If already 2 characters, return as-is
  if (normalized.length === 2) return normalized;

  // Common country name mappings
  const countryMap: Record<string, string> = {
    'UNITED STATES': 'US',
    'USA': 'US',
    'CANADA': 'CA',
    'MEXICO': 'MX',
    'UNITED KINGDOM': 'GB',
    'UK': 'GB',
  };

  return countryMap[normalized] || 'US';
}

/**
 * Transform an IQR order to ShipStation format
 */
function transformOrder(iqrOrder: IQROrder, storeId?: number): ShipStationOrder {
  const countryCode = normalizeCountryCode(iqrOrder.shippingAddress.country);

  return {
    orderNumber: iqrOrder.orderNumber,
    orderKey: `IQR-${iqrOrder.orderId}`, // Unique key for idempotency
    orderDate: iqrOrder.orderDate,
    orderStatus: 'awaiting_shipment',
    customerEmail: iqrOrder.customerEmail,
    // ShipStation requires billTo - use same as shipTo if not provided
    billTo: {
      name: iqrOrder.customerName,
      street1: iqrOrder.shippingAddress.street1,
      street2: iqrOrder.shippingAddress.street2,
      city: iqrOrder.shippingAddress.city,
      state: iqrOrder.shippingAddress.state,
      postalCode: iqrOrder.shippingAddress.postalCode,
      country: countryCode,
    },
    shipTo: {
      name: iqrOrder.customerName,
      street1: iqrOrder.shippingAddress.street1,
      street2: iqrOrder.shippingAddress.street2,
      city: iqrOrder.shippingAddress.city,
      state: iqrOrder.shippingAddress.state,
      postalCode: iqrOrder.shippingAddress.postalCode,
      country: countryCode,
    },
    items: iqrOrder.lineItems.map(item => ({
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      weight: item.weight ? { value: item.weight, units: 'pounds' as const } : undefined,
    })),
    advancedOptions: {
      storeId: storeId,
      customField1: `IQR Order ID: ${iqrOrder.orderId}`,
    },
  };
}

/**
 * Sync orders from IQ Reseller to ShipStation
 */
export async function syncOrders(options?: {
  fromDate?: string;
  toDate?: string;
  orderStatus?: string;
}): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    ordersProcessed: 0,
    ordersFailed: 0,
    errors: [],
  };

  logger.syncStart('Order', options);
  performanceMonitor.start('order-sync-full');

  try {
    // Get the ShipStation store ID for the configured store
    let storeId: number | undefined;
    try {
      const store = await shipStationClient.getStoreByName(config.shipStation.storeName);
      if (store) {
        storeId = store.storeId;
        logger.info(`Using ShipStation store: ${store.storeName} (ID: ${storeId})`);
      } else {
        logger.warn(`Store "${config.shipStation.storeName}" not found in ShipStation. Orders will be created without a specific store.`);
      }
    } catch (error) {
      logger.error('Failed to fetch ShipStation store', error as Error);
      logger.warn('Continuing without store ID - orders may not appear in the correct store');
    }

    // Fetch orders from IQ Reseller with filters
    performanceMonitor.start('fetch-orders');
    const orders = await iqrClient.getOrdersToSync({
      statuses: options?.orderStatus ? [options.orderStatus] : ['Open', 'Partial'],
      daysBack: 1, // Last 24 hours (1 day)
      agentChannel: 'DPC - Agent Quickbooks', // Filter for DPC - Agent Quickbooks (ID: 388003)
    });
    performanceMonitor.end('fetch-orders', { count: orders.length });

    logger.info('Orders fetched from IQR', { count: orders.length });

    if (orders.length === 0) {
      performanceMonitor.end('order-sync-full');
      return result;
    }

    // Process orders in batches with parallel processing
    performanceMonitor.start('process-orders');

    await processInBatches(
      orders,
      async (iqrOrder) => {
        try {
          const shipStationOrder = transformOrder(iqrOrder, storeId);
          await shipStationClient.createOrder(shipStationOrder);
          result.ordersProcessed++;
          logger.debug('Order synced to ShipStation', {
            orderNumber: iqrOrder.orderNumber,
            orderId: iqrOrder.orderId,
            storeId: storeId,
          });
        } catch (error) {
          result.ordersFailed++;
          const errorMessage = error instanceof Error ? error.message : String(error);
          result.errors.push({
            orderNumber: iqrOrder.orderNumber,
            error: errorMessage,
          });
          logger.error('Failed to sync order', error as Error, {
            orderNumber: iqrOrder.orderNumber,
            orderId: iqrOrder.orderId,
          });
        }
      },
      config.sync.batchSize,
      5, // Concurrency: 5 parallel requests
      500 // 500ms delay between batches
    );

    performanceMonitor.end('process-orders', {
      processed: result.ordersProcessed,
      failed: result.ordersFailed,
    });
  } catch (error) {
    result.success = false;
    logger.syncError('Order', error as Error);
    performanceMonitor.end('order-sync-full', { success: false });

    // Track the error
    activityTracker.recordError(
      error instanceof Error ? error.message : 'Unknown sync error'
    );

    throw error;
  }

  const duration = performanceMonitor.end('order-sync-full', {
    processed: result.ordersProcessed,
    failed: result.ordersFailed,
    success: true,
  });

  logger.syncComplete('Order', {
    processed: result.ordersProcessed,
    failed: result.ordersFailed,
    duration,
  });

  // Track activity
  activityTracker.recordSync({
    success: result.success,
    ordersProcessed: result.ordersProcessed,
    ordersFailed: result.ordersFailed,
    duration: duration || 0,
    message: result.ordersProcessed > 0
      ? `Synced ${result.ordersProcessed} orders`
      : 'No new orders to sync',
  });

  // Log performance stats
  const stats = performanceMonitor.getAllStats();
  logger.info('Sync performance metrics', { stats });

  return result;
}

// Store the interval ID so we can stop/start it
let syncIntervalId: NodeJS.Timeout | null = null;

/**
 * Run the sync on a schedule
 */
export function startScheduledSync(): void {
  // Don't start if already running
  if (syncIntervalId) {
    logger.warn('Scheduled sync already running');
    return;
  }

  const intervalMs = config.sync.intervalMinutes * 60 * 1000;

  logger.info('Scheduled sync initialized', {
    intervalMinutes: config.sync.intervalMinutes,
  });

  // Run immediately on start (only if enabled)
  if (config.sync.enabled) {
    syncOrders().catch((error) => {
      logger.error('Scheduled sync failed', error);
    });
  }

  // Then run on schedule
  syncIntervalId = setInterval(() => {
    // Check if sync is enabled before running
    if (config.sync.enabled) {
      syncOrders().catch((error) => {
        logger.error('Scheduled sync failed', error);
      });
    } else {
      logger.debug('Scheduled sync skipped - sync is paused');
    }
  }, intervalMs);
}

/**
 * Stop the scheduled sync
 */
export function stopScheduledSync(): void {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
    logger.info('Scheduled sync stopped');
  }
}

/**
 * Check if scheduled sync is running
 */
export function isScheduledSyncRunning(): boolean {
  return syncIntervalId !== null;
}

