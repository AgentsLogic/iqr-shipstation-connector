/**
 * ShipStation API Client
 * 
 * Handles API calls to ShipStation
 * Documentation: https://www.shipstation.com/docs/api/
 */

import { config } from '../config';

export interface ShipStationOrder {
  orderNumber: string;
  orderKey?: string;
  orderDate: string;
  orderStatus: 'awaiting_payment' | 'awaiting_shipment' | 'shipped' | 'on_hold' | 'cancelled';
  customerEmail?: string;
  billTo?: ShipStationAddress;
  shipTo: ShipStationAddress;
  items: ShipStationOrderItem[];
  amountPaid?: number;
  shippingAmount?: number;
  customerNotes?: string;
  internalNotes?: string;
  tagIds?: number[];
  advancedOptions?: {
    warehouseId?: number;
    customField1?: string;
    customField2?: string;
    customField3?: string;
  };
}

export interface ShipStationAddress {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface ShipStationOrderItem {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  weight?: {
    value: number;
    units: 'pounds' | 'ounces' | 'grams';
  };
  productId?: number;
  fulfillmentSku?: string;
  options?: Array<{ name: string; value: string }>;
}

export interface ShipStationShipment {
  shipmentId: number;
  orderId: number;
  orderNumber: string;
  createDate: string;
  shipDate: string;
  trackingNumber: string;
  carrierCode: string;
  serviceCode: string;
  shipmentCost: number;
}

export interface ShipStationWebhook {
  webhook_id: string;
  url: string;
  event: string;
  name: string;
}

export class ShipStationClient {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly apiBaseUrl: string;
  private readonly authHeader: string;

  constructor() {
    this.apiKey = config.shipStation.apiKey;
    this.apiSecret = config.shipStation.apiSecret;
    this.apiBaseUrl = config.shipStation.apiBaseUrl;
    this.authHeader = 'Basic ' + Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');
  }

  /**
   * Make an authenticated API request
   */
  private async request<T>(
    endpoint: string,
    options: { method?: string; body?: object } = {}
  ): Promise<T> {
    const { method = 'GET', body } = options;

    const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.authHeader,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 429) {
      // Rate limited - wait and retry
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
      console.log(`[ShipStation] Rate limited, waiting ${retryAfter}s`);
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return this.request<T>(endpoint, options);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ShipStation API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Handle empty responses
    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
  }

  /**
   * Create or update an order in ShipStation
   */
  async createOrder(order: ShipStationOrder): Promise<{ orderId: number; orderNumber: string }> {
    return this.request('/orders/createorder', {
      method: 'POST',
      body: order,
    });
  }

  /**
   * Create or update multiple orders
   */
  async createOrders(orders: ShipStationOrder[]): Promise<{ results: Array<{ orderId: number; orderNumber: string }> }> {
    return this.request('/orders/createorders', {
      method: 'POST',
      body: orders,
    });
  }

  /**
   * Get an order by ID
   */
  async getOrder(orderId: number): Promise<ShipStationOrder> {
    return this.request(`/orders/${orderId}`);
  }

  /**
   * List shipments with optional filters
   */
  async listShipments(params?: {
    orderNumber?: string;
    createDateStart?: string;
    createDateEnd?: string;
  }): Promise<{ shipments: ShipStationShipment[] }> {
    const queryParams = new URLSearchParams(params as Record<string, string>);
    return this.request(`/shipments?${queryParams.toString()}`);
  }

  /**
   * Get shipment by order number
   */
  async getShipmentByOrderNumber(orderNumber: string): Promise<ShipStationShipment | null> {
    const result = await this.listShipments({ orderNumber });
    return result.shipments?.[0] || null;
  }
}

export const shipStationClient = new ShipStationClient();

