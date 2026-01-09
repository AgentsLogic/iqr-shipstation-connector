# IQ Reseller API Endpoints Reference

**Base URL:** `https://api.iqreseller.com`  
**Auth URL:** `https://signin.iqreseller.com`  
**Postman Collection:** https://postman.iqreseller.com/

---

## Authentication

### Generate Session Token

**Endpoint:** `POST https://signin.iqreseller.com/api/IntegrationAPI/Session`

**Headers:**
```
Content-Type: application/json
Accept: application/json
```

**Request Body:**
```json
{
  "APIToken": "your_api_key_here"
}
```

**Response:**
```json
{
  "Data": "session_token_string"
}
```

### End Session

**Endpoint:** `DELETE https://signin.iqreseller.com/api/IntegrationAPI/Session`

**Headers:**
```
Authorization: Bearer {session_token}
```

---

## Known API Endpoints

> **Note:** These endpoints are based on available documentation. 
> The actual endpoint names and parameters should be verified against 
> the official Postman collection at https://postman.iqreseller.com/

### Conditions

**Get Conditions**
```
GET https://api.iqreseller.com/webapi.svc/Condition/JSON/GetConditions
```

### CVs (likely Customer/Vendor records)

**Get CVs**
```
POST https://api.iqreseller.com/webapi.svc/CV/json/GetCVs
```

### Orders (Inferred - to be confirmed)

**Get Orders**
```
POST https://api.iqreseller.com/webapi.svc/Order/json/GetOrders
```

**Get Order by ID**
```
POST https://api.iqreseller.com/webapi.svc/Order/json/GetOrder
Body: { "OrderId": "123" }
```

**Update Order**
```
POST https://api.iqreseller.com/webapi.svc/Order/json/UpdateOrder
```

### Sales Orders

**Get Sales Order Shipments** (confirmed from search results)
```
GET https://api.iqreseller.com/webapi.svc/SalesOrder/JSON/GetShipments
```

### Proposals (Inferred)

**Get Proposals**
```
POST https://api.iqreseller.com/webapi.svc/Proposal/json/GetProposals
```

---

## Common Request Headers

All API calls (except authentication) require:

```
Content-Type: application/json
Accept: application/json
iqr-session-token: {session_token_from_authentication}
```

---

## Expected Order Data Structure (Inferred)

Based on typical ERP systems, IQR orders likely include:

```typescript
interface IQROrder {
  // Identifiers
  OrderId: string;
  OrderNumber: string;
  
  // Dates
  OrderDate: string;      // ISO 8601
  RequiredDate?: string;
  
  // Customer Info
  CustomerId: string;
  CustomerName: string;
  CustomerEmail?: string;
  
  // Shipping Address
  ShipToName: string;
  ShipToAddress1: string;
  ShipToAddress2?: string;
  ShipToCity: string;
  ShipToState: string;
  ShipToZip: string;
  ShipToCountry: string;
  
  // Line Items
  LineItems: Array<{
    LineNumber: number;
    ItemId: string;
    SKU: string;
    Description: string;
    Quantity: number;
    UnitPrice: number;
    ExtendedPrice: number;
  }>;
  
  // Status
  Status: string;         // e.g., "Draft", "Approved", "Shipped"
  
  // Shipping Info (for tracking updates)
  TrackingNumber?: string;
  Carrier?: string;
  ShipDate?: string;
  ShippingMethod?: string;
}
```

---

## Action Required

Before implementation, you need to:

1. **Access the Postman Collection** at https://postman.iqreseller.com/
2. **Verify these endpoints exist:**
   - Get Orders / Sales Orders
   - Update Order (for adding tracking info)
3. **Document the exact:**
   - Endpoint URLs
   - Request/Response schemas
   - Required parameters
   - Status values that indicate "ready to ship"

---

## Integration with ShipStation

### Fields to Map (IQR → ShipStation)

| IQR Field | ShipStation Field |
|-----------|-------------------|
| OrderNumber | orderNumber |
| OrderDate | orderDate |
| CustomerName | shipTo.name |
| ShipToAddress1 | shipTo.street1 |
| ShipToCity | shipTo.city |
| ShipToState | shipTo.state |
| ShipToZip | shipTo.postalCode |
| ShipToCountry | shipTo.country |
| LineItems[].SKU | items[].sku |
| LineItems[].Description | items[].name |
| LineItems[].Quantity | items[].quantity |
| LineItems[].UnitPrice | items[].unitPrice |

### Fields to Map (ShipStation → IQR)

| ShipStation Field | IQR Field |
|-------------------|-----------|
| trackingNumber | TrackingNumber |
| carrierCode | Carrier |
| shipDate | ShipDate |
| serviceCode | ShippingMethod |

