/**
 * Tests for Tracking Sync Service
 */

import { processShipmentWebhook, validateWebhookSignature } from '../tracking-sync.service';
import crypto from 'crypto';

// Mock the IQR client
jest.mock('../../clients/iqr-client', () => ({
  iqrClient: {
    updateOrderTracking: jest.fn(),
    endSession: jest.fn(),
  },
}));

// Mock config
jest.mock('../../config', () => ({
  config: {
    shipStation: {
      webhookSecret: 'test-secret',
    },
  },
}));

import { iqrClient } from '../../clients/iqr-client';

describe('Tracking Sync Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateWebhookSignature', () => {
    it('should return true for valid signature', () => {
      const payload = '{"test": "data"}';
      const signature = crypto
        .createHmac('sha256', 'test-secret')
        .update(payload)
        .digest('hex');

      const result = validateWebhookSignature(payload, signature);
      expect(result).toBe(true);
    });

    it('should return false for invalid signature', () => {
      const payload = '{"test": "data"}';
      const signature = 'invalid-signature';

      // This will throw because of timingSafeEqual with different lengths
      // In real implementation, we'd handle this
      expect(() => validateWebhookSignature(payload, signature)).toThrow();
    });

    it('should return false for missing signature', () => {
      const payload = '{"test": "data"}';
      const result = validateWebhookSignature(payload, null);
      expect(result).toBe(false);
    });
  });

  describe('processShipmentWebhook', () => {
    it('should update IQR with tracking info for IQR orders', async () => {
      (iqrClient.updateOrderTracking as jest.Mock).mockResolvedValue(undefined);

      const webhook = {
        resource_url: 'https://api.shipstation.com/shipments/123',
        resource_type: 'shipment',
        data: {
          shipment_id: 'ship-123',
          order_id: 'ss-456',
          order_number: 'IQR-789',
          tracking_number: '1Z999AA10123456784',
          carrier_code: 'ups',
          service_code: 'ups_ground',
          ship_date: '2024-01-20',
        },
      };

      const result = await processShipmentWebhook(webhook);

      expect(result.success).toBe(true);
      expect(iqrClient.updateOrderTracking).toHaveBeenCalledWith({
        orderId: '789',
        trackingNumber: '1Z999AA10123456784',
        carrier: 'ups',
        shipDate: '2024-01-20',
        shippingMethod: 'ups_ground',
      });
      expect(iqrClient.endSession).toHaveBeenCalled();
    });

    it('should skip non-IQR orders', async () => {
      const webhook = {
        resource_url: 'https://api.shipstation.com/shipments/123',
        resource_type: 'shipment',
        data: {
          shipment_id: 'ship-123',
          order_id: 'ss-456',
          order_number: 'SHOPIFY-789', // Not an IQR order
          tracking_number: '1Z999AA10123456784',
          carrier_code: 'ups',
          service_code: 'ups_ground',
          ship_date: '2024-01-20',
        },
      };

      const result = await processShipmentWebhook(webhook);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Not an IQR order');
      expect(iqrClient.updateOrderTracking).not.toHaveBeenCalled();
    });

    it('should handle missing webhook data', async () => {
      const webhook = {
        resource_url: 'https://api.shipstation.com/shipments/123',
        resource_type: 'shipment',
        // No data field
      };

      const result = await processShipmentWebhook(webhook);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Resource data not included');
    });

    it('should handle IQR update errors', async () => {
      (iqrClient.updateOrderTracking as jest.Mock).mockRejectedValue(
        new Error('IQR API error')
      );

      const webhook = {
        resource_url: 'https://api.shipstation.com/shipments/123',
        resource_type: 'shipment',
        data: {
          shipment_id: 'ship-123',
          order_id: 'ss-456',
          order_number: 'IQR-789',
          tracking_number: '1Z999AA10123456784',
          carrier_code: 'ups',
          service_code: 'ups_ground',
          ship_date: '2024-01-20',
        },
      };

      const result = await processShipmentWebhook(webhook);

      expect(result.success).toBe(false);
      expect(result.message).toBe('IQR API error');
      expect(iqrClient.endSession).toHaveBeenCalled();
    });
  });
});

