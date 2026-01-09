/**
 * Tracking Sync Service
 * 
 * Handles receiving shipment/tracking updates from ShipStation
 * and updating IQ Reseller with the tracking information
 */

import { iqrClient, IQRTrackingUpdate } from '../clients/iqr-client';
import { config } from '../config';
import { logger } from '../utils/logger';
import crypto from 'crypto';

/**
 * ShipStation webhook payload for fulfillment_shipped_v2 event
 */
export interface ShipStationShipmentWebhook {
  resource_url: string;
  resource_type: string;
  data?: {
    shipment_id: string;
    order_id: string;
    order_number: string;
    tracking_number: string;
    carrier_code: string;
    service_code: string;
    ship_date: string;
    shipment_cost?: number;
  };
}

/**
 * Validate webhook signature from ShipStation
 */
export function validateWebhookSignature(
  payload: string,
  signature: string | null
): boolean {
  if (!config.shipStation.webhookSecret) {
    logger.warn('No webhook secret configured, skipping signature validation');
    return true;
  }

  if (!signature) {
    logger.warn('Missing webhook signature');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', config.shipStation.webhookSecret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Extract IQR Order ID from ShipStation order
 * We stored it in advancedOptions.customField1 when creating the order
 */
function extractIQROrderId(orderNumber: string, customField1?: string): string | null {
  // Try to extract from custom field first
  if (customField1) {
    const match = customField1.match(/IQR Order ID: (.+)/);
    if (match) return match[1];
  }

  // Fallback: if orderNumber follows our format
  if (orderNumber.startsWith('IQR-')) {
    return orderNumber.replace('IQR-', '');
  }

  return null;
}

/**
 * Process a shipment webhook from ShipStation
 */
export async function processShipmentWebhook(
  webhook: ShipStationShipmentWebhook
): Promise<{ success: boolean; message: string }> {
  logger.info('Processing shipment webhook', {
    resourceType: webhook.resource_type,
    resourceUrl: webhook.resource_url,
  });

  if (!webhook.data) {
    // Need to fetch the resource data
    logger.warn('Resource data not included in webhook', {
      resourceUrl: webhook.resource_url,
    });
    return { success: false, message: 'Resource data not included in webhook' };
  }

  const { order_number, tracking_number, carrier_code, ship_date, service_code } = webhook.data;

  // Extract the IQR order ID
  const iqrOrderId = extractIQROrderId(order_number);

  if (!iqrOrderId) {
    logger.debug('Order is not an IQR order, skipping', { orderNumber: order_number });
    return { success: true, message: 'Not an IQR order' };
  }

  try {
    const trackingUpdate: IQRTrackingUpdate = {
      orderId: iqrOrderId,
      trackingNumber: tracking_number,
      carrier: carrier_code,
      shipDate: ship_date,
      shippingMethod: service_code,
    };

    await iqrClient.updateOrderTracking(trackingUpdate);

    logger.info('Tracking updated in IQR', {
      orderId: iqrOrderId,
      trackingNumber: tracking_number,
      carrier: carrier_code,
    });

    return { success: true, message: `Updated tracking for order ${iqrOrderId}` };
  } catch (error) {
    logger.error('Failed to update tracking in IQR', error as Error, {
      orderId: iqrOrderId,
      orderNumber: order_number,
    });

    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await iqrClient.endSession();
  }
}

/**
 * Poll ShipStation for recent shipments and update IQR
 * Alternative to webhooks for environments that can't receive webhooks
 */
export async function pollForShipments(sinceDate?: string): Promise<void> {
  const { shipStationClient } = await import('../clients/shipstation-client');
  
  const fromDate = sinceDate || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  console.log(`[TrackingSync] Polling for shipments since ${fromDate}`);
  
  const { shipments } = await shipStationClient.listShipments({
    createDateStart: fromDate,
  });

  console.log(`[TrackingSync] Found ${shipments.length} shipments`);

  for (const shipment of shipments) {
    const iqrOrderId = extractIQROrderId(shipment.orderNumber);
    
    if (!iqrOrderId) continue;

    try {
      await iqrClient.updateOrderTracking({
        orderId: iqrOrderId,
        trackingNumber: shipment.trackingNumber,
        carrier: shipment.carrierCode,
        shipDate: shipment.shipDate,
        shippingMethod: shipment.serviceCode,
      });
    } catch (error) {
      console.error(`[TrackingSync] Failed to update order ${iqrOrderId}:`, error);
    }
  }

  await iqrClient.endSession();
}

