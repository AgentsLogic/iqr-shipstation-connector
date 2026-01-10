/**
 * IQ Reseller API Client
 * 
 * Handles authentication and API calls to IQ Reseller
 * Documentation: https://iqwebapidocumentation.azurewebsites.net/
 */

import { config } from '../config';

export interface IQROrder {
  orderId: string;
  orderNumber: string;
  orderDate: string;
  customerName: string;
  customerEmail?: string;
  shippingAddress: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  lineItems: Array<{
    sku: string;
    name: string;
    quantity: number;
    unitPrice: number;
    weight?: number;
  }>;
  status: string;
  // Add more fields as needed based on IQR API response
}

export interface IQRTrackingUpdate {
  orderId: string;
  trackingNumber: string;
  carrier: string;
  shipDate: string;
  shippingMethod?: string;
}

export class IQRClient {
  private sessionToken: string | null = null;
  private sessionExpiry: number = 0;
  private authPromise: Promise<void> | null = null;
  private readonly apiKey: string;
  private readonly authUrl: string;
  private readonly apiBaseUrl: string;

  constructor() {
    this.apiKey = config.iqr.apiKey;
    this.authUrl = config.iqr.authUrl;
    this.apiBaseUrl = config.iqr.apiBaseUrl;
  }

  /**
   * Check if session token is still valid
   */
  private isSessionValid(): boolean {
    return this.sessionToken !== null && Date.now() < this.sessionExpiry;
  }

  /**
   * Generate a session token for API access
   * Implements caching and prevents concurrent auth requests
   */
  async authenticate(): Promise<void> {
    // Return if session is still valid
    if (this.isSessionValid()) {
      console.log('[IQRClient] Using cached session token');
      return;
    }

    // If authentication is already in progress, wait for it
    if (this.authPromise) {
      console.log('[IQRClient] Authentication in progress, waiting...');
      return this.authPromise;
    }

    // Start new authentication
    this.authPromise = (async () => {
      try {
        console.log('[IQRClient] Authenticating with IQR API...');

        const response = await fetch(`${this.authUrl}/api/IntegrationAPI/Session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Encoding': 'UTF8',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ APIToken: this.apiKey }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.log('[IQRClient] Error response:', errorText);
          throw new Error(`IQR authentication failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json() as { Data: string };
        this.sessionToken = data.Data;
        // Set expiry to 55 minutes (assuming 60 min session timeout)
        this.sessionExpiry = Date.now() + (55 * 60 * 1000);
        console.log('[IQRClient] Successfully authenticated, session token cached');
      } finally {
        this.authPromise = null;
      }
    })();

    return this.authPromise;
  }

  /**
   * End the current session
   */
  async endSession(): Promise<void> {
    if (!this.sessionToken) return;

    await fetch(`${this.authUrl}/api/IntegrationAPI/Session`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.sessionToken}`,
      },
    });

    this.sessionToken = null;
    console.log('[IQRClient] Session ended');
  }

  /**
   * Make an authenticated API request
   */
  private async request<T>(
    endpoint: string,
    options?: {
      method?: 'GET' | 'POST';
      body?: object;
      queryParams?: Record<string, string | number>;
    }
  ): Promise<T> {
    if (!this.sessionToken) {
      await this.authenticate();
    }

    const method = options?.method || 'POST';
    let url = `${this.apiBaseUrl}${endpoint}`;

    // Add query parameters for GET requests
    if (options?.queryParams) {
      const params = new URLSearchParams();
      Object.entries(options.queryParams).forEach(([key, value]) => {
        params.append(key, String(value));
      });
      url += `?${params.toString()}`;
    }

    console.log(`[IQRClient] ${method} ${url}`);
    if (options?.body) {
      console.log('[IQRClient] Request body:', JSON.stringify(options.body));
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'UTF8',
        'Accept': 'application/json',
        'iqr-session-token': this.sessionToken!,
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    if (response.status === 401) {
      // Token expired, re-authenticate and retry
      console.log('[IQRClient] Session expired (401), re-authenticating...');
      await this.authenticate();
      return this.request<T>(endpoint, options);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.log('[IQRClient] API error response:', errorText);
      throw new Error(`IQR API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Get Sales Orders from IQ Reseller
   * Trying multiple endpoint patterns based on IQR API documentation
   */
  async getOrders(params?: {
    status?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<IQROrder[]> {
    console.log('[IQRClient] Fetching sales orders...');

    // Try POST method with body params (matching CV endpoint pattern from docs)
    const body = {
      Page: 0,      // 0 for all results
      PageSize: 100,  // Get first 100 orders
      SortBy: 0,
    };

    // Try lowercase 'json' pattern first (matches /CV/json/GetCVs from docs)
    const response = await this.request<{ Data: IQROrder[] }>(
      '/webapi.svc/SO/json/GetSOs',
      {
        method: 'POST',
        body,
      }
    );
    console.log('[IQRClient] Received', response.Data?.length || 0, 'orders');
    return response.Data || [];
  }

  /**
   * Update Sales Order User Defined Fields with tracking information
   * Endpoint verified from Postman collection
   */
  async updateOrderTracking(update: IQRTrackingUpdate): Promise<void> {
    console.log(`[IQRClient] Updating tracking for SO ID ${update.orderId}...`);
    await this.request('/webapi.svc/SO/UDFS/JSON', {
      method: 'POST',
      body: {
        sos: [
          {
            soid: update.orderId,
            userdefined1: update.trackingNumber,
            userdefined2: update.carrier,
            userdefined3: update.shippingMethod,
            userdefined4: update.shipDate,
          }
        ]
      }
    });
    console.log(`[IQRClient] Successfully updated tracking for SO ID ${update.orderId}`);
  }
}

export const iqrClient = new IQRClient();

