# 🚀 Deploy to Render - Step by Step

## ✅ Prerequisites
- GitHub account (to push code)
- Render account (free - sign up at https://render.com)

---

## 📦 Step 1: Push Code to GitHub

### 1.1 Add and commit all changes
```bash
git add .
git commit -m "Ready for deployment - removed failed count, added favicon, updated API key"
```

### 1.2 Push to GitHub
```bash
git push origin main
```

**Note:** Make sure your repository is **private** to protect your API keys!

---

## 🌐 Step 2: Deploy to Render

### 2.1 Sign up for Render
1. Go to https://render.com
2. Click "Get Started for Free"
3. Sign up with GitHub (recommended)

### 2.2 Create New Web Service
1. Click "New +" button
2. Select "Web Service"
3. Connect your GitHub repository
4. Select your `iqr-shipstation-connector` repository

### 2.3 Configure the Service
Render will auto-detect the `render.yaml` file, but verify these settings:

**Basic Settings:**
- **Name:** `iqr-shipstation-connector`
- **Runtime:** `Node`
- **Branch:** `main`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Plan:** `Free` (or upgrade for better performance)

### 2.4 Add Environment Variables
Click "Environment" tab and add these **secret** variables:

```
IQR_API_KEY=/wGc/xzjFcwOy8yaDCu388wbbAgkzs7sQqYqqLtb2+uDgnPhKd/0LcZ1+ZLmdSQaB0g/5jUq+eQUaQEdy3BTKQ==

SHIPSTATION_API_KEY=e3cc570635294a05ae5dd642b2c4ba23

SHIPSTATION_API_SECRET=6ecc2cb3549943a4bf1f1555009b37ea

SHIPSTATION_WEBHOOK_SECRET=(leave empty for now)
```

**Note:** The other environment variables are already set in `render.yaml`!

### 2.5 Deploy!
1. Click "Create Web Service"
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Build TypeScript
   - Start the server
   - Assign a public URL

---

## ✅ Step 3: Verify Deployment

### 3.1 Check Build Logs
Watch the logs in Render dashboard to ensure:
- ✅ Dependencies installed
- ✅ TypeScript compiled
- ✅ Server started on port 10000

### 3.2 Test Your Live App
Once deployed, Render gives you a URL like:
```
https://iqr-shipstation-connector.onrender.com
```

**Test it:**
1. Open the URL in your browser → See the dashboard
2. Check health: `https://your-app.onrender.com/health`
3. Check detailed health: `https://your-app.onrender.com/health/detailed`

---

## 🔧 Step 4: Configure ShipStation Webhook (Optional)

If you want real-time tracking updates:

1. Go to ShipStation → Settings → Webhooks
2. Add new webhook:
   - **URL:** `https://your-app.onrender.com/webhooks/shipstation`
   - **Event:** Order Shipped
3. Copy the webhook secret
4. Add it to Render environment variables as `SHIPSTATION_WEBHOOK_SECRET`

---

## 📊 Step 5: Monitor Your App

### Dashboard
Access your live dashboard at:
```
https://your-app.onrender.com
```

### Render Dashboard
Monitor in Render:
- Logs (real-time)
- Metrics (CPU, memory)
- Deploy history
- Environment variables

---

## 🎯 What Happens After Deployment?

### Automatic Sync
- ✅ Syncs orders every 15 minutes automatically
- ✅ Filters by: Open/Partial status, last 30 days, DPC - QUIC channel
- ✅ No duplicates (orderKey protection)

### Always Running
- ✅ Render keeps your app running 24/7
- ✅ Auto-restarts if it crashes
- ✅ Health checks every 30 seconds

### Free Tier Limitations
- ⚠️ Spins down after 15 minutes of inactivity
- ⚠️ Takes ~30 seconds to wake up on first request
- ✅ Upgrade to paid plan ($7/month) for always-on

---

## 🔄 Updating Your Deployment

### To deploy changes:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

Render will automatically:
1. Detect the push
2. Rebuild the app
3. Deploy the new version
4. Zero-downtime deployment!

---

## 🆘 Troubleshooting

### Build Fails
- Check Render logs for errors
- Verify `package.json` has all dependencies
- Ensure TypeScript compiles locally first

### App Won't Start
- Check environment variables are set
- Verify API keys are correct
- Check logs for startup errors

### Can't Connect to APIs
- Verify IQR_API_KEY is complete
- Check ShipStation credentials
- Test health endpoint: `/health/detailed`

---

## 💰 Cost

### Free Tier (Current)
- ✅ 750 hours/month free
- ✅ Perfect for this integration
- ⚠️ Spins down after inactivity

### Starter Plan ($7/month)
- ✅ Always running (no spin down)
- ✅ Faster performance
- ✅ Better for production

---

## 🎉 You're Live!

Once deployed, your integration will:
- ✅ Run 24/7 in the cloud
- ✅ Sync orders every 15 minutes
- ✅ Update tracking automatically
- ✅ Show beautiful dashboard
- ✅ No local server needed!

**Your live URL:** `https://iqr-shipstation-connector.onrender.com`

---

## 📝 Next Steps

1. ✅ Bookmark your live dashboard URL
2. ✅ Set up ShipStation webhook (optional)
3. ✅ Monitor the first few syncs
4. ✅ Consider upgrading to paid plan for always-on
5. ✅ Share dashboard URL with team!

**Congratulations! You're live! 🚀**

