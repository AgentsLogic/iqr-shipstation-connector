# API Documentation

## Base URL

```
http://localhost:3000
```

In production, replace with your deployed URL.

---

## Endpoints

### 1. Health Check

**GET** `/health`

Basic health check endpoint. Returns 200 if the server is running.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "environment": "production"
}
```

---

### 2. Detailed Health Check

**GET** `/health/detailed`

Comprehensive health check that tests connectivity to IQR and ShipStation APIs.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "services": {
    "iqr": "up",
    "shipstation": "up"
  }
}
```

**Status Values:**
- `healthy` - All services operational (200)
- `degraded` - One service down (200)
- `unhealthy` - All services down (503)

---

### 3. Readiness Probe

**GET** `/ready`

Kubernetes readiness probe. Checks if the application is ready to accept traffic.

**Response:**
```json
{
  "ready": true
}
```

---

### 4. Liveness Probe

**GET** `/live`

Kubernetes liveness probe. Checks if the application process is alive.

**Response:**
```json
{
  "alive": true
}
```

---

### 5. Manual Order Sync

**POST** `/api/sync/orders`

Manually trigger an order sync from IQR to ShipStation.

**Request Body (all optional):**
```json
{
  "fromDate": "2024-01-01",
  "toDate": "2024-01-31",
  "orderStatus": "Approved"
}
```

**Parameters:**
- `fromDate` (string, optional) - Start date for order filter (ISO 8601)
- `toDate` (string, optional) - End date for order filter (ISO 8601)
- `orderStatus` (string, optional) - Filter by order status (e.g., "Approved")

**Response:**
```json
{
  "success": true,
  "ordersProcessed": 15,
  "ordersFailed": 2,
  "errors": [
    {
      "orderNumber": "ORD-123",
      "error": "Missing shipping address"
    },
    {
      "orderNumber": "ORD-456",
      "error": "ShipStation API error"
    }
  ]
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/sync/orders \
  -H "Content-Type: application/json" \
  -d '{
    "fromDate": "2024-01-01",
    "orderStatus": "Approved"
  }'
```

---

### 6. ShipStation Webhook

**POST** `/webhooks/shipstation`

Receives shipment notifications from ShipStation and updates tracking in IQR.

**Headers:**
- `x-shipstation-signature` (string) - Webhook signature for validation

**Request Body:**
```json
{
  "resource_url": "https://api.shipstation.com/shipments/123",
  "resource_type": "shipment",
  "data": {
    "shipment_id": "ship-123",
    "order_id": "ss-456",
    "order_number": "IQR-789",
    "tracking_number": "1Z999AA10123456784",
    "carrier_code": "ups",
    "service_code": "ups_ground",
    "ship_date": "2024-01-20"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Tracking updated in IQR"
}
```

**Response (Not IQR Order):**
```json
{
  "success": true,
  "message": "Not an IQR order"
}
```

**Response (Invalid Signature):**
```json
{
  "error": "Invalid webhook signature"
}
```

**Note:** This endpoint is called automatically by ShipStation. You should not call it manually.

---

## Error Responses

All endpoints may return error responses in the following format:

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Invalid request parameters"
}
```

**401 Unauthorized:**
```json
{
  "error": "Invalid webhook signature"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Route POST /invalid not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Internal server error"
}
```

In development mode, error responses include additional details:
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Detailed error message",
  "stack": "Error stack trace..."
}
```

---

## Rate Limiting

Currently, there is no rate limiting implemented. Consider adding rate limiting in production using packages like `express-rate-limit`.

---

## Authentication

The connector does not require authentication for its endpoints. In production, consider:

1. Adding API key authentication
2. Using IP whitelisting
3. Placing behind a reverse proxy with authentication

---

## Logging

All requests are logged in JSON format:

```json
{
  "timestamp": "2024-01-20T10:30:00.000Z",
  "level": "info",
  "service": "iqr-shipstation-connector",
  "environment": "production",
  "message": "API Response",
  "method": "POST",
  "path": "/api/sync/orders",
  "statusCode": 200,
  "duration": 1234,
  "ip": "192.168.1.1"
}
```

