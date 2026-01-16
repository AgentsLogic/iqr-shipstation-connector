# 🚀 Deployment Checklist

## ✅ Pre-Deployment (Completed)

- [x] Code is ready and tested locally
- [x] Environment variables configured in `.env`
- [x] Dashboard cleaned up (removed "Failed" count)
- [x] Favicon added 📦
- [x] Footer updated
- [x] API key verified and working
- [x] `render.yaml` created for easy deployment
- [x] All changes committed to git
- [x] Code pushed to GitHub

---

## 🌐 Deploy to Render - Quick Steps

### 1. Sign Up / Log In to Render
- Go to: https://render.com
- Sign up with GitHub (recommended)

### 2. Create New Web Service
- Click "New +" → "Web Service"
- Connect your GitHub account
- Select: `AgentsLogic/iqr-shipstation-connector`

### 3. Render Auto-Detects Settings
Render will read `render.yaml` and configure automatically!

### 4. Add Secret Environment Variables
Add these 3 secret variables in Render dashboard:

```
IQR_API_KEY = /wGc/xzjFcwOy8yaDCu388wbbAgkzs7sQqYqqLtb2+uDgnPhKd/0LcZ1+ZLmdSQaB0g/5jUq+eQUaQEdy3BTKQ==

SHIPSTATION_API_KEY = e3cc570635294a05ae5dd642b2c4ba23

SHIPSTATION_API_SECRET = 6ecc2cb3549943a4bf1f1555009b37ea
```

### 5. Click "Create Web Service"
Render will:
- Clone your repo
- Install dependencies
- Build TypeScript
- Start the server
- Give you a live URL!

---

## ✅ Verify Deployment

### Your Live URL:
```
https://iqr-shipstation-connector.onrender.com
```

### Test These:
- [ ] Dashboard: `https://your-app.onrender.com`
- [ ] Health: `https://your-app.onrender.com/health`
- [ ] Detailed Health: `https://your-app.onrender.com/health/detailed`

---

## 🎉 Success!

When you see:
- ✅ Dashboard loads with 📦 favicon
- ✅ IQR API: Connected
- ✅ ShipStation API: Connected
- ✅ Sync running every 15 minutes

**You're live! 🚀**

---

## 📖 Full Guide

See `DEPLOY_TO_RENDER.md` for detailed step-by-step instructions.

