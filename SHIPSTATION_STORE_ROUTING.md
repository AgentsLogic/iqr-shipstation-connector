# 🏪 ShipStation Store Routing

## Overview

Orders from IQR are now automatically routed to a specific store/channel in ShipStation. This ensures that orders appear in the correct location within your ShipStation account, maintaining your existing order flow.

---

## Configuration

### Environment Variable

Add this to your `.env` file:

```env
SHIPSTATION_STORE_NAME=DPC - Agent Quickbooks
```

**Important:** The store name must match **exactly** as it appears in ShipStation (case-sensitive, including spaces and special characters).

---

## How It Works

### 1. On Startup/Sync

When the integration starts or begins a sync:

1. **Fetches Store List** - Queries ShipStation API for all active stores
2. **Finds Matching Store** - Searches for store with name matching `SHIPSTATION_STORE_NAME`
3. **Gets Store ID** - Retrieves the numeric `storeId` for that store
4. **Logs Result** - Confirms which store will be used

### 2. Creating Orders

When creating each order in ShipStation:

1. **Includes Store ID** - Adds `storeId` to the order's `advancedOptions`
2. **Routes to Store** - ShipStation automatically places the order in that store/channel
3. **Maintains Flow** - Your existing ShipStation workflow remains intact

---

## Verification

### Check the Logs

When the server starts or syncs orders, you'll see:

```
Using ShipStation store: DPC - Agent Quickbooks (ID: 12345)
```

### Check ShipStation

1. Log into ShipStation
2. Click on the store filter dropdown (top left)
3. Select "DPC - Agent Quickbooks"
4. You should see orders from IQR appearing there

---

## Troubleshooting

### Store Not Found

**Error Message:**
```
Store "DPC - Agent Quickbooks" not found in ShipStation. Orders will be created without a specific store.
```

**Possible Causes:**
1. Store name doesn't match exactly (check spelling, spaces, capitalization)
2. Store is inactive in ShipStation
3. Store doesn't exist in your ShipStation account

**Solution:**
1. Log into ShipStation
2. Go to Settings → Selling Channels
3. Find the exact name of your store
4. Update `SHIPSTATION_STORE_NAME` in `.env` to match exactly
5. Restart the server

### Orders Going to Wrong Store

**Check:**
1. Verify `SHIPSTATION_STORE_NAME` in `.env` matches the desired store
2. Check server logs for "Using ShipStation store" message
3. Confirm the store ID matches what you expect

---

## API Details

### ShipStation API Endpoints Used

**List Stores:**
```
GET /stores
```

Returns all stores in your ShipStation account.

**Create Order with Store:**
```json
{
  "orderNumber": "12345",
  "orderDate": "2026-01-16T...",
  "shipTo": { ... },
  "items": [ ... ],
  "advancedOptions": {
    "storeId": 12345,
    "customField1": "IQR Order ID: 67890"
  }
}
```

---

## Configuration Reference

### Default Value

If `SHIPSTATION_STORE_NAME` is not set, it defaults to:
```
DPC - Agent Quickbooks
```

### Changing the Store

To route orders to a different store:

1. **Update `.env`:**
   ```env
   SHIPSTATION_STORE_NAME=Your Store Name Here
   ```

2. **Restart the server:**
   ```bash
   npm start
   ```

3. **Verify in logs:**
   Look for confirmation message with store name and ID

---

## Benefits

✅ **Organized Orders** - Orders appear in the correct store/channel  
✅ **Existing Workflow** - Maintains your current ShipStation setup  
✅ **Automatic Routing** - No manual intervention needed  
✅ **Flexible** - Easy to change which store receives orders  
✅ **Logged** - Clear confirmation of which store is being used  

---

## Technical Implementation

### Files Modified

1. **`src/clients/shipstation-client.ts`**
   - Added `ShipStationStore` interface
   - Added `listStores()` method
   - Added `getStoreByName()` method
   - Added `storeId` to `advancedOptions` in order interface

2. **`src/config/index.ts`**
   - Added `storeName` to ShipStation configuration
   - Defaults to "DPC - Agent Quickbooks"

3. **`src/services/order-sync.service.ts`**
   - Fetches store ID before syncing orders
   - Passes store ID to `transformOrder()` function
   - Includes store ID in order's `advancedOptions`

4. **`.env` and `.env.example`**
   - Added `SHIPSTATION_STORE_NAME` configuration

---

## Example Log Output

```
=== Environment Configuration ===
Environment: development
Port: 4700
...
ShipStation Store: DPC - Agent Quickbooks
=================================

[INFO] Using ShipStation store: DPC - Agent Quickbooks (ID: 123456)
[INFO] Orders fetched from IQR: 5
[DEBUG] Order synced to ShipStation: orderNumber=SO-12345, storeId=123456
[DEBUG] Order synced to ShipStation: orderNumber=SO-12346, storeId=123456
...
```

---

## Summary

All orders from IQR will now automatically appear in the **"DPC - Agent Quickbooks"** store in ShipStation, keeping your existing order flow intact and organized.

**No manual intervention required** - just configure the store name once and the integration handles the rest! 🎉

