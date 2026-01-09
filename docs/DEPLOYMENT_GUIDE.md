# Deployment Guide

## Prerequisites

- Node.js 18+ or Docker
- IQ Reseller API credentials
- ShipStation API credentials
- Server or cloud hosting (Azure, AWS, DigitalOcean, etc.)

---

## Option 1: Docker Deployment (Recommended)

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd iqr-shipstation-connector
```

### Step 2: Create Environment File

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Server Configuration
NODE_ENV=production
PORT=3000

# IQ Reseller
IQR_API_KEY=your_iqr_api_key_here
IQR_AUTH_URL=https://signin.iqreseller.com
IQR_API_BASE_URL=https://api.iqreseller.com

# ShipStation
SHIPSTATION_API_KEY=your_shipstation_api_key
SHIPSTATION_API_SECRET=your_shipstation_api_secret
SHIPSTATION_API_BASE_URL=https://ssapi.shipstation.com
SHIPSTATION_WEBHOOK_SECRET=your_webhook_secret_here

# Sync Configuration
SYNC_INTERVAL_MINUTES=15
SYNC_BATCH_SIZE=50
SYNC_MAX_RETRIES=3
```

### Step 3: Build and Run with Docker Compose

```bash
# Build and start the container
docker-compose up -d connector

# View logs
docker-compose logs -f connector

# Stop the container
docker-compose down
```

### Step 4: Verify Deployment

```bash
# Check health
curl http://localhost:3000/health

# Check detailed health (tests API connectivity)
curl http://localhost:3000/health/detailed
```

---

## Option 2: Node.js Deployment

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Build TypeScript

```bash
npm run build
```

### Step 3: Set Environment Variables

Export environment variables or use a `.env` file with a package like `dotenv`.

### Step 4: Start the Server

```bash
npm start
```

---

## Option 3: Cloud Deployment

### Azure App Service

1. Create an Azure App Service (Node.js 18+)
2. Configure environment variables in Application Settings
3. Deploy using:
   - Azure DevOps Pipeline
   - GitHub Actions
   - VS Code Azure Extension

### AWS Elastic Beanstalk

1. Create an Elastic Beanstalk application (Node.js platform)
2. Configure environment variables
3. Deploy using EB CLI or AWS Console

### DigitalOcean App Platform

1. Create a new App
2. Connect your Git repository
3. Configure environment variables
4. Deploy automatically on push

---

## Configuring ShipStation Webhook

### Step 1: Get Your Webhook URL

Your webhook URL will be:
```
https://your-domain.com/webhooks/shipstation
```

### Step 2: Configure in ShipStation

1. Log into ShipStation
2. Go to **Settings** → **Account** → **Webhooks**
3. Click **Add Webhook**
4. Configure:
   - **Event:** `SHIP_NOTIFY` (Order Shipped)
   - **Target URL:** Your webhook URL
   - **Friendly Name:** IQR Connector
5. Save and test

### Step 3: Verify Webhook

Check your logs to confirm webhooks are being received:

```bash
docker-compose logs -f connector | grep "webhook"
```

---

## Monitoring & Maintenance

### Health Checks

The connector provides multiple health check endpoints:

- **`/health`** - Basic health check (always returns 200 if running)
- **`/health/detailed`** - Tests IQR and ShipStation connectivity
- **`/ready`** - Kubernetes readiness probe
- **`/live`** - Kubernetes liveness probe

### Logs

Logs are output in JSON format for easy parsing:

```bash
# View all logs
docker-compose logs -f connector

# Filter for errors
docker-compose logs connector | grep '"level":"error"'

# Filter for sync events
docker-compose logs connector | grep 'sync'
```

### Manual Sync Trigger

You can manually trigger a sync via API:

```bash
curl -X POST http://localhost:3000/api/sync/orders \
  -H "Content-Type: application/json" \
  -d '{
    "fromDate": "2024-01-01",
    "toDate": "2024-01-31",
    "orderStatus": "Approved"
  }'
```

---

## Troubleshooting

### Container Won't Start

Check environment variables:
```bash
docker-compose config
```

### API Connection Errors

Test connectivity manually:
```bash
# Test IQR
curl -X POST https://signin.iqreseller.com/api/IntegrationAPI/Session \
  -H "Content-Type: application/json" \
  -d '{"APIToken": "your_api_key"}'

# Test ShipStation
curl https://ssapi.shipstation.com/stores \
  -u "api_key:api_secret"
```

### Webhook Not Receiving Events

1. Verify webhook is configured in ShipStation
2. Check firewall allows inbound traffic on port 3000
3. Verify webhook URL is publicly accessible
4. Check logs for signature validation errors

---

## Security Best Practices

1. **Use HTTPS** - Always use SSL/TLS in production
2. **Webhook Secret** - Configure `SHIPSTATION_WEBHOOK_SECRET` to validate webhooks
3. **Firewall** - Restrict access to only necessary IPs
4. **Secrets Management** - Use Azure Key Vault, AWS Secrets Manager, or similar
5. **Regular Updates** - Keep dependencies updated

---

## Scaling

### Horizontal Scaling

The connector is stateless and can be scaled horizontally:

```bash
docker-compose up -d --scale connector=3
```

**Note:** Only one instance should run scheduled syncs. Disable `SYNC_INTERVAL_MINUTES` on additional instances.

### Vertical Scaling

Increase container resources in `docker-compose.yml`:

```yaml
services:
  connector:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

