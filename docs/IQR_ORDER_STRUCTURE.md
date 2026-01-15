# IQR Sales Order API Structure

**API Endpoint:** `GET https://api.iqreseller.com/webapi.svc/SO/JSON/GetSOs`

**Authentication:** Requires `iqr-session-token` header (obtained from session API)

---

## Response Structure

The API returns an **array of orders**. Each order has:
- Main order fields (customer, shipping, totals, status)
- `SODetails` array containing line items

---

## Key Order Fields

### Order Identification
- `so` - Order number (e.g., 3000)
- `status` - Order status (e.g., "Invoiced", "Open", "Partial", "Voided")
- `saledate` - Order date
- `invoiceddate` - Invoice date

### Customer Information
- `clientid` - Customer ID (e.g., "INSTALLEDB")
- `shiptocompany` - Customer company name
- `clientponumber` - Customer PO number
- `rep` - Sales rep code (e.g., "AP", "MM")

### Shipping Address
- `shiptoaddress1` - Address line 1
- `shiptoaddress2` - Address line 2
- `shiptoaddress3` - Address line 3
- `shiptocity` - City
- `shiptostate` - State
- `shiptopostalcode` - ZIP code
- `shiptocountry` - Country

### Contact Information
- `shiptoemail` - Email
- `shiptocontact` - Contact name
- `shiptophone` - Phone number
- `shiptofax` - Fax number

### Order Totals
- `total` - Order total amount
- `totalsales` - Total sales amount
- `totaltax` - Total tax
- `freight` - Freight charges
- `totallines` - Number of line items

### Ship From (Warehouse)
- `shipfromcompany` - Warehouse name
- `shipfromaddress1` - Warehouse address
- `shipfromcity` - Warehouse city
- `shipfromstate` - Warehouse state
- `shipfromclientid` - Warehouse ID (e.g., "DISCOUNTPC")

### Custom Fields
- `userdefined1` through `userdefined5` - Custom fields (may contain agent channel info)

---

## Line Item Structure (SODetails)

Each item in the `SODetails` array contains:

### Product Information
- `item` - Product SKU (e.g., "THINKPAD T450")
- `description` - Product description
- `extendeddescription` - Extended description (HTML)
- `mfgr` - Manufacturer (e.g., "LENOVO")
- `condition` - Product condition (e.g., "USED", "NEW")

### Quantity & Pricing
- `quantity` - Quantity ordered
- `unitprice` - Price per unit
- `listprice` - List price

### Tracking
- `serialnumber` - Serial number (important for tracking!)
- `line` - Line number in order
- `sodetailid` - Line item ID

### Status & Dates
- `status` - Line item status (e.g., "Invoiced")
- `invoiceddate` - When line was invoiced
- `shipdate` - Ship date
- `scheduledshipdate` - Scheduled ship date

### Warehouse
- `warehouse` - Warehouse code (e.g., "EV1")
- `inventorywarehouse` - Inventory warehouse
- `inventorylocation` - Inventory location

---

## Example Order (Simplified)

```json
{
  "so": 3000,
  "status": "Invoiced",
  "clientid": "INSTALLEDB",
  "shiptocompany": "Installed Building Products",
  "shiptoaddress1": "123 Main St",
  "shiptocity": "Austin",
  "shiptostate": "TX",
  "shiptopostalcode": "78701",
  "shiptoemail": "orders@example.com",
  "total": 20342.23,
  "saledate": "3/6/2020 12:00:00 AM",
  "SODetails": [
    {
      "line": 1,
      "item": "THINKPAD T450",
      "description": "LENOVO THINKPAD T450 NOTEBOOK i5/8/512-NEW/W10P",
      "quantity": 1,
      "unitprice": 469.95,
      "serialnumber": "1S20BUS02F00PC08XFLW",
      "mfgr": "LENOVO",
      "status": "Invoiced"
    }
  ]
}
```

---

## Statuses Found in Sample Data

- **Invoiced** - Order has been invoiced
- **Voided** - Order has been cancelled

**Expected statuses for sync:**
- **Open** - Order is open and ready to ship
- **Partial** - Order is partially fulfilled

---

## Questions / Unknown Fields

1. **Agent Channel "DPC - QUIC"** - Which field contains this?
   - Not found in: `clientid`, `shipfromclientid`, `rep`, `assignedby`
   - Possibly in: `userdefined1-5` fields?

2. **Query Parameters** - Can we filter by status or date in the API call?

3. **Update Endpoint** - What endpoint updates tracking information?

