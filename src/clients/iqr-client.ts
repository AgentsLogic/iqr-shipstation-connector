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

    // STRATEGY 1: Try to fetch Luis's specific orders directly by order number
    console.log('[IQRClient] 🔍 STRATEGY 1: Trying to fetch specific orders #38791, #38792, #38793...');

    const targetOrderNumbers = [38793, 38792, 38791];
    const directFetchEndpoints = [
      { path: '/webapi.svc/SO/JSON/GetSO', method: 'GET' as const },
      { path: '/webapi.svc/SO/JSON/GetSO', method: 'POST' as const },
      { path: '/webapi.svc/Order/json/GetOrder', method: 'POST' as const },
      { path: '/webapi.svc/SalesOrder/JSON/GetSO', method: 'GET' as const },
    ];

    for (const orderNum of targetOrderNumbers) {
      for (const { path, method } of directFetchEndpoints) {
        try {
          console.log(`[IQRClient] Trying ${method} ${path} for order #${orderNum}...`);

          let result: any;
          if (method === 'GET') {
            result = await this.request<any>(`${path}/${orderNum}`, { method: 'GET' });
          } else {
            result = await this.request<any>(path, {
              method: 'POST',
              body: { OrderId: orderNum, so: orderNum, SONumber: orderNum }
            });
          }

          if (result) {
            console.log(`[IQRClient] ✅ FOUND ORDER #${orderNum}!`);
            console.log(`[IQRClient] Result:`, JSON.stringify(result).substring(0, 500));

            // If we found it, add to allOrders
            if (Array.isArray(result)) {
              allOrders = allOrders.concat(result);
            } else {
              allOrders.push(result);
            }
            break; // Found this order, try next order number
          }
        } catch (e: any) {
          // Only log first 50 chars of error
          const errMsg = e.message.substring(0, 50);
          if (!errMsg.includes('404')) {
            console.log(`[IQRClient] ${path}: ${errMsg}`);
          }
        }
      }
    }

    // STRATEGY 2: Try GetSOs with different query parameters
    console.log('[IQRClient] 🔍 STRATEGY 2: Trying GetSOs with filters...');

    const filterAttempts: Array<Record<string, string | number>> = [
      { SONumber: 38793, Page: 0, PageSize: 10, SortBy: 0 },
      { so: 38793, Page: 0, PageSize: 10, SortBy: 0 },
      { Status: 'Open', Page: 0, PageSize: 10, SortBy: 0 },
      { ClientId: 'LUISTORRES', Page: 0, PageSize: 10, SortBy: 0 },
      { clientid: 'LUISTORRES', Page: 0, PageSize: 10, SortBy: 0 },
    ];

    for (const queryParams of filterAttempts) {
      try {
        console.log(`[IQRClient] Trying GetSOs with filter:`, queryParams);
        const orders = await this.request<any[]>('/webapi.svc/SO/JSON/GetSOs', {
          method: 'GET',
          queryParams,
        });

        if (orders && Array.isArray(orders) && orders.length > 0) {
          console.log(`[IQRClient] ✅ Filter worked! Got ${orders.length} orders`);
          const sample = orders[0];
          console.log(`[IQRClient] Sample: #${sample.so} client=${sample.clientid} date=${sample.saledate}`);

          // Check if we got Luis's orders
          const luisOrders = orders.filter((o: any) => o.so === 38791 || o.so === 38792 || o.so === 38793);
          if (luisOrders.length > 0) {
            console.log(`[IQRClient] 🎉 FOUND LUIS'S ORDERS via filter!`);
            allOrders = allOrders.concat(orders);
            break;
          }
        }
      } catch (e: any) {
        console.log(`[IQRClient] Filter failed: ${e.message.substring(0, 50)}`);
      }
    }

    // STRATEGY 3: Quick fetch - pages 0-40 with size 100, then 160-185 with size 25
    // This gets us orders from 2014 to June 2024 without timing out
    console.log('[IQRClient] 🔍 STRATEGY 3: Quick fetch (pages 0-40 + 160-185)...');

    // Part A: Fetch pages 0-40 with pageSize=100 (known working, ~4100 orders)
    console.log('[IQRClient] Fetching pages 0-40 (size 100)...');
    for (let p = 0; p <= 40; p++) {
      try {
        const rawOrders = await this.request<IQRRawOrder[]>(
          '/webapi.svc/SO/JSON/GetSOs',
          {
            method: 'GET',
            queryParams: { Page: p, PageSize: 100, SortBy: 0 },
          }
        );

        if (rawOrders && rawOrders.length > 0) {
          // Check for Luis's orders in each page
          const luisOrders = rawOrders.filter(o =>
            o.so === 38791 || o.so === 38792 || o.so === 38793
          );
          if (luisOrders.length > 0) {
            console.log(`[IQRClient] 🎉 FOUND LUIS'S ORDERS on page ${p}!`);
            luisOrders.forEach(o => console.log(`[IQRClient]   Order #${o.so}: ${o.saledate}`));
          }

          allOrders = allOrders.concat(rawOrders);

          if (p % 10 === 0) {
            const last = rawOrders[rawOrders.length - 1];
            console.log(`[IQRClient] Page ${p}: last #${last.so} (${last.saledate})`);
          }
        } else {
          break;
        }
      } catch (error: any) {
        console.log(`[IQRClient] Page ${p} error: ${error.message.substring(0, 40)}`);
        break;
      }
    }

    console.log(`[IQRClient] After pages 0-40: ${allOrders.length} orders`);

    // Part B: Fetch pages 160-185 with pageSize=25 (newer orders, June 2024)
    console.log('[IQRClient] Fetching pages 160-185 (size 25) for newer orders...');
    for (let p = 160; p <= 185; p++) {
      try {
        const rawOrders = await this.request<IQRRawOrder[]>(
          '/webapi.svc/SO/JSON/GetSOs',
          {
            method: 'GET',
            queryParams: { Page: p, PageSize: 25, SortBy: 0 },
          }
        );

        if (rawOrders && rawOrders.length > 0) {
          // Check for Luis's orders or 2026 orders
          const targetOrders = rawOrders.filter(o =>
            o.so === 38791 || o.so === 38792 || o.so === 38793 ||
            (o.saledate && o.saledate.includes('2026'))
          );
          if (targetOrders.length > 0) {
            console.log(`[IQRClient] 🎉 FOUND TARGET ORDERS on page ${p}!`);
            targetOrders.forEach(o => console.log(`[IQRClient]   Order #${o.so}: ${o.saledate}`));
          }

          allOrders = allOrders.concat(rawOrders);

          const last = rawOrders[rawOrders.length - 1];
          console.log(`[IQRClient] Page ${p} (size 25): last #${last.so} (${last.saledate})`);
        } else {
          console.log(`[IQRClient] Page ${p}: empty`);
          break;
        }
      } catch (error: any) {
        console.log(`[IQRClient] Page ${p} error: ${error.message.substring(0, 40)}`);
        // "Object reference" error means we've gone past the end
        if (error.message.includes('Object reference') || error.message.includes('cast')) {
          console.log(`[IQRClient] Reached end of data at page ${p}`);
          break;
        }
        // Continue trying next pages on other errors
      }
    }

    // Summary
    console.log(`[IQRClient] ========================================`);
    console.log(`[IQRClient] TOTAL ORDERS FETCHED: ${allOrders.length}`);

    // Find the newest order
    let newestDate = '';
    let newestOrderNum = 0;
    for (const o of allOrders) {
      if (o.saledate && o.saledate > newestDate) {
        newestDate = o.saledate;
        newestOrderNum = o.so || 0;
      }
    }
    console.log(`[IQRClient] NEWEST ORDER: #${newestOrderNum} (${newestDate})`);
    console.log(`[IQRClient] ========================================`);

    // Check if we found any 2026 orders
    const orders2026 = allOrders.filter(o => o.saledate && o.saledate.includes('2026'));
    console.log(`[IQRClient] Orders from 2026: ${orders2026.length}`);

    // Check for Luis's specific orders
    const foundLuisOrders = allOrders.filter(o => o.so === 38791 || o.so === 38792 || o.so === 38793);
    console.log(`[IQRClient] Luis's orders (38791-38793): ${foundLuisOrders.length}`);

    if (foundLuisOrders.length > 0) {
      console.log(`[IQRClient] 🎉🎉🎉 SUCCESS! Found Luis's orders!`);
      foundLuisOrders.forEach(o => console.log(`[IQRClient]   #${o.so}: ${o.saledate} status=${o.status}`));
    } else {
      console.log(`[IQRClient] ❌ Luis's orders NOT FOUND in API response`);
      console.log(`[IQRClient] This means the IQR API does not contain orders from Jan 2026`);
    }

    if (allOrders.length > 0) {
      const orders = allOrders.map(raw => this.transformOrder(raw));
      return orders;
    }

    // STRATEGY 4: Fallback - should not reach here
    console.log('[IQRClient] 🔍 STRATEGY 4: Fetching pages 0-40 (known working range)...');

    let fallbackPage = 0;
    let hasMore = true;
    let pagesProcessed = 0;
    const maxPages = 41; // Stop before page 41 which times out

    while (hasMore && pagesProcessed < maxPages) {
      console.log(`[IQRClient] Fetching page ${fallbackPage}...`);

      try {
        const rawOrders = await this.request<IQRRawOrder[]>(
          '/webapi.svc/SO/JSON/GetSOs',
          {
            method: 'GET',
            queryParams: {
              Page: fallbackPage,
              PageSize: pageSize,
              SortBy: 0,
            },
          }
        );

        const ordersReceived = rawOrders?.length || 0;
        console.log(`[IQRClient] Page ${fallbackPage}: Received ${ordersReceived} orders`);

        if (ordersReceived === 0) {
          console.log(`[IQRClient] No more orders at page ${fallbackPage}`);
          hasMore = false;
        } else {
          allOrders = allOrders.concat(rawOrders);

          // Log the last order on this page to track progress
          if (rawOrders.length > 0) {
            const lastOrder = rawOrders[rawOrders.length - 1];
            console.log(`[IQRClient] Page ${fallbackPage} last order: #${lastOrder.so} (${lastOrder.saledate || 'no date'})`);
          }

          // If we got fewer orders than the page size, we've reached the end
          if (ordersReceived < pageSize) {
            console.log(`[IQRClient] Reached end of orders at page ${fallbackPage} (received ${ordersReceived} < ${pageSize})`);
            hasMore = false;
          } else {
            fallbackPage++;
            pagesProcessed++;
          }
        }
      } catch (error: any) {
        // If we hit a 404 or any error, we've reached the end
        console.log(`[IQRClient] Error fetching page ${fallbackPage}: ${error.message}`);
        console.log(`[IQRClient] Stopping pagination at page ${fallbackPage}`);
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

