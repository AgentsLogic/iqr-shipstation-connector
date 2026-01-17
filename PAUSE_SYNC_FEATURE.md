# ⏸️ Pause/Enable Sync Feature

## Overview

The integration now supports pausing and resuming automatic order synchronization. This allows you to:

- ✅ **Pause automatic syncing** until you're ready to go live
- ✅ **Test manually** before enabling automatic sync
- ✅ **Control when syncing starts** without redeploying

---

## 🎯 Use Case

**Scenario:** You want to test the integration before your 2/1 go-live date, but don't want orders automatically syncing to ShipStation yet.

**Solution:** Keep `SYNC_ENABLED=false` until 2/1, then change to `SYNC_ENABLED=true` to start automatic syncing.

---

## 🔧 Configuration

### Environment Variable

Add this to your `.env` file or Render environment variables:

```env
SYNC_ENABLED=false
```

**Values:**
- `false` - Automatic syncing is **PAUSED** (default for safety)
- `true` - Automatic syncing is **ACTIVE**

---

## 📊 How It Works

### When SYNC_ENABLED=false (Paused)

✅ **Manual sync still works** via API endpoint  
✅ **Perfect for testing** before go-live  
✅ **Dashboard shows "⏸️ Paused" status**  
✅ **Server logs show "AUTOMATIC SYNC PAUSED"**  
❌ **No automatic syncing** every 15 minutes  

### When SYNC_ENABLED=true (Active)

✅ **Automatic syncing enabled**  
✅ **Syncs every 15 minutes** (or your configured interval)  
✅ **Dashboard shows "▶️ Active" status**  
✅ **Server logs show "Scheduled sync enabled"**  

---

## 🧪 Testing Before Go-Live

### Step 1: Verify Sync is Paused

1. Check the dashboard at https://iqr-shipstation-connector.onrender.com
2. Look for "⏸️ Paused" in the Auto-Sync Status
3. Footer should say "Auto-sync PAUSED - Manual sync only"

### Step 2: Test Manual Sync

Trigger a manual sync to test the integration:

```bash
curl -X POST https://iqr-shipstation-connector.onrender.com/api/sync/orders \
  -H "Content-Type: application/json"
```

**Or with filters:**

```bash
curl -X POST https://iqr-shipstation-connector.onrender.com/api/sync/orders \
  -H "Content-Type: application/json" \
  -d '{
    "fromDate": "2026-01-16",
    "toDate": "2026-01-16",
    "orderStatus": "Open"
  }'
```

### Step 3: Verify in ShipStation

1. Log into ShipStation
2. Filter by store: "DPC - Agent Quickbooks"
3. Check if test orders appeared correctly
4. If needed, delete test orders before go-live

---

## 🚀 Enabling for Go-Live (2/1)

### Option 1: Via Render Dashboard (Recommended)

1. Go to https://dashboard.render.com/web/srv-d5gjd875r7bs73eeohj0
2. Click "Environment" tab
3. Find `SYNC_ENABLED` variable
4. Change value from `false` to `true`
5. Click "Save Changes"
6. Service will automatically redeploy

### Option 2: Via Local .env (if running locally)

1. Edit `.env` file
2. Change `SYNC_ENABLED=false` to `SYNC_ENABLED=true`
3. Restart the server: `npm start`

---

## 📱 Dashboard Indicators

### Paused State
```
Auto-Sync Status: ⏸️ Paused (orange color)
Footer: "⏸️ Auto-sync PAUSED - Manual sync only"
```

### Active State
```
Auto-Sync Status: ▶️ Active (green color)
Footer: "Auto-syncing orders every 15 minutes"
```

---

## 🔍 Verification

### Check Server Logs

**When Paused:**
```
⏸️  AUTOMATIC SYNC PAUSED - Manual sync only via /api/sync/orders
```

**When Active:**
```
Scheduled sync enabled: every 15 minutes
Order sync started
```

### Check Dashboard

Visit https://iqr-shipstation-connector.onrender.com and look at the "System Info" card.

---

## ⚠️ Important Notes

1. **Default is PAUSED** - For safety, the default is `false` (paused)
2. **Manual sync always works** - Even when paused, you can trigger manual syncs via API
3. **No data loss** - Pausing doesn't affect existing data or configurations
4. **Instant effect** - Changing the variable requires a redeploy (automatic on Render)

---

## 📋 Pre-Go-Live Checklist

- [ ] Verify `SYNC_ENABLED=false` in Render
- [ ] Test manual sync with sample orders
- [ ] Verify orders appear in "DPC - Agent Quickbooks" store
- [ ] Delete any test orders from ShipStation
- [ ] On 2/1: Change `SYNC_ENABLED=true` in Render
- [ ] Verify automatic syncing starts
- [ ] Monitor first few syncs for issues

---

## 🎊 Summary

**Before 2/1:**
- `SYNC_ENABLED=false` ⏸️
- Test manually via API
- No automatic syncing

**On 2/1:**
- Change to `SYNC_ENABLED=true` ▶️
- Automatic syncing starts
- Orders sync every 15 minutes

**Perfect for controlled rollout!** 🚀

