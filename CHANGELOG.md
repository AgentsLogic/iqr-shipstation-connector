# Changelog

## 2026-01-15 - Dashboard Cleanup

### Changed
- ✅ **Removed "Failed" count from dashboard**
  - The "Failed" metric was confusing because it showed orders that were correctly filtered out
  - Orders are filtered by: Status (Open/Partial), Date (last 30 days), Agent Channel (DPC - QUIC)
  - These filtered orders are working as intended, not actual failures
  - Dashboard now shows only "Orders Synced" and "Last Sync" for clarity

### Fixed
- ✅ **Updated API key to full version**
  - Now using complete API key with both parts
  - IQR API connection verified and working

- ✅ **Added favicon** 📦
  - Dashboard now shows a package emoji in the browser tab

- ✅ **Removed "Running on Render" from footer**
  - Footer now shows: "v1.0.0 • IQR ↔ ShipStation Integration"

- ✅ **Changed port from 3001 to 4700**
  - Avoids conflict with other services
  - Updated all documentation

### Dashboard Now Shows:
- ✅ Connection status (IQR API, ShipStation API)
- ✅ Orders Synced (last 24 hours)
- ✅ Last Sync time
- ✅ Recent activity log
- ✅ System uptime
- ❌ Removed: "Failed" count (was misleading)

### Why This is Better:
The "Failed" count was technically showing orders that didn't match the sync criteria, which is the correct behavior. Removing it prevents confusion and questions about why orders are "failing" when they're actually being filtered correctly.

---

## Previous Updates

### Initial Release
- ✅ IQR API integration
- ✅ ShipStation API integration
- ✅ Automatic sync every 15 minutes
- ✅ Tracking updates via webhooks
- ✅ Beautiful web dashboard
- ✅ Duplicate prevention with orderKey
- ✅ Comprehensive logging
- ✅ Health check endpoints

