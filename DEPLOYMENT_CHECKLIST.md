# ✅ Deployment Checklist

## Pre-Deployment

### Environment Setup
- [ ] Node.js 18+ installed
- [ ] npm or yarn installed
- [ ] Git installed (if deploying from repository)
- [ ] PM2 installed (optional, for production)
- [ ] Docker installed (optional, for container deployment)

### Configuration
- [ ] `.env` file created from `.env.example`
- [ ] `IQR_API_KEY` configured
- [ ] `SHIPSTATION_API_KEY` configured
- [ ] `SHIPSTATION_API_SECRET` configured
- [ ] `SHIPSTATION_STORE_ID` set to `388003`
- [ ] `SYNC_INTERVAL_MINUTES` configured (default: 15)
- [ ] `PORT` configured (default: 3001)
- [ ] `NODE_ENV` set to `production`

### Testing
- [ ] Run `npm run test:integration` - All tests pass
- [ ] Run `npm run test:iqr` - IQR auth works
- [ ] Run `npm run test:shipstation` - ShipStation auth works
- [ ] Verify target store exists (DPC - Agent Quickbooks, ID: 388003)

---

## Deployment

### Code Preparation
- [ ] Clone repository or copy files to server
- [ ] Run `npm install` to install dependencies
- [ ] Run `npm run build` to compile TypeScript
- [ ] Verify `dist/` folder created

### Initial Start
- [ ] Start service: `npm start` or `pm2 start ecosystem.config.js`
- [ ] Check status: `npm run status`
- [ ] Verify health: `curl http://localhost:3001/health`
- [ ] Check logs for errors

### First Sync Test
- [ ] Trigger manual sync: `npm run test:sync`
- [ ] Check logs for sync results
- [ ] Verify orders created in ShipStation
- [ ] Verify IQR orders updated with ShipStation IDs

---

## Post-Deployment

### Monitoring Setup
- [ ] Configure log rotation
- [ ] Set up log aggregation (optional)
- [ ] Configure monitoring/alerting (optional)
- [ ] Set up uptime monitoring

### Webhook Configuration (Optional)
- [ ] Configure webhook URL in ShipStation
- [ ] Set webhook secret in `.env`
- [ ] Test webhook with sample shipment
- [ ] Verify tracking updates in IQR

### PM2 Configuration (If Using)
- [ ] Run `pm2 save` to save process list
- [ ] Run `pm2 startup` to configure auto-start
- [ ] Verify service restarts on reboot

### Docker Configuration (If Using)
- [ ] Build image: `npm run docker:build`
- [ ] Start container: `docker-compose up -d`
- [ ] Check container status: `docker-compose ps`
- [ ] View logs: `docker-compose logs -f`

---

## Verification

### Service Health
- [ ] Service is running
- [ ] Health check passes: `GET /health`
- [ ] Detailed health passes: `GET /health/detailed`
- [ ] No errors in logs

### Functionality
- [ ] Scheduled sync is running (check logs every 15 min)
- [ ] Orders are being fetched from IQR
- [ ] Orders are being created in ShipStation
- [ ] IQR orders are being updated with ShipStation IDs
- [ ] Duplicate orders are being prevented

### Performance
- [ ] Sync completes in reasonable time (< 5 minutes)
- [ ] No memory leaks (monitor over 24 hours)
- [ ] No excessive CPU usage
- [ ] Disk space is adequate

---

## Security

### API Keys
- [ ] API keys are stored in `.env` (not in code)
- [ ] `.env` is in `.gitignore`
- [ ] File permissions on `.env` are restrictive (600)
- [ ] API keys are valid and active

### Network
- [ ] Firewall configured (if applicable)
- [ ] Only necessary ports open
- [ ] HTTPS configured (if public-facing)
- [ ] Webhook endpoint secured (if using)

---

## Documentation

### Team Training
- [ ] Operations team trained on daily tasks
- [ ] OPERATIONS_GUIDE.md reviewed
- [ ] QUICK_REFERENCE.md distributed
- [ ] Support contacts documented

### Runbooks
- [ ] Start/stop procedures documented
- [ ] Troubleshooting guide reviewed
- [ ] Emergency procedures documented
- [ ] Escalation path defined

---

## Backup & Recovery

### Backup Plan
- [ ] Configuration backed up (`.env`)
- [ ] Code repository accessible
- [ ] Deployment procedure documented
- [ ] Recovery time objective (RTO) defined

### Disaster Recovery
- [ ] Tested service restart
- [ ] Tested server reboot
- [ ] Tested full redeployment
- [ ] Rollback procedure documented

---

## Maintenance

### Regular Tasks
- [ ] Weekly log review scheduled
- [ ] Monthly dependency updates scheduled
- [ ] Quarterly API key rotation scheduled
- [ ] Performance review scheduled

### Monitoring
- [ ] Uptime monitoring configured
- [ ] Error rate monitoring configured
- [ ] Sync success rate monitoring configured
- [ ] Alert thresholds configured

---

## Sign-Off

### Deployment Team
- [ ] Developer sign-off
- [ ] Operations sign-off
- [ ] Business owner sign-off

### Documentation
- [ ] Deployment date recorded
- [ ] Version number recorded
- [ ] Known issues documented
- [ ] Next steps documented

---

## Quick Commands Reference

```bash
# Status
npm run status

# Start
npm start                          # Direct
pm2 start ecosystem.config.js     # PM2
docker-compose up -d              # Docker

# Stop
Ctrl+C                            # Direct
pm2 stop iqr-shipstation-connector  # PM2
docker-compose down               # Docker

# Logs
pm2 logs iqr-shipstation-connector  # PM2
docker-compose logs -f            # Docker

# Test
npm run test:integration          # All tests
npm run test:sync                 # Manual sync
```

---

## Rollback Plan

If deployment fails:

1. **Stop the service**
   ```bash
   pm2 stop iqr-shipstation-connector
   # or
   docker-compose down
   ```

2. **Restore previous version**
   ```bash
   git checkout <previous-version>
   npm install
   npm run build
   ```

3. **Restart service**
   ```bash
   pm2 restart iqr-shipstation-connector
   # or
   docker-compose up -d
   ```

4. **Verify rollback**
   ```bash
   npm run status
   ```

---

## Success Criteria

Deployment is successful when:

- ✅ Service is running and healthy
- ✅ All tests pass
- ✅ First sync completes successfully
- ✅ Orders appear in ShipStation
- ✅ IQR orders are updated
- ✅ No errors in logs
- ✅ Monitoring is active
- ✅ Team is trained

---

**Deployment Date:** _________________

**Deployed By:** _________________

**Version:** 1.0.0

**Status:** _________________

**Notes:** _________________

