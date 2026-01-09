# 🚀 IQR ↔ ShipStation Connector - Deployment Guide

## ✅ Current Status: READY FOR DEPLOYMENT

**Last Updated:** January 9, 2026  
**Status:** All integrations tested and working  
**Version:** 1.0.0

---

## 📋 Pre-Deployment Checklist

- [x] IQR API authentication working
- [x] IQR Sales Orders endpoint working
- [x] ShipStation API authentication working
- [x] ShipStation Stores endpoint working
- [x] Environment variables configured
- [x] TypeScript compilation successful
- [x] All dependencies installed
- [x] Documentation complete

---

## 🔧 Environment Setup

### Required Environment Variables

Create a `.env` file with the following:

```env
# IQ Reseller API Configuration
IQR_API_KEY=9ccQ4jB4d24KhWhOtcpeR/y3FmFBp/Asq1664VjnKUV/jp/Nvyj+6rf21xysTjoeXDB9aSuxlpZ5L5OxXAUkPw==
IQR_AUTH_URL=https://signin.iqreseller.com
IQR_API_BASE_URL=https://api.iqreseller.com

# ShipStation API Configuration
SHIPSTATION_API_KEY=your-api-key-here
SHIPSTATION_API_SECRET=your-api-secret-here
SHIPSTATION_API_BASE_URL=https://ssapi.shipstation.com
SHIPSTATION_STORE_ID=your-store-id-here
SHIPSTATION_WEBHOOK_SECRET=optional-webhook-secret

# Sync Configuration
SYNC_INTERVAL_MINUTES=15
SYNC_BATCH_SIZE=50
SYNC_MAX_RETRIES=3

# Server Configuration
PORT=3001
NODE_ENV=production
```

---

## 🏃 Running the Application

### Development Mode

```bash
npm install
npm run build
npm run dev
```

### Production Mode

```bash
npm install
npm run build
npm start
```

### Using Docker

```bash
# Build the image
npm run docker:build

# Run in production
npm run docker:prod

# Run in development
npm run docker:dev
```

---

## 🧪 Testing the Integration

### 1. Test IQR Authentication

```bash
node test-iqr-auth-simple.js
```

**Expected Output:**
```
✅ SUCCESS! Authentication worked!
Session Token: [token-here]
```

### 2. Test ShipStation Authentication

```bash
node test-shipstation-auth.js
```

**Expected Output:**
```
✅ SUCCESS! ShipStation API is working!
Found X stores
```

### 3. Test Manual Sync

With the server running:

```bash
node test-manual-sync.js
```

Or use curl:

```bash
curl -X POST http://localhost:3001/api/sync/orders
```

### 4. Check Health Endpoint

```bash
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-09T..."
}
```

---

## 📊 Monitoring

### Log Format

All logs are in JSON format for easy parsing:

```json
{
  "timestamp": "2026-01-09T05:32:49.995Z",
  "level": "info",
  "service": "iqr-shipstation-connector",
  "environment": "production",
  "message": "Server started successfully",
  "port": 3001
}
```

### Key Log Messages

- `Server started successfully` - Application is running
- `Successfully authenticated` - IQR auth successful
- `Orders fetched from IQR` - Orders retrieved
- `Order created in ShipStation` - Order synced
- `Tracking updated in IQR` - Webhook processed

---

## 🔄 How It Works

### Automatic Sync (Every 15 Minutes)

1. Authenticate with IQR API
2. Fetch all Sales Orders
3. Filter for "DPC - QUIC" agent channel
4. For each order:
   - Check if already synced (via user-defined fields)
   - Create order in ShipStation
   - Update IQR with ShipStation order ID
5. End IQR session

### Webhook Processing (Real-time)

1. Receive shipment notification from ShipStation
2. Validate webhook signature (if configured)
3. Extract tracking information
4. Update IQR Sales Order user-defined fields
5. Log the update

---

## 🚨 Troubleshooting

### Server Won't Start

**Check:**
- Port 3001 is not in use
- All environment variables are set
- Dependencies are installed (`npm install`)
- Code is compiled (`npm run build`)

### IQR Authentication Fails

**Check:**
- API key is correct
- API key is activated in IQR portal
- No IP restrictions on the API key

### ShipStation Connection Fails

**Check:**
- API key and secret are correct
- Store ID is correct
- API credentials have proper permissions

### No Orders Syncing

**Check:**
- Orders exist in IQR
- Orders have "DPC - QUIC" in the agent channel field
- Orders are not already synced (check user-defined fields)

---

## 📞 Support

For issues or questions, contact:
- **Robb** - IQR API access and configuration
- **Jeff** - Business requirements and workflow

---

## 🔐 Security Notes

- Never commit `.env` file to version control
- Rotate API keys regularly
- Use webhook secrets in production
- Monitor logs for suspicious activity
- Keep dependencies updated

---

## 📈 Next Steps

1. **Deploy to Production Server**
2. **Set up Process Manager** (PM2, systemd, etc.)
3. **Configure Monitoring** (logs, alerts)
4. **Set up Backup/Recovery**
5. **Document Runbook** for operations team

