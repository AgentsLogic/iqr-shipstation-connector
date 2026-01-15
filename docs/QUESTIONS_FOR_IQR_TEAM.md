# Questions for IQR Team (Robb/Kyle)

## ✅ Confirmed Business Logic

Based on our conversation, here's what we understand:

### Order Sync Criteria (IQR → ShipStation)
- **Status Filter**: Sync orders where `status == "Open"` OR `status == "Partial"`
- **Customer/Channel Filter**: Only sync orders from Agent channel **"DPC - QUIC"**
- **Sync Frequency**: Every **15 minutes**

---

## ❓ Outstanding Questions

### 1. Agent Channel Field Location

**Question:** Which field in the IQR Sales Order API contains the agent channel "DPC - QUIC"?

We've examined the GetSOs API response and found these potential fields:
- `clientid` (e.g., "INSTALLEDB", "DISCOUNTPC")
- `shipfromclientid` (e.g., "DISCOUNTPC")
- `rep` (e.g., "AP", "MM", "SA")
- `userdefined1` through `userdefined5` (currently empty in sample data)
- `assignedby` (e.g., "SA")

**None of these contain "DPC - QUIC" in our sample data.**

**Possible answers:**
- Is "DPC - QUIC" stored in one of the `userdefined` fields?
- Is there a separate API endpoint to get customer/agent channel information?
- Should we filter by `shipfromclientid == "DISCOUNTPC"` instead?
- Is "DPC - QUIC" a display name that maps to a different internal ID?

---

### 2. Date Range for Initial Sync

**Question:** When we first start the integration, how far back should we sync orders?

**Options:**
- Only sync orders created after the integration goes live (no historical data)
- Sync orders from the last 30 days
- Sync orders from the last 90 days
- Sync ALL open/partial orders regardless of date

**Current assumption:** Last 30 days (configurable)

---

### 3. Tracking Update API Endpoint

**Question:** After ShipStation ships an order, we need to send tracking information back to IQR.

**Information we'll send:**
- Ship date
- Tracking number(s)
- Carrier name (e.g., "UPS", "FedEx")
- Service level (e.g., "Ground", "2-Day")

**What we need:**
- What's the API endpoint to update this information?
- Which fields in the Sales Order should we update?
- Should we change the order `status` after it ships? If so, to what value?
  - "Shipped"?
  - "Completed"?
  - Something else?

---

### 4. API Endpoint Confirmation

**Question:** We're currently using this endpoint to fetch sales orders:

```
GET https://api.iqreseller.com/webapi.svc/SO/JSON/GetSOs
```

**Is this the correct endpoint, or should we use:**
- `/Order/json/GetOrders` (mentioned in some documentation)
- A different endpoint?

**Also:** Are there any query parameters we should use to filter by status or date?

---

### 5. Testing Environment

**Question:** Do you have a sandbox/test environment for IQR API testing?

- The API key Kyle sent earlier was from the sandbox environment
- Should we continue testing in sandbox, or use production with test orders?
- Are there any test customer accounts we should use?

---

## 📋 Next Steps

Once we have answers to these questions, we can:

1. ✅ Implement the order filtering logic
2. ✅ Build the IQR → ShipStation sync service
3. ✅ Build the ShipStation → IQR tracking update service
4. ✅ Test end-to-end with real orders
5. ✅ Deploy to production

---

## 📞 Contact

Please reply with answers to these questions, and we'll proceed with the integration!

**Current Status:**
- ✅ IQR API authentication working
- ✅ Successfully fetching sales orders from IQR
- ✅ ShipStation API credentials configured
- ⏳ Waiting on business logic clarification

