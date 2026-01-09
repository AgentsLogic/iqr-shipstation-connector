# Quick Reference Card

## 🎯 Project At-a-Glance

**What:** IQ Reseller ↔ ShipStation integration connector  
**Status:** ✅ Code complete, waiting for API credentials  
**Your Time:** 12-20 hours remaining  
**Quote Jeff:** $1,500 - $1,800  

---

## 📧 Next Immediate Action

**Send email to Robb** (draft in previous conversation) requesting:
1. IQR API Key
2. ShipStation API Key & Secret  
3. Access to IQR Postman collection
4. Business logic confirmation (order status, filters, etc.)

---

## 🚀 Once You Get Credentials

### 1. Set Up Environment (5 min)
```bash
cp .env.example .env
# Edit .env with credentials
```

### 2. Test IQR API (30 min)
```bash
# Test authentication
curl -X POST https://signin.iqreseller.com/api/IntegrationAPI/Session \
  -H "Content-Type: application/json" \
  -d '{"APIToken": "YOUR_KEY"}'

# Find order endpoints in Postman collection
# Update src/clients/iqr-client.ts with real endpoints
```

### 3. Run & Test (2-3 hours)
```bash
npm install
npm run dev

# Test manual sync
curl -X POST http://localhost:3000/api/sync/orders

# Check logs
# Verify orders in ShipStation
```

### 4. Deploy (1-2 hours)
```bash
docker-compose up -d connector
# Configure webhook in ShipStation
# Monitor logs
```

---

## 📁 Key Files You'll Edit

| File | What to Update |
|------|----------------|
| `.env` | Add API credentials |
| `src/clients/iqr-client.ts` | Real IQR endpoint URLs (lines 20-30, 50-60) |
| `src/services/order-sync.service.ts` | Field mappings if needed (lines 21-47) |

---

## 🔧 Essential Commands

```bash
# Development
npm run dev              # Start with hot reload
npm test                 # Run tests
npm run build            # Build for production

# Docker
docker-compose up -d     # Start production
docker-compose logs -f   # View logs
docker-compose down      # Stop

# Testing
curl http://localhost:3000/health
curl http://localhost:3000/health/detailed
curl -X POST http://localhost:3000/api/sync/orders
```

---

## 🐛 Troubleshooting

### Can't connect to IQR
```bash
# Test auth manually
curl -X POST https://signin.iqreseller.com/api/IntegrationAPI/Session \
  -H "Content-Type: application/json" \
  -d '{"APIToken": "YOUR_KEY"}'
```

### Can't connect to ShipStation
```bash
# Test auth manually
curl https://ssapi.shipstation.com/stores \
  -u "API_KEY:API_SECRET"
```

### Check logs
```bash
# All logs
docker-compose logs -f connector

# Just errors
docker-compose logs connector | grep '"level":"error"'

# Just sync events
docker-compose logs connector | grep 'sync'
```

### Environment issues
```bash
# Validate config
docker-compose config

# Check environment
docker-compose exec connector env
```

---

## 📊 What Success Looks Like

1. ✅ Health check returns `{"status":"healthy"}`
2. ✅ Manual sync creates orders in ShipStation
3. ✅ Webhook updates tracking in IQR
4. ✅ Logs show no errors
5. ✅ Scheduled sync runs every 15 minutes
6. ✅ Jeff's team can ship orders normally

---

## 💡 Pro Tips

1. **Test auth first** - Don't write code until you can authenticate
2. **Use Postman** - Import IQR collection, test endpoints manually
3. **Check logs constantly** - Structured JSON makes debugging easy
4. **Start small** - Test with 1 order before batches
5. **Ask me (Augment)** - I can help debug, refactor, optimize

---

## 📞 When to Ask for Help

- IQR API endpoints don't match what's in the code
- Field mappings are wrong (missing data, wrong format)
- Webhook signature validation fails
- Orders not appearing in ShipStation
- Tracking not updating in IQR
- Any errors in logs you don't understand

**Just describe the issue and I'll help fix it!**

---

## 💰 Billing Tracker

Track your hours:

| Task | Estimated | Actual |
|------|-----------|--------|
| Get credentials & verify API | 1-2 hrs | ___ |
| Update code for real API | 2-4 hrs | ___ |
| Integration testing | 2-3 hrs | ___ |
| Deploy & configure | 1-2 hrs | ___ |
| UAT support & fixes | 2-4 hrs | ___ |
| **Total** | **12-20 hrs** | ___ |

**Quote:** $1,500 - $1,800  
**Rate:** $50/hr  
**Buffer:** Built in for unknowns

---

## 📚 Documentation

- **[README.md](README.md)** - Project overview
- **[CHECKLIST.md](CHECKLIST.md)** - Step-by-step implementation
- **[docs/PROJECT_SUMMARY.md](docs/PROJECT_SUMMARY.md)** - Detailed summary
- **[docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)** - How to deploy
- **[docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)** - API reference
- **[docs/TECHNICAL_SPECIFICATION.md](docs/TECHNICAL_SPECIFICATION.md)** - Full spec
- **[docs/IQR_API_ENDPOINTS.md](docs/IQR_API_ENDPOINTS.md)** - IQR API details

---

## ✅ Current Status

**Completed:**
- ✅ Project architecture
- ✅ All source code
- ✅ Tests
- ✅ Docker configuration
- ✅ Documentation
- ✅ Error handling
- ✅ Logging
- ✅ Health checks

**Waiting On:**
- ⏳ API credentials from Robb
- ⏳ IQR Postman collection access
- ⏳ Business logic confirmation

**Next Steps:**
1. Send email to Robb
2. Wait for credentials
3. Test & integrate APIs
4. Deploy & go live

---

**You've got this! 🚀**

