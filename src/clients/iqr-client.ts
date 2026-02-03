/**
 * IQ Reseller API Client
 * 
 * Handles authentication and API calls to IQ Reseller
 * Documentation: https://iqwebapidocumentation.azurewebsites.net/
 */

import { config } from '../config';

// Raw IQR API response structure
export interface IQRRawOrder {
  so: number;
  status: string;
  clientid: string;
  shiptocompany: string;
  shiptoaddress1: string;
  shiptoaddress2?: string;
  shiptoaddress3?: string;
  shiptocity: string;
  shiptostate: string;
  shiptopostalcode: string;
  shiptocountry: string;
  shiptoemail?: string;
  shiptocontact?: string;
  shiptophone?: string;
  saledate: string;
  total: number;
  SODetails: Array<{
    item: string;
    description: string;
    quantity: number;
    unitprice: number;
    serialnumber?: string;
    mfgr?: string;
    condition?: string;
  }>;
  // Custom fields that might contain agent channel
  userdefined1?: string;
  userdefined2?: string;
  userdefined3?: string;
  userdefined4?: string;
  userdefined5?: string;
}

// Transformed order format for our application
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
  // Keep raw order for reference
  raw: IQRRawOrder;
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

    // Debug: Log session token (first 10 chars only for security)
    console.log(`[IQRClient] Using session token: ${this.sessionToken?.substring(0, 10)}...`);

    // Add timeout to prevent hanging requests from crashing the server
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`[IQRClient] Request timeout after 30 seconds, aborting...`);
      controller.abort();
    }, 30000); // 30 second timeout

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Encoding': 'UTF8',
          'Accept': 'application/json',
          'iqr-session-token': this.sessionToken!,
        },
        body: options?.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - IQR API took too long to respond');
      }
      throw error;
    }
    clearTimeout(timeoutId);

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
   * Transform raw IQR order to our application format
   */
  private transformOrder(rawOrder: IQRRawOrder): IQROrder {
    return {
      orderId: String(rawOrder.so),
      orderNumber: String(rawOrder.so),
      orderDate: rawOrder.saledate,
      customerName: rawOrder.shiptocompany || rawOrder.clientid,
      customerEmail: rawOrder.shiptoemail,
      shippingAddress: {
        street1: rawOrder.shiptoaddress1 || '',
        street2: rawOrder.shiptoaddress2 || rawOrder.shiptoaddress3,
        city: rawOrder.shiptocity || '',
        state: rawOrder.shiptostate || '',
        postalCode: rawOrder.shiptopostalcode || '',
        country: rawOrder.shiptocountry || 'US',
      },
      lineItems: (rawOrder.SODetails || []).map(detail => ({
        sku: detail.item,
        name: detail.description?.trim() || detail.item,
        quantity: detail.quantity,
        unitPrice: detail.unitprice,
        weight: undefined, // IQR doesn't provide weight in API
      })),
      status: rawOrder.status?.trim() || '',
      raw: rawOrder,
    };
  }

  /**
   * Get Sales Orders from IQ Reseller
   * Endpoint confirmed working: GET /webapi.svc/SO/JSON/GetSOs
   *
   * Strategy: Fetch all pages from 0 to 3000 to get complete order history
   */
  async getOrders(params?: {
    status?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<IQROrder[]> {
    console.log('[IQRClient] Fetching sales orders from page 0 to 3000...');

    const allOrders: IQRRawOrder[] = [];
    let consecutiveEmptyPages = 0;

    // Fetch all pages from 0 to 3000
    console.log('[IQRClient] Starting comprehensive fetch from page 0...');

    for (let page = 0; page <= 3000 && consecutiveEmptyPages < 50; page++) {
      // Refresh session token every 500 pages (or if expired) to prevent timeout
      if (page > 0 && page % 500 === 0) {
        console.log(`[IQRClient] Page ${page}: Refreshing session token to prevent expiry...`);
        this.sessionToken = null; // Force re-authentication
        await this.authenticate();
      }

      try {
        const rawOrders = await this.request<IQRRawOrder[]>(
          '/webapi.svc/SO/JSON/GetSOs',
          {
            method: 'GET',
            queryParams: { Page: page, PageSize: 25, SortBy: 0 },
          }
        );

        if (!rawOrders || rawOrders.length === 0) {
          consecutiveEmptyPages++;
          if (page % 100 === 0) {
            console.log(`[IQRClient] Page ${page}: empty (${consecutiveEmptyPages} consecutive empty)`);
          }
          continue;
        }

        consecutiveEmptyPages = 0; // Reset on successful fetch
        allOrders.push(...rawOrders);

        const last = rawOrders[rawOrders.length - 1];

        if (page % 100 === 0 || page === 0) {
          console.log(`[IQRClient] Page ${page}: ${allOrders.length} total orders, last #${last.so} (${last.saledate})`);
        }

      } catch (error: any) {
        const errMsg = error.message || '';

        // Skip error pages (known issue with IQR API on certain pages)
        // Just log and continue to next page
        if (page % 100 === 0 || page < 50) {
          console.log(`[IQRClient] Page ${page} error (skipping): ${errMsg.substring(0, 50)}...`);
        }

        // Don't count errors as empty pages - just skip them
        continue;
      }
    }

    console.log(`[IQRClient] Total orders fetched: ${allOrders.length}`);

    // Find newest order
    let newestOrder = allOrders[0];
    for (const o of allOrders) {
      if (o.so && o.so > (newestOrder?.so || 0)) {
        newestOrder = o;
      }
    }
    if (newestOrder) {
      console.log(`[IQRClient] Newest order: #${newestOrder.so} (${newestOrder.saledate})`);
    }

    // Check for Luis's orders (38791, 38792, 38793)
    const luisOrders = allOrders.filter(o => o.so === 38791 || o.so === 38792 || o.so === 38793);
    if (luisOrders.length > 0) {
      console.log(`[IQRClient] 🎉 Found Luis's orders!`);
      luisOrders.forEach(o => console.log(`[IQRClient]   #${o.so}: ${o.saledate} client=${o.clientid} status=${o.status}`));
    } else {
      console.log(`[IQRClient] ❌ Luis's orders (38791-38793) NOT in API response`);
      // Check if any orders have LUISTORRES as client
      const luisClientOrders = allOrders.filter(o => o.clientid?.includes('LUIS'));
      if (luisClientOrders.length > 0) {
        console.log(`[IQRClient] Found ${luisClientOrders.length} orders with LUIS in clientid:`);
        luisClientOrders.slice(0, 5).forEach(o => console.log(`[IQRClient]   #${o.so}: ${o.saledate} client=${o.clientid}`));
      }
    }

    // Check for 2026 orders
    const orders2026 = allOrders.filter(o => o.saledate?.includes('2026'));
    console.log(`[IQRClient] Orders from 2026: ${orders2026.length}`);
    if (orders2026.length > 0) {
      console.log(`[IQRClient] 2026 orders sample:`);
      orders2026.slice(0, 5).forEach(o => console.log(`[IQRClient]   #${o.so}: ${o.saledate} client=${o.clientid}`));
    }

    // Transform and return
    if (allOrders.length > 0) {
      const orders = allOrders.map(raw => this.transformOrder(raw));
      console.log(`[IQRClient] Returning ${orders.length} orders`);
      return orders;
    }

    return [];
  }

  /**
   * Filter orders by status
   * Business Logic: Sync orders with status "Open" OR "Partial"
   */
  filterByStatus(orders: IQROrder[], statuses: string[]): IQROrder[] {
    return orders.filter(order => {
      const orderStatus = order.status;
      return statuses.some(status =>
        orderStatus.toLowerCase() === status.toLowerCase()
      );
    });
  }

  /**
   * Filter orders by date range
   * Business Logic: Only sync orders from last N days (default 30)
   */
  filterByDateRange(orders: IQROrder[], daysBack: number): IQROrder[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    console.log(`[IQRClient] Date filter cutoff: ${cutoffDate.toISOString()} (${daysBack} days back)`);

    // Debug: Log first 3 orders to see their dates
    if (orders.length > 0) {
      console.log('[IQRClient] Sample order dates (first 3):');
      orders.slice(0, 3).forEach((order, idx) => {
        console.log(`  Order ${idx + 1} (${order.orderNumber}): orderDate="${order.orderDate}"`);
      });
    }

    return orders.filter(order => {
      if (!order.orderDate) return false;
      const saleDate = new Date(order.orderDate);
      return saleDate >= cutoffDate;
    });
  }

  /**
   * Filter orders by agent channel
   * Searches userdefined1-5 fields for the channel name (e.g., "DPC - QUIC")
   */
  filterByAgentChannel(orders: IQROrder[], channelName: string): IQROrder[] {
    console.log(`[IQRClient] Filtering by agent channel: "${channelName}" in userdefined1-5 fields`);

    return orders.filter(order => {
      const raw = order.raw;
      const searchValue = channelName.toUpperCase();

      // Search all userdefined fields (1-5)
      const fields = [
        raw.userdefined1?.trim().toUpperCase() || '',
        raw.userdefined2?.trim().toUpperCase() || '',
        raw.userdefined3?.trim().toUpperCase() || '',
        raw.userdefined4?.trim().toUpperCase() || '',
        raw.userdefined5?.trim().toUpperCase() || '',
      ];

      const isMatch = fields.some(field => field === searchValue);

      if (isMatch) {
        console.log(`[IQRClient] ✓ Order ${order.orderNumber} matches: found "${channelName}" in userdefined fields`);
      }

      return isMatch;
    });
  }

  /**
   * Get orders ready to sync to ShipStation
   * Applies all business logic filters
   */
  async getOrdersToSync(options?: {
    statuses?: string[];
    daysBack?: number;
    agentChannel?: string;
  }): Promise<IQROrder[]> {
    const statuses = options?.statuses || ['Open', 'Partial'];
    const daysBack = options?.daysBack || 1; // Default to last 24 hours
    const agentChannel = options?.agentChannel;

    console.log('[IQRClient] Fetching orders to sync with filters:', {
      statuses,
      daysBack,
      agentChannel
    });

    let orders = await this.getOrders();
    console.log(`[IQRClient] Fetched ${orders.length} total orders`);

    // Apply status filter
    orders = this.filterByStatus(orders, statuses);
    console.log(`[IQRClient] After status filter (${statuses.join(', ')}): ${orders.length} orders`);

    // Apply date range filter
    orders = this.filterByDateRange(orders, daysBack);
    console.log(`[IQRClient] After date filter (last ${daysBack} days): ${orders.length} orders`);

    // Apply agent channel filter if specified
    if (agentChannel) {
      orders = this.filterByAgentChannel(orders, agentChannel);
      console.log(`[IQRClient] After channel filter ("${agentChannel}"): ${orders.length} orders`);
    }

    return orders;
  }

  /**
   * Update Sales Order User Defined Fields with tracking information
   * TODO: Confirm endpoint and field mapping with IQR team
   */
  async updateOrderTracking(update: IQRTrackingUpdate): Promise<void> {
    console.log(`[IQRClient] Updating tracking for SO ID ${update.orderId}...`);
    // TODO: Confirm this endpoint works for updating tracking
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

