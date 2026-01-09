# 🔧 Operations Guide - IQR ↔ ShipStation Connector

## Daily Operations

### Starting the Service

**Windows:**
```bash
start-server.bat
```

**Linux/Mac:**
```bash
npm start
```

**With PM2 (Production):**
```bash
pm2 start ecosystem.config.js
pm2 save
```

---

### Checking Service Status

**Quick Check:**
```bash
node check-status.js
```

**Manual Check:**
```bash
curl http://localhost:3001/health
```

**Detailed Check:**
```bash
curl http://localhost:3001/health/detailed
```

---

### Triggering Manual Sync

**Using Test Script:**
```bash
node test-manual-sync.js
```

**Using curl:**
```bash
curl -X POST http://localhost:3001/api/sync/orders
```

---

### Viewing Logs

**PM2 Logs:**
```bash
pm2 logs iqr-shipstation-connector
pm2 logs iqr-shipstation-connector --lines 100
```

**Direct Logs (if running with npm start):**
Logs will appear in the console where you started the server.

**Log Files (if configured):**
```bash
tail -f logs/output.log
tail -f logs/error.log
```

---

## Monitoring

### Key Metrics to Monitor

1. **Service Health**
   - Check `/health` endpoint every 5 minutes
   - Alert if status is not "healthy"

2. **Sync Success Rate**
   - Monitor logs for "Order sync completed" messages
   - Track "ordersCreated" vs "ordersFetched"

3. **Error Rate**
   - Monitor logs for "error" level messages
   - Alert on repeated authentication failures

4. **Response Times**
   - Monitor API response times in logs
   - Alert if consistently > 5 seconds

### Log Levels

- `info` - Normal operations
- `warn` - Warnings that don't stop operations
- `error` - Errors that need attention

---

## Common Tasks

### Restart the Service

**PM2:**
```bash
pm2 restart iqr-shipstation-connector
```

**Direct:**
```bash
# Stop with Ctrl+C, then:
npm start
```

### Update Configuration

1. Edit `.env` file
2. Restart the service
3. Verify with `node check-status.js`

### View Recent Syncs

```bash
pm2 logs iqr-shipstation-connector --lines 50 | grep "Order sync"
```

### Check for Errors

```bash
pm2 logs iqr-shipstation-connector --err --lines 50
```

---

## Troubleshooting

### Service Won't Start

**Check 1: Port in use**
```bash
# Windows
netstat -ano | findstr :3001

# Linux/Mac
lsof -i :3001
```

**Solution:** Change PORT in `.env` or kill the process using the port.

**Check 2: Missing dependencies**
```bash
npm install
```

**Check 3: Build errors**
```bash
npm run build
```

---

### Authentication Failures

**IQR Authentication Failed:**
1. Check `IQR_API_KEY` in `.env`
2. Verify key is activated in IQR portal
3. Test with: `node test-iqr-auth-simple.js`

**ShipStation Authentication Failed:**
1. Check `SHIPSTATION_API_KEY` and `SHIPSTATION_API_SECRET` in `.env`
2. Verify credentials in ShipStation portal
3. Test with: `node test-shipstation-auth.js`

---

### No Orders Syncing

**Check 1: Are there orders in IQR?**
- Log into IQR portal
- Check Sales Orders
- Verify orders have "DPC - QUIC" agent channel

**Check 2: Are orders already synced?**
- Check user-defined fields in IQR
- If `userdefined5` has a value, order is already synced

**Check 3: Check logs**
```bash
pm2 logs iqr-shipstation-connector | grep "Orders fetched"
```

---

### Webhook Not Working

**Check 1: Webhook URL configured in ShipStation?**
- Should be: `https://your-domain.com/webhooks/shipstation`

**Check 2: Webhook secret matches?**
- Check `SHIPSTATION_WEBHOOK_SECRET` in `.env`

**Check 3: Check logs**
```bash
pm2 logs iqr-shipstation-connector | grep "webhook"
```

---

## Maintenance

### Weekly Tasks

1. **Review Logs**
   - Check for recurring errors
   - Verify sync success rate

2. **Check Disk Space**
   - Ensure log files aren't filling disk
   - Rotate logs if needed

3. **Verify Sync Counts**
   - Compare IQR orders to ShipStation orders
   - Investigate discrepancies

### Monthly Tasks

1. **Update Dependencies**
   ```bash
   npm update
   npm audit fix
   ```

2. **Review Configuration**
   - Verify sync interval is appropriate
   - Check batch size settings

3. **Performance Review**
   - Check average sync times
   - Optimize if needed

### Quarterly Tasks

1. **Rotate API Keys**
   - Generate new keys in IQR and ShipStation
   - Update `.env`
   - Restart service

2. **Review Documentation**
   - Update any changed procedures
   - Document new issues/solutions

---

## Emergency Procedures

### Service Down

1. Check if process is running: `pm2 status`
2. Check logs: `pm2 logs iqr-shipstation-connector --err`
3. Restart: `pm2 restart iqr-shipstation-connector`
4. If still down, check server resources (CPU, memory, disk)

### Data Sync Issues

1. Stop automatic sync (set `SYNC_INTERVAL_MINUTES=0`)
2. Investigate the issue
3. Fix the problem
4. Test with manual sync: `node test-manual-sync.js`
5. Re-enable automatic sync

### API Rate Limiting

If you see rate limit errors:
1. Increase `SYNC_INTERVAL_MINUTES` in `.env`
2. Decrease `SYNC_BATCH_SIZE` in `.env`
3. Restart service

---

## Contact Information

**For Technical Issues:**
- Development Team

**For IQR API Issues:**
- Robb

**For Business Questions:**
- Jeff

---

## Quick Reference

| Task | Command |
|------|---------|
| Start service | `npm start` or `pm2 start ecosystem.config.js` |
| Stop service | `Ctrl+C` or `pm2 stop iqr-shipstation-connector` |
| Restart service | `pm2 restart iqr-shipstation-connector` |
| Check status | `node check-status.js` |
| View logs | `pm2 logs iqr-shipstation-connector` |
| Manual sync | `node test-manual-sync.js` |
| Run tests | `node run-all-tests.js` |
| Health check | `curl http://localhost:3001/health` |

