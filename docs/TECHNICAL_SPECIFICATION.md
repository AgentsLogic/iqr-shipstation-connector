# IQ Reseller ↔ ShipStation Connector
## Technical Specification Document

**Version:** 1.0  
**Date:** 2025-12-20  
**Status:** Draft

---

## 1. Executive Summary

This document outlines the technical specification for building a custom integration connector between **IQ Reseller (IQR)** and **ShipStation**. The connector will:

1. **Push B2B orders** from IQ Reseller's Sales Proposal & Order modules to ShipStation
2. **Receive shipment updates** (tracking numbers, ship dates, carriers) from ShipStation back to IQ Reseller

This connector replaces the current flow where B2B orders route through QuickBooks Online before reaching ShipStation.

---

## 2. Architecture Overview

### 2.1 Current State
```
QuickBooks Online (B2B) ──► ShipStation ──► WMS Connector ──► IQ Reseller (ERP)
Shopify (B2C) ────────────►
Amazon/eBay (B2C) ────────►
```

### 2.2 Future State
```
IQ Reseller (B2B Orders) ══► [NEW CONNECTOR] ══► ShipStation ──► WMS Connector ──► IQ Reseller
         ▲                                              │
         │                                              │
         └──────── Tracking/Ship Info ◄─────────────────┘

Shopify (B2C) ────────────► ShipStation
Amazon/eBay (B2C) ────────►
```

### 2.3 System Roles
| System | Role |
|--------|------|
| **IQ Reseller** | ERP System of Record, B2B Sales Proposals & Orders |
| **ShipStation** | Factory Operations System of Record |
| **QuickBooks Online** | Accounting (integrates with IQR directly in future state) |
| **Avalara AvaTax** | Tax calculation (integrates with ShipStation) |

---

## 3. API Integration Details

### 3.1 IQ Reseller API

**Documentation:** https://iqwebapidocumentation.azurewebsites.net/  
**Postman Collection:** https://postman.iqreseller.com/

#### Authentication Flow
1. Create API User in IQ Reseller Admin Portal
2. Obtain API Key
3. Generate Session Token via POST to `https://signin.iqreseller.com/api/IntegrationAPI/Session`
4. Use Session Token as `iqr-session-token` header for all subsequent API calls
5. End session via DELETE when complete

#### Key Endpoints (to be confirmed)
| Purpose | Endpoint | Method |
|---------|----------|--------|
| Generate Session | `https://signin.iqreseller.com/api/IntegrationAPI/Session` | POST |
| Get Orders | `https://api.iqreseller.com/webapi.svc/Order/json/GetOrders` | POST |
| Update Order | `https://api.iqreseller.com/webapi.svc/Order/json/UpdateOrder` | POST |
| End Session | `https://signin.iqreseller.com/api/IntegrationAPI/Session` | DELETE |

### 3.2 ShipStation API

**Documentation:** https://www.shipstation.com/docs/api/  
**API V2 Docs:** https://docs.shipstation.com/openapi/

#### Authentication
- API Key authentication via `api-key` header
- Rate limits apply based on account plan

#### Key Endpoints
| Purpose | Endpoint | Method |
|---------|----------|--------|
| Create/Update Order | `/orders/createorder` | POST |
| Create/Update Multiple | `/orders/createorders` | POST |
| Get Order | `/orders/{orderId}` | GET |
| List Shipments | `/shipments` | GET |
| Create Webhook | `/v2/environment/webhooks` | POST |

#### Webhook Events
- `fulfillment_shipped_v2` - When order is shipped (includes tracking)
- `batch_processed_v2` - When batch operations complete
- `track` - Tracking updates

---

## 4. Business Logic & Sync Rules

### 4.1 Order Sync Criteria (IQR → ShipStation)

**Status Filter:**
- Sync orders where `status == "Open"` OR `status == "Partial"`

**Customer/Channel Filter:**
- Only sync orders from Agent channel: **"DPC - QUIC"**
- Field to check: TBD (need to confirm with IQR API response)

**Sync Frequency:**
- **15 minutes** (scheduled polling)

**Date Range:**
- Configurable (default: orders from last 30 days)
- Prevents syncing old historical orders

**Idempotency:**
- Use IQR Order ID as ShipStation `orderNumber`
- Check if order already exists in ShipStation before creating
- Update existing orders if changes detected

---

## 5. Data Flow Specifications

### 5.1 IQR → ShipStation (Order Push)

**Trigger Options:**
- Real-time: Webhook/event from IQR when order is created/approved
- Scheduled: Poll IQR every X minutes for new orders
- Manual: API call triggered by user action

**Order Data Mapping:**
| IQR Field | ShipStation Field | Notes |
|-----------|-------------------|-------|
| Order ID | orderNumber | Unique identifier |
| Order Date | orderDate | ISO 8601 format |
| Customer Name | shipTo.name | |
| Ship Address | shipTo.street1, street2, city, state, postalCode, country | |
| Email | customerEmail | |
| Line Items | items[] | Array of products |
| SKU | items[].sku | |
| Quantity | items[].quantity | |
| Unit Price | items[].unitPrice | |
| Weight | items[].weight | |

### 4.2 ShipStation → IQR (Tracking Update)

**Trigger:** ShipStation webhook `fulfillment_shipped_v2`

**Tracking Data Mapping:**
| ShipStation Field | IQR Field | Notes |
|-------------------|-----------|-------|
| orderNumber | Order ID | To match original order |
| trackingNumber | Tracking Number | |
| carrierCode | Carrier | |
| shipDate | Ship Date | |
| serviceCode | Shipping Method | |

---

## 5. Technical Architecture

### 5.1 Connector Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    IQR-ShipStation Connector                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │  IQR API Client  │    │ ShipStation API  │                   │
│  │                  │    │     Client       │                   │
│  └────────┬─────────┘    └────────┬─────────┘                   │
│           │                       │                             │
│           ▼                       ▼                             │
│  ┌─────────────────────────────────────────────────────┐        │
│  │              Order Sync Service                     │        │
│  │  - Fetch orders from IQR                            │        │
│  │  - Transform to ShipStation format                  │        │
│  │  - Push to ShipStation                              │        │
│  │  - Handle duplicates/idempotency                    │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐        │
│  │              Webhook Handler Service                │        │
│  │  - Receive ShipStation webhooks                     │        │
│  │  - Parse shipment/tracking data                     │        │
│  │  - Update IQR with tracking info                    │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐        │
│  │              Scheduler / Queue                      │        │
│  │  - Manage sync intervals                            │        │
│  │  - Retry failed operations                          │        │
│  │  - Dead letter queue                                │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Technology Stack (Recommended)

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Runtime | Node.js 20+ or Python 3.11+ | Wide support, good for API work |
| Framework | Express.js / FastAPI | Lightweight, webhook support |
| Queue | Bull (Redis) / Celery | Reliable job processing |
| Database | PostgreSQL / SQLite | Track sync state, logs |
| Hosting | Azure Functions / AWS Lambda / Docker | Serverless or containerized |

### 5.3 Environment Configuration

```env
# IQ Reseller
IQR_API_KEY=your_api_key_here
IQR_API_BASE_URL=https://api.iqreseller.com
IQR_AUTH_URL=https://signin.iqreseller.com

# ShipStation
SHIPSTATION_API_KEY=your_api_key_here
SHIPSTATION_API_SECRET=your_secret_here
SHIPSTATION_API_BASE_URL=https://ssapi.shipstation.com

# Sync Configuration
SYNC_INTERVAL_MINUTES=15
WEBHOOK_SECRET=your_webhook_secret

# Database
DATABASE_URL=postgresql://user:pass@host:5432/iqr_shipstation
```

---

## 6. Error Handling & Resilience

### 6.1 Retry Strategy
- **Transient errors** (network, rate limits): Exponential backoff, max 5 retries
- **Permanent errors** (invalid data): Log and alert, move to dead letter queue
- **Rate limiting**: Respect ShipStation's rate limits (40 requests/minute on basic plans)

### 6.2 Idempotency
- Use IQR Order ID as unique key
- Check if order exists in ShipStation before creating
- Store sync state to prevent duplicate processing

### 6.3 Logging & Monitoring
- Structured JSON logging
- Track: Orders synced, failures, latency
- Alerts for: Sync failures, webhook failures, API errors

---

## 7. Security Considerations

- Store API keys in environment variables or secrets manager
- Use HTTPS for all API communications
- Validate webhook signatures from ShipStation
- Implement request/response logging (sanitize sensitive data)
- Regular key rotation policy

---

## 8. Deployment Options

### Option A: Serverless (Recommended for low volume)
- Azure Functions / AWS Lambda
- Scheduled trigger for order sync
- HTTP trigger for webhooks
- Low cost, auto-scaling

### Option B: Containerized (Recommended for higher volume)
- Docker container
- Kubernetes or ECS deployment
- Better control over resources
- Easier debugging

### Option C: On-Premise
- Windows Service or Linux daemon
- Direct network access to internal systems
- Requires infrastructure management

---

## 9. Implementation Timeline & Cost Estimate

### Development Phases

| Phase | Tasks | Hours | Duration |
|-------|-------|-------|----------|
| **Phase 1: Setup & Discovery** | Project scaffold, API clients, auth, verify IQR endpoints | 8-12 hrs | 1-2 days |
| **Phase 2: Order Sync** | IQR → ShipStation order push, transformation, idempotency | 16-24 hrs | 2-3 days |
| **Phase 3: Tracking Sync** | ShipStation → IQR webhook handler, polling fallback | 12-16 hrs | 2-3 days |
| **Phase 4: Testing & QA** | Unit tests, integration tests, edge cases, UAT support | 8-12 hrs | 1-2 days |
| **Phase 5: Deployment** | Docker setup, deploy, monitoring, documentation | 4-8 hrs | 1 day |

### Cost Estimate @ $50/hour

| Scenario | Hours | Cost |
|----------|-------|------|
| **Optimistic** (smooth integration, clean APIs) | 40-50 hrs | **$2,000 - $2,500** |
| **Realistic** (minor IQR quirks, some edge cases) | 55-70 hrs | **$2,750 - $3,500** |
| **Conservative** (complex mapping, custom requirements) | 70-85 hrs | **$3,500 - $4,250** |

### Recommended Budget

**$3,000 - $3,500** covers the realistic scenario with a small buffer for unknowns.

### What's Included

✅ IQR API client with authentication
✅ ShipStation API client
✅ Order sync service (IQR → ShipStation)
✅ Tracking sync service (ShipStation → IQR)
✅ Webhook endpoint for real-time tracking updates
✅ Scheduled polling fallback
✅ Error handling & retry logic
✅ Unit tests
✅ Docker deployment configuration
✅ Documentation

### What's Not Included (may add cost)

❌ Custom reporting/dashboards
❌ Historical data migration
❌ Multiple environment setup (dev/staging/prod)
❌ Ongoing maintenance/support
❌ Complex business rule customization

---

## 10. Open Questions

1. **IQR Order Status**: Which order status triggers sync to ShipStation? (e.g., "Approved", "Ready to Ship")
2. **Order Filters**: Should we sync all B2B orders or only specific types/customers?
3. **Webhook Endpoint**: Where will the connector be hosted to receive ShipStation webhooks?
4. **Error Notifications**: How should failures be reported? (Email, Slack, etc.)
5. **Historical Orders**: Do we need to backfill existing orders?

---

## 11. Appendix

### A. IQ Reseller API Authentication Example

```javascript
// Generate Session Token
const response = await fetch('https://signin.iqreseller.com/api/IntegrationAPI/Session', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify({ APIToken: 'your_api_key' })
});

const { Data: sessionToken } = await response.json();

// Use Session Token for API calls
const ordersResponse = await fetch('https://api.iqreseller.com/webapi.svc/Order/json/GetOrders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'iqr-session-token': sessionToken
  },
  body: JSON.stringify({ /* query params */ })
});
```

### B. ShipStation Create Order Example

```javascript
const order = {
  orderNumber: 'IQR-12345',
  orderDate: '2024-01-15T10:00:00.000Z',
  orderStatus: 'awaiting_shipment',
  shipTo: {
    name: 'John Doe',
    street1: '123 Main St',
    city: 'Austin',
    state: 'TX',
    postalCode: '78701',
    country: 'US'
  },
  items: [
    {
      sku: 'WIDGET-001',
      name: 'Premium Widget',
      quantity: 2,
      unitPrice: 29.99
    }
  ]
};

await fetch('https://ssapi.shipstation.com/orders/createorder', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + btoa(apiKey + ':' + apiSecret)
  },
  body: JSON.stringify(order)
});
```

