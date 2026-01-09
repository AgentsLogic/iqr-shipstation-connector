/**
 * Tests for Order Sync Service
 */

import { syncOrders } from '../order-sync.service';

// Mock the clients
jest.mock('../../clients/iqr-client', () => ({
  iqrClient: {
    getOrders: jest.fn(),
    endSession: jest.fn(),
  },
}));

jest.mock('../../clients/shipstation-client', () => ({
  shipStationClient: {
    createOrder: jest.fn(),
  },
}));

// Mock config
jest.mock('../../config', () => ({
  config: {
    sync: {
      batchSize: 10,
      maxRetries: 3,
    },
  },
}));

import { iqrClient } from '../../clients/iqr-client';
import { shipStationClient } from '../../clients/shipstation-client';

describe('Order Sync Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('syncOrders', () => {
    it('should return empty result when no orders found', async () => {
      (iqrClient.getOrders as jest.Mock).mockResolvedValue([]);

      const result = await syncOrders();

      expect(result.success).toBe(true);
      expect(result.ordersProcessed).toBe(0);
      expect(result.ordersFailed).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(iqrClient.endSession).toHaveBeenCalled();
    });

    it('should sync orders successfully', async () => {
      const mockOrders = [
        {
          orderId: '123',
          orderNumber: 'ORD-001',
          orderDate: '2024-01-15T10:00:00Z',
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          shippingAddress: {
            street1: '123 Main St',
            city: 'Austin',
            state: 'TX',
            postalCode: '78701',
            country: 'US',
          },
          lineItems: [
            { sku: 'SKU-001', name: 'Widget', quantity: 2, unitPrice: 29.99 },
          ],
          status: 'Approved',
        },
      ];

      (iqrClient.getOrders as jest.Mock).mockResolvedValue(mockOrders);
      (shipStationClient.createOrder as jest.Mock).mockResolvedValue({
        orderId: 456,
        orderNumber: 'ORD-001',
      });

      const result = await syncOrders();

      expect(result.success).toBe(true);
      expect(result.ordersProcessed).toBe(1);
      expect(result.ordersFailed).toBe(0);
      expect(shipStationClient.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          orderNumber: 'ORD-001',
          orderKey: 'IQR-123',
          orderStatus: 'awaiting_shipment',
          shipTo: expect.objectContaining({
            name: 'John Doe',
            city: 'Austin',
          }),
        })
      );
      expect(iqrClient.endSession).toHaveBeenCalled();
    });

    it('should handle ShipStation errors gracefully', async () => {
      const mockOrders = [
        {
          orderId: '123',
          orderNumber: 'ORD-001',
          orderDate: '2024-01-15T10:00:00Z',
          customerName: 'John Doe',
          shippingAddress: {
            street1: '123 Main St',
            city: 'Austin',
            state: 'TX',
            postalCode: '78701',
            country: 'US',
          },
          lineItems: [],
          status: 'Approved',
        },
      ];

      (iqrClient.getOrders as jest.Mock).mockResolvedValue(mockOrders);
      (shipStationClient.createOrder as jest.Mock).mockRejectedValue(
        new Error('ShipStation API error')
      );

      const result = await syncOrders();

      expect(result.success).toBe(true);
      expect(result.ordersProcessed).toBe(0);
      expect(result.ordersFailed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        orderNumber: 'ORD-001',
        error: 'ShipStation API error',
      });
      expect(iqrClient.endSession).toHaveBeenCalled();
    });

    it('should process orders with date filters', async () => {
      (iqrClient.getOrders as jest.Mock).mockResolvedValue([]);

      await syncOrders({
        fromDate: '2024-01-01',
        toDate: '2024-01-31',
        orderStatus: 'Approved',
      });

      expect(iqrClient.getOrders).toHaveBeenCalledWith({
        status: 'Approved',
        fromDate: '2024-01-01',
        toDate: '2024-01-31',
      });
    });
  });
});

