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
   * Returns array of orders directly (not wrapped in Data property)
   *
   * STRATEGY: Fetch pages 0-40 only (page 41+ causes timeout/crash)
   * Then try alternative endpoints to find recent orders
   */
  async getOrders(params?: {
    status?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<IQROrder[]> {
    console.log('[IQRClient] Fetching sales orders...');

    let allOrders: IQRRawOrder[] = [];
    const pageSize = 100;

    // STRATEGY 1: Try different shipment endpoints to find recent orders
    console.log('[IQRClient] 🔍 STRATEGY 1: Trying shipment endpoints...');

    const shipmentEndpoints = [
      '/webapi.svc/SalesOrder/JSON/GetShipments',
      '/webapi.svc/SO/JSON/GetShipments',
      '/webapi.svc/Shipment/JSON/GetShipments',
      '/webapi.svc/Order/JSON/GetShipments',
    ];

    for (const endpoint of shipmentEndpoints) {
      try {
        console.log(`[IQRClient] Trying ${endpoint}...`);
        const shipments = await this.request<any[]>(endpoint, {
          method: 'GET',
          queryParams: { Page: 0, PageSize: 10 },
        });

        if (shipments && Array.isArray(shipments) && shipments.length > 0) {
          console.log(`[IQRClient] ✅ ${endpoint} works! Got ${shipments.length} shipments`);
          console.log(`[IQRClient] Sample:`, JSON.stringify(shipments[0]).substring(0, 300));

          // Extract SO numbers
          const soNumbers = shipments.map((s: any) => s.so || s.SO || s.soid || s.SOID).filter(Boolean);
          if (soNumbers.length > 0) {
            console.log(`[IQRClient] SO numbers from shipments:`, soNumbers.slice(0, 10));
          }
          break;
        }
      } catch (e: any) {
        console.log(`[IQRClient] ${endpoint}: ${e.message.substring(0, 50)}`);
      }
    }

    // STRATEGY 2: Try to get orders by status filter (different endpoint variations)
    console.log('[IQRClient] 🔍 STRATEGY 2: Trying status-filtered endpoints...');

    const statusEndpoints = [
      { path: '/webapi.svc/SO/JSON/GetOpenSOs', name: 'GetOpenSOs' },
      { path: '/webapi.svc/SO/JSON/GetSaleOrders', name: 'GetSaleOrders' },
      { path: '/webapi.svc/SalesOrder/JSON/GetSOs', name: 'SalesOrder/GetSOs' },
    ];

    for (const { path, name } of statusEndpoints) {
      try {
        console.log(`[IQRClient] Trying ${name}...`);
        const orders = await this.request<any[]>(path, {
          method: 'GET',
          queryParams: { Page: 0, PageSize: 10 },
        });

        if (orders && Array.isArray(orders) && orders.length > 0) {
          console.log(`[IQRClient] ✅ ${name} works! Got ${orders.length} orders`);
          const sample = orders[0];
          console.log(`[IQRClient] Sample order: #${sample.so} status=${sample.status} date=${sample.saledate}`);
          break;
        }
      } catch (e: any) {
        console.log(`[IQRClient] ${name}: ${e.message.substring(0, 50)}`);
      }
    }

    // STRATEGY 3: Standard pagination for pages 0-40 (known working range)
    console.log('[IQRClient] 🔍 STRATEGY 3: Fetching pages 0-40 (known working range)...');

    let page = 0;
    let hasMore = true;
    let pagesProcessed = 0;
    const maxPages = 41; // Stop before page 41 which times out

    while (hasMore && pagesProcessed < maxPages) {
      console.log(`[IQRClient] Fetching page ${page}...`);

      try {
        const rawOrders = await this.request<IQRRawOrder[]>(
          '/webapi.svc/SO/JSON/GetSOs',
          {
            method: 'GET',
            queryParams: {
              Page: page,
              PageSize: pageSize,
              SortBy: 0,
            },
          }
        );

        const ordersReceived = rawOrders?.length || 0;
        console.log(`[IQRClient] Page ${page}: Received ${ordersReceived} orders`);

        if (ordersReceived === 0) {
          console.log(`[IQRClient] No more orders at page ${page}`);
          hasMore = false;
        } else {
          allOrders = allOrders.concat(rawOrders);

          // Log the last order on this page to track progress
          if (rawOrders.length > 0) {
            const lastOrder = rawOrders[rawOrders.length - 1];
            console.log(`[IQRClient] Page ${page} last order: #${lastOrder.so} (${lastOrder.saledate || 'no date'})`);
          }

          // If we got fewer orders than the page size, we've reached the end
          if (ordersReceived < pageSize) {
            console.log(`[IQRClient] Reached end of orders at page ${page} (received ${ordersReceived} < ${pageSize})`);
            hasMore = false;
          } else {
            page++;
            pagesProcessed++;
          }
        }
      } catch (error: any) {
        // If we hit a 404 or any error, we've reached the end
        console.log(`[IQRClient] Error fetching page ${page}: ${error.message}`);
        console.log(`[IQRClient] Stopping pagination at page ${page}`);
        hasMore = false;
      }
    }

    if (pagesProcessed >= maxPages) {
      console.warn(`[IQRClient] ⚠️  Stopped at page ${maxPages} to avoid timeout issue`);
    }

    console.log('[IQRClient] Total orders received:', allOrders.length);

    // Transform to our format
    const orders = allOrders.map(raw => this.transformOrder(raw));
    console.log('[IQRClient] Transformed', orders.length, 'orders');

    return orders;
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
   * Agent orders are identified by userdefined1 = "AGENT"
   */
  filterByAgentChannel(orders: IQROrder[], channelName: string): IQROrder[] {
    console.log(`[IQRClient] Filtering by agent channel: "${channelName}" in userdefined1 field`);

    return orders.filter(order => {
      const raw = order.raw;
      const userdefined1Value = raw.userdefined1?.toUpperCase() || '';
      const searchValue = channelName.toUpperCase();

      const isMatch = userdefined1Value === searchValue;

      if (isMatch) {
        console.log(`[IQRClient] ✓ Order ${order.orderNumber} matches: userdefined1="${raw.userdefined1}"`);
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
    const daysBack = options?.daysBack || 30;
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

