# IQR API Integration Notes

## ✅ Authentication - VERIFIED

**Endpoint:** `POST https://signin.iqreseller.com/api/IntegrationAPI/Session`

**Request:**
```json
{
  "APIToken": "5R7QxIfaQt7iB4Qz0t+T0qdupWIubmIEnIKlpqTSPdT2cWtP2FC7bLeDZZsmnrxBzHX8EMGq/xVEsh9N/26Vow=="
}
```

**Response:**
```json
{
  "Data": "session-token-here..."
}
```

**Usage:** Add header `iqr-session-token: {token}` to all API requests

---

## ✅ Get Sales Orders - VERIFIED

**Endpoint:** `GET https://api.iqreseller.com/webapi.svc/SO/JSON/GetSOs`

**Headers:**
- `iqr-session-token: {token}`
- `Content-Type: application/json`

**Query Parameters:**
- `Page`: 0 (for all results)
- `PageSize`: 0 (for all results, or specify limit like 100)
- `SortBy`: 0

**Response:** Array of SO objects

**Sample SO Object:**
```json
{
  "soid": 2795,
  "so": "12345",
  "clientid": "AMAZON",
  "clientponumber": "PO-123",
  "status": "Open",  // or "Partial", "Closed", etc.
  "saledate": "2024-01-01",
  "rep": "CB",
  "shiptocontactid": 4,
  "shiptoname": "John Doe",
  "shiptophone": "555-1234",
  "shiptoemail": "john@example.com",
  "total": 1000.00,
  "userdefined1": "",
  "userdefined2": "",
  "userdefined3": "",
  "userdefined4": "",
  "userdefined5": ""
}
```

---

## ✅ Update SO User Defined Fields - VERIFIED

**Endpoint:** `POST https://api.iqreseller.com/webapi.svc/SO/UDFS/JSON`

**Headers:**
- `iqr-session-token: {token}`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "sos": [
    {
      "soid": 1813,
      "userdefined1": "TRACKING123",
      "userdefined2": "UPS",
      "userdefined3": "2024-01-08",
      "userdefined4": "",
      "userdefined5": "",
      "lastupdatedby": "SHIPSTATION_CONNECTOR"
    }
  ]
}
```

---

## 🔍 Business Logic Requirements

### Order Filtering

**Status Filter:** `Status == "Open" OR "Partial"`
- ✅ Implemented in code

**Agent Channel Filter:** `DPC - QUIC`
- ❓ **NEED TO CONFIRM:** Which field contains "DPC - QUIC"?
  - Possible fields: `clientid`, `rep`, `userdefined1-5`
  - **ACTION:** Test with real data to identify the correct field

### Tracking Update Strategy

**Use User Defined Fields:**
- `userdefined1`: Tracking Number
- `userdefined2`: Carrier (UPS, FedEx, USPS, etc.)
- `userdefined3`: Ship Date
- `userdefined4`: Shipping Method (Ground, 2-Day, Overnight, etc.)
- `userdefined5`: ShipStation Order ID (for reference)

---

## 📋 TODO Items

### 1. Identify Agent Channel Field
- [ ] Get sample order data from IQR
- [ ] Identify which field contains "DPC - QUIC"
- [ ] Update filter in `getOrdersToSync()`

### 2. Get Order Details
- [ ] Determine if we need SO Details (line items)
- [ ] If yes, use endpoint: `GET /webapi.svc/SODetail/JSON/GetSODetails?SOid={soid}`
- [ ] Update `IQROrder` interface to include line items

### 3. Get Shipping Address
- [ ] Determine if shipping address is included in SO response
- [ ] If not, may need to fetch contact details separately
- [ ] Endpoint: `GET /webapi.svc/Contact/JSON/GetContactsByCVid?cvid={shiptocontactid}`

### 4. Test Authentication
- [x] Test auth endpoint with real API key
- [ ] Verify session token works for API calls
- [ ] Test session expiry and re-authentication

### 5. Test Order Retrieval
- [ ] Fetch real orders from IQR
- [ ] Verify data structure matches interface
- [ ] Test filtering logic

### 6. Test Tracking Update
- [ ] Create test order in IQR
- [ ] Update with tracking info
- [ ] Verify update appears in IQR

---

## 🚀 Next Steps

1. **Run authentication test** (already created `test-iqr-auth.js`)
2. **Fetch sample orders** to see real data structure
3. **Identify agent channel field** from sample data
4. **Update code** with correct field mappings
5. **Test end-to-end** sync flow

---

## 📞 Questions for Robb/Jeff

1. **Agent Channel Field:** Which field in the Sales Order contains "DPC - QUIC"?
   - Is it `clientid`, `rep`, or one of the `userdefined` fields?

2. **Order Details:** Do we need to sync line items to ShipStation?
   - If yes, we'll need to fetch SO Details for each order

3. **Shipping Address:** Is the shipping address included in the SO response?
   - Or do we need to fetch it separately using the contact ID?

4. **Tracking Fields:** Are the user defined fields available for tracking info?
   - Or is there a specific tracking update endpoint we should use?

---

## ✅ Verified Endpoints

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/IntegrationAPI/Session` | POST | Authenticate | ✅ Verified |
| `/webapi.svc/SO/JSON/GetSOs` | GET | Get Sales Orders | ✅ Verified |
| `/webapi.svc/SO/UDFS/JSON` | POST | Update User Defined Fields | ✅ Verified |
| `/webapi.svc/SODetail/JSON/GetSODetails` | GET | Get Order Line Items | 📋 Available |
| `/webapi.svc/Contact/JSON/GetContactsByCVid` | GET | Get Contact Details | 📋 Available |

---

**Last Updated:** 2026-01-08  
**Status:** Ready for testing with real API credentials

