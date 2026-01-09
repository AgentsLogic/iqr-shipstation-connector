# 📚 Documentation Index

## Quick Navigation

| Document | Purpose | Audience |
|----------|---------|----------|
| [README.md](#readme) | Project overview | Everyone |
| [QUICK_REFERENCE.md](#quick-reference) | Command cheat sheet | Operators |
| [DEPLOYMENT_GUIDE.md](#deployment-guide) | Deployment instructions | DevOps |
| [DEPLOYMENT_CHECKLIST.md](#deployment-checklist) | Pre-flight checklist | DevOps |
| [OPERATIONS_GUIDE.md](#operations-guide) | Daily operations | Operators |
| [INTEGRATION_NOTES.md](#integration-notes) | API details | Developers |
| [PROJECT_SUMMARY.md](#project-summary) | Executive summary | Management |
| [FINAL_STATUS.md](#final-status) | Completion status | Everyone |

---

## README

**File:** `README.md`  
**Purpose:** Main project documentation  
**Audience:** Everyone

**Contents:**
- Project overview
- Features
- Quick start guide
- Installation instructions
- Configuration
- API endpoints
- Testing
- Docker deployment

**When to use:**
- First time learning about the project
- Understanding what the project does
- Getting started with development

---

## Quick Reference

**File:** `QUICK_REFERENCE.md`  
**Purpose:** Command cheat sheet  
**Audience:** Operators, DevOps

**Contents:**
- Start/stop commands
- Status checks
- Log viewing
- Sync triggers
- Testing commands
- Troubleshooting quick fixes

**When to use:**
- Daily operations
- Quick command lookup
- Troubleshooting

---

## Deployment Guide

**File:** `DEPLOYMENT_GUIDE.md`  
**Purpose:** Complete deployment instructions  
**Audience:** DevOps, System Administrators

**Contents:**
- Prerequisites
- Installation steps
- Configuration details
- Deployment options (Node.js, PM2, Docker)
- Verification steps
- Troubleshooting

**When to use:**
- First deployment
- Setting up new environment
- Troubleshooting deployment issues

---

## Deployment Checklist

**File:** `DEPLOYMENT_CHECKLIST.md`  
**Purpose:** Pre-flight deployment checklist  
**Audience:** DevOps, System Administrators

**Contents:**
- Pre-deployment tasks
- Deployment steps
- Post-deployment verification
- Security checklist
- Monitoring setup
- Sign-off section

**When to use:**
- Before deploying to production
- Ensuring nothing is missed
- Deployment documentation

---

## Operations Guide

**File:** `OPERATIONS_GUIDE.md`  
**Purpose:** Daily operations procedures  
**Audience:** Operators, Support Team

**Contents:**
- Starting/stopping service
- Checking status
- Viewing logs
- Triggering manual sync
- Monitoring
- Common tasks
- Troubleshooting
- Maintenance schedules

**When to use:**
- Daily operations
- Troubleshooting issues
- Routine maintenance
- Emergency procedures

---

## Integration Notes

**File:** `INTEGRATION_NOTES.md`  
**Purpose:** Technical API integration details  
**Audience:** Developers

**Contents:**
- IQR API documentation
- ShipStation API documentation
- Authentication details
- Endpoint specifications
- Data mapping
- Error handling
- Rate limiting

**When to use:**
- Understanding API integrations
- Debugging API issues
- Extending functionality
- Technical troubleshooting

---

## Project Summary

**File:** `PROJECT_SUMMARY.md`  
**Purpose:** Executive project summary  
**Audience:** Management, Stakeholders

**Contents:**
- Executive summary
- What was delivered
- Technical specifications
- Key features
- Test results
- Deployment options
- Success criteria
- Next steps

**When to use:**
- Project overview for management
- Understanding project scope
- Status reporting
- Planning next steps

---

## Final Status

**File:** `FINAL_STATUS.md`  
**Purpose:** Project completion status  
**Audience:** Everyone

**Contents:**
- Test results
- What was built
- Key achievements
- Files created
- Deployment instructions
- Success metrics
- Conclusion

**When to use:**
- Verifying project completion
- Understanding what was delivered
- Confirming all tests pass
- Ready for deployment

---

## Additional Resources

### Test Scripts

| Script | Purpose |
|--------|---------|
| `run-all-tests.js` | Run all integration tests |
| `test-iqr-auth-simple.js` | Test IQR authentication |
| `test-shipstation-auth.js` | Test ShipStation authentication |
| `test-manual-sync.js` | Test manual sync |
| `check-status.js` | Check service status |

### Configuration Files

| File | Purpose |
|------|---------|
| `.env` | Environment variables |
| `.env.example` | Environment template |
| `ecosystem.config.js` | PM2 configuration |
| `docker-compose.yml` | Docker Compose config |
| `Dockerfile` | Docker image config |
| `tsconfig.json` | TypeScript config |
| `package.json` | Node.js dependencies |

### Startup Scripts

| Script | Purpose |
|--------|---------|
| `start-server.bat` | Windows startup script |
| `npm start` | Direct Node.js start |
| `pm2 start ecosystem.config.js` | PM2 start |
| `docker-compose up -d` | Docker start |

---

## Documentation Flow

### For New Users

1. Start with [README.md](#readme)
2. Review [PROJECT_SUMMARY.md](#project-summary)
3. Follow [DEPLOYMENT_GUIDE.md](#deployment-guide)
4. Use [DEPLOYMENT_CHECKLIST.md](#deployment-checklist)
5. Keep [QUICK_REFERENCE.md](#quick-reference) handy

### For Operators

1. Review [OPERATIONS_GUIDE.md](#operations-guide)
2. Keep [QUICK_REFERENCE.md](#quick-reference) handy
3. Refer to [DEPLOYMENT_GUIDE.md](#deployment-guide) for troubleshooting

### For Developers

1. Read [README.md](#readme)
2. Study [INTEGRATION_NOTES.md](#integration-notes)
3. Review source code in `src/`
4. Run tests with `npm run test:integration`

### For Management

1. Read [PROJECT_SUMMARY.md](#project-summary)
2. Review [FINAL_STATUS.md](#final-status)
3. Check [README.md](#readme) for overview

---

## Getting Help

### Quick Answers
- **Commands:** [QUICK_REFERENCE.md](#quick-reference)
- **Troubleshooting:** [OPERATIONS_GUIDE.md](#operations-guide)
- **Deployment:** [DEPLOYMENT_GUIDE.md](#deployment-guide)

### Technical Support
- **IQR API Issues:** Contact Robb
- **Business Questions:** Contact Jeff
- **Technical Issues:** Development Team

### Documentation Updates

If you find errors or need clarification:
1. Note the document name and section
2. Contact the development team
3. Suggest improvements

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-09 | Initial release |

---

**Last Updated:** January 9, 2026  
**Maintained By:** Development Team

