# 🚀 Backend Deployment with Fly.io + Supabase IPv6

**Why Fly.io + IPv6?**
- ✅ Native IPv6 support for direct Supabase connection
- ✅ Faster database queries (no IPv4 translation layer)
- ✅ Better connection pooling
- ✅ Free tier: 3 shared-cpu-1x VMs + 3GB persistent storage
- ✅ Global edge deployment
- ✅ No cold starts (unlike Render free tier)

**Estimated Time:** 30-45 minutes  
**Cost:** $0/month (free tier) or $5-10/month (upgraded)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Install Fly.io CLI](#install-flyio-cli)
3. [Configure Supabase IPv6](#configure-supabase-ipv6)
4. [Prepare Backend Application](#prepare-backend-application)
5. [Deploy to Fly.io](#deploy-to-flyio)
6. [Configure Secrets](#configure-secrets)
7. [Test Deployment](#test-deployment)
8. [Custom Domain Setup](#custom-domain-setup)
9. [Monitoring & Scaling](#monitoring--scaling)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- [ ] Supabase account with project created
- [ ] Backend code ready (Node.js + Express)
- [ ] GitHub repository set up
- [ ] Terminal/Command Prompt access
- [ ] Credit card for Fly.io verification (not charged on free tier)

---

## Install Fly.io CLI

### Windows (PowerShell)

```powershell
# Install Fly.io CLI
iwr https://fly.io/install.ps1 -useb | iex

# Verify installation
fly version
```

### macOS/Linux

```bash
# Install Fly.io CLI
curl -L https://fly.io/install.sh | sh

# Add to PATH (if needed)
export FLYCTL_INSTALL="$HOME/.fly"
export PATH="$FLYCTL_INSTALL/bin:$PATH"

# Verify installation
fly version
```

### Sign Up and Login

```bash
# Create account (opens browser)
fly auth signup

# Or login if you have an account
fly auth login

# Verify you're logged in
fly auth whoami
```

---

## Configure Supabase IPv6

### Step 1: Get IPv6 Connection String

1. **Go to Supabase Dashboard:** https://app.supabase.com
2. **Select your project** (e.g., `voice-church-dev`)
3. **Navigate to:** Settings → Database
4. **Find "Connection string" section**
5. **Select "URI" mode**
6. **Look for IPv6 address:**

**Standard Connection String (IPv4):**
```
postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

**IPv6 Connection String (Preferred for Fly.io):**
```
postgresql://postgres.[project-ref]:[password]@[2a05:d014:1c06:4f03::1]:5432/postgres
```

### Step 2: Get Direct Connection (Session Mode)

For Fly.io, we'll use **Session mode** (direct connection) instead of transaction pooling:

1. **In Supabase Dashboard:** Settings → Database
2. **Connection Info section**
3. **Copy these details:**
   - Host: `db.[project-ref].supabase.co`
   - Port: `5432`
   - Database: `postgres`
   - User: `postgres`
   - Password: [your database password]

4. **Build IPv6 connection string:**

```bash
# Format:
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Example:
postgresql://postgres:your-password@db.abcdefghijk.supabase.co:5432/postgres
```

**Important:** Supabase's direct connection automatically supports both IPv4 and IPv6. Fly.io will use IPv6 when available.

### Step 3: Enable IPv6 in Supabase

1. **Settings → Database**
2. **IPv6 Support:** Should be enabled by default
3. **Connection Pooling:** Can be disabled (Fly.io handles this)
4. **SSL Mode:** Required (Fly.io supports this)

---

## Prepare Backend Application

### Step 1: Update server/package.json

Ensure your package.json has the correct configuration:

```json
{
  "name": "voice-church-api",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2"
  }
}
```

### Step 2: Update server/index.js for IPv6

```javascript
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pg from 'pg';

const { Pool } = pg;
const app = express();

// Environment variables
const PORT = process.env.PORT || 3001;
const DATABASE_URL = process.env.DATABASE_URL;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Database connection with IPv6 support
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Connection pool settings optimized for Fly.io
  max: 20, // Maximum number of clients
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test database connection on startup
pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
});

// Middleware
app.use(cors({
  origin: CORS_ORIGIN.split(','), // Support multiple origins
  credentials: true
}));
app.use(express.json());

// Health check endpoint (important for Fly.io monitoring)
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy',
      error: error.message 
    });
  }
});

// Your API routes here...

// Start server - Listen on all interfaces (0.0.0.0) for Fly.io
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📦 Environment: ${NODE_ENV}`);
  console.log(`🌐 CORS Origin: ${CORS_ORIGIN}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server gracefully...');
  await pool.end();
  process.exit(0);
});
```

### Step 3: Create Dockerfile (Fly.io uses Docker)

Create `server/Dockerfile`:

```dockerfile
# Use official Node.js LTS image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["npm", "start"]
```

### Step 4: Create .dockerignore

Create `server/.dockerignore`:

```
node_modules
npm-debug.log
.env
.env.*
.git
.gitignore
README.md
.DS_Store
*.log
```

---

## Deploy to Fly.io

### Step 1: Initialize Fly.io App (Development)

```bash
# Navigate to server directory
cd server

# Launch Fly.io app (interactive setup)
fly launch

# Follow prompts:
# ❓ App Name: voice-church-api-dev
# ❓ Organization: [Select your org]
# ❓ Region: Choose closest to you (e.g., iad - US East)
# ❓ PostgreSQL: No (we're using Supabase)
# ❓ Redis: No
# ❓ Deploy now: No (we'll set secrets first)
```

This creates a `fly.toml` configuration file.

### Step 2: Configure fly.toml

The generated `fly.toml` should look like this. Edit it:

```toml
# fly.toml - Voice Church API Development

app = "voice-church-api-dev"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "development"
  PORT = "3001"

[http_service]
  internal_port = 3001
  force_https = true
  auto_stop_machines = false  # Keep running (no cold starts)
  auto_start_machines = true
  min_machines_running = 1

  # Health check configuration
  [http_service.checks]
    [http_service.checks.health]
      grace_period = "10s"
      interval = "30s"
      method = "GET"
      timeout = "5s"
      path = "/health"

[[services]]
  protocol = "tcp"
  internal_port = 3001

  [[services.ports]]
    port = 80
    handlers = ["http"]
    force_https = true

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [services.concurrency]
    type = "connections"
    hard_limit = 1000
    soft_limit = 800

# VM configuration
[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

### Step 3: Set Environment Secrets

**Never commit secrets to git!** Use Fly.io secrets:

```bash
# Set DATABASE_URL (Supabase connection string)
fly secrets set DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Generate and set JWT_SECRET
# On Linux/Mac:
fly secrets set JWT_SECRET="$(openssl rand -hex 64)"

# On Windows PowerShell:
$jwt = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
fly secrets set JWT_SECRET="$jwt"

# Set CORS_ORIGIN (your frontend URL)
fly secrets set CORS_ORIGIN="https://dev-thevoicechurch.synapsedigitalai.com"

# Verify secrets are set (values are hidden)
fly secrets list
```

### Step 4: Deploy Development Environment

```bash
# Deploy the application
fly deploy

# This will:
# 1. Build Docker image
# 2. Push to Fly.io registry
# 3. Deploy to your region
# 4. Start the VM

# Monitor deployment
fly logs

# Check status
fly status
```

### Step 5: Verify Deployment

```bash
# Get app info
fly info

# Your app URL will be: https://voice-church-api-dev.fly.dev

# Test health endpoint
curl https://voice-church-api-dev.fly.dev/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2024-11-17T...",
#   "environment": "development",
#   "database": "connected"
# }
```

---

## Deploy Production Environment

### Step 1: Create Production App

```bash
# In server directory
fly launch --no-deploy

# Prompts:
# ❓ App Name: voice-church-api-prod
# ❓ Organization: [Same org]
# ❓ Region: [Same region as dev]
# ❓ PostgreSQL: No
# ❓ Redis: No
# ❓ Deploy now: No
```

### Step 2: Update fly.toml for Production

Rename the generated file or create `fly.prod.toml`:

```toml
app = "voice-church-api-prod"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "3001"

[http_service]
  internal_port = 3001
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

  [http_service.checks]
    [http_service.checks.health]
      grace_period = "10s"
      interval = "30s"
      method = "GET"
      timeout = "5s"
      path = "/health"

[[services]]
  protocol = "tcp"
  internal_port = 3001

  [[services.ports]]
    port = 80
    handlers = ["http"]
    force_https = true

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [services.concurrency]
    type = "connections"
    hard_limit = 1000
    soft_limit = 800

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 512  # More memory for production
```

### Step 3: Set Production Secrets

```bash
# Switch to production app context
fly apps list  # See all your apps

# Set secrets for production (use -a flag for app name)
fly secrets set DATABASE_URL="postgresql://postgres:[PROD_PASSWORD]@db.[PROD_PROJECT].supabase.co:5432/postgres" -a voice-church-api-prod

fly secrets set JWT_SECRET="$(openssl rand -hex 64)" -a voice-church-api-prod

fly secrets set CORS_ORIGIN="https://thevoicechurch.synapsedigitalai.com" -a voice-church-api-prod

# Verify
fly secrets list -a voice-church-api-prod
```

### Step 4: Deploy Production

```bash
# Deploy production with specific config file
fly deploy -a voice-church-api-prod -c fly.prod.toml

# Check status
fly status -a voice-church-api-prod

# View logs
fly logs -a voice-church-api-prod

# Test
curl https://voice-church-api-prod.fly.dev/health
```

---

## Configure Secrets

### Complete Environment Variables

**Development App:**
```bash
fly secrets set \
  DATABASE_URL="postgresql://postgres:DEV_PASSWORD@db.DEV_PROJECT.supabase.co:5432/postgres" \
  JWT_SECRET="your-random-64-char-secret" \
  CORS_ORIGIN="https://dev-thevoicechurch.synapsedigitalai.com,http://localhost:5173" \
  NODE_ENV="development" \
  -a voice-church-api-dev
```

**Production App:**
```bash
fly secrets set \
  DATABASE_URL="postgresql://postgres:PROD_PASSWORD@db.PROD_PROJECT.supabase.co:5432/postgres" \
  JWT_SECRET="different-random-64-char-secret" \
  CORS_ORIGIN="https://thevoicechurch.synapsedigitalai.com" \
  NODE_ENV="production" \
  -a voice-church-api-prod
```

### Verify Database Connection

```bash
# SSH into your Fly.io VM
fly ssh console -a voice-church-api-dev

# Test database connection
node -e "
const pg = require('pg');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()', (err, res) => {
  console.log(err ? err.message : 'Connected: ' + res.rows[0].now);
  pool.end();
});
"

# Exit SSH
exit
```

---

## Test Deployment

### Health Check

```bash
# Development
curl https://voice-church-api-dev.fly.dev/health

# Production
curl https://voice-church-api-prod.fly.dev/health
```

### Test API Endpoints

```bash
# Test login endpoint (example)
curl -X POST https://voice-church-api-dev.fly.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@thevoicechurch.org","pin":"1234"}'
```

### Monitor Logs

```bash
# Real-time logs (development)
fly logs -a voice-church-api-dev

# Production logs
fly logs -a voice-church-api-prod

# Follow logs (live tail)
fly logs -a voice-church-api-dev -f
```

---

## Custom Domain Setup

### Step 1: Add Custom Domain to Fly.io

```bash
# Development
fly certs add api-dev.thevoicechurch.synapsedigitalai.com -a voice-church-api-dev

# Production
fly certs add api.thevoicechurch.synapsedigitalai.com -a voice-church-api-prod

# Get certificate info
fly certs show api-dev.thevoicechurch.synapsedigitalai.com -a voice-church-api-dev
```

### Step 2: Configure DNS (Hostinger)

1. **Log into Hostinger**
2. **Go to:** Domains → synapsedigitalai.com → DNS Zone
3. **Add CNAME Records:**

**Development:**
```
Type: CNAME
Name: api-dev.thevoicechurch
Target: voice-church-api-dev.fly.dev
TTL: 3600
```

**Production:**
```
Type: CNAME
Name: api.thevoicechurch
Target: voice-church-api-prod.fly.dev
TTL: 3600
```

### Step 3: Verify SSL Certificate

```bash
# Check certificate status
fly certs check api-dev.thevoicechurch.synapsedigitalai.com -a voice-church-api-dev

# Should show "The certificate for api-dev.thevoicechurch.synapsedigitalai.com has been issued"

# Test HTTPS
curl https://api-dev.thevoicechurch.synapsedigitalai.com/health
```

### Step 4: Update Frontend API URLs

Update Vercel environment variables:

**Development Project:**
```
VITE_API_URL=https://api-dev.thevoicechurch.synapsedigitalai.com
```

**Production Project:**
```
VITE_API_URL=https://api.thevoicechurch.synapsedigitalai.com
```

### Step 5: Update CORS Origins

```bash
# Update development CORS
fly secrets set CORS_ORIGIN="https://dev-thevoicechurch.synapsedigitalai.com,http://localhost:5173" -a voice-church-api-dev

# Update production CORS
fly secrets set CORS_ORIGIN="https://thevoicechurch.synapsedigitalai.com" -a voice-church-api-prod
```

---

## Monitoring & Scaling

### View Metrics

```bash
# App dashboard (opens browser)
fly dashboard -a voice-church-api-dev

# View metrics in terminal
fly vm status -a voice-church-api-dev

# Check resource usage
fly vm status -a voice-church-api-dev --json
```

### Scaling

**Scale VMs:**
```bash
# Scale to 2 VMs for production (high availability)
fly scale count 2 -a voice-church-api-prod

# Scale down to 1 VM
fly scale count 1 -a voice-church-api-prod

# Check current scale
fly scale show -a voice-church-api-prod
```

**Scale VM Resources:**
```bash
# Upgrade VM memory
fly scale vm shared-cpu-1x --memory 512 -a voice-church-api-prod

# Upgrade to dedicated CPU (if needed)
fly scale vm dedicated-cpu-1x -a voice-church-api-prod

# View available VM sizes
fly platform vm-sizes
```

### Set Up Monitoring Alerts

1. **Go to Fly.io Dashboard:** https://fly.io/dashboard
2. **Select your app**
3. **Monitoring tab**
4. **Configure alerts:**
   - Response time > 2s
   - Error rate > 5%
   - Health check failures
   - CPU > 80%

### PostgreSQL Connection Pool Monitoring

```bash
# Check active connections
fly ssh console -a voice-church-api-prod

# Inside VM:
node -e "
const pg = require('pg');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()', (err, res) => {
  console.log('Active connections:', res?.rows[0]?.count);
  pool.end();
});
"
```

---

## CI/CD with GitHub Actions

### Create .github/workflows/deploy-flyio.yml

```yaml
name: Deploy to Fly.io

on:
  push:
    branches:
      - main
      - develop

jobs:
  deploy:
    name: Deploy Backend
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Fly.io CLI
        uses: superfly/flyctl-actions/setup-flyctl@master
      
      - name: Deploy Development
        if: github.ref == 'refs/heads/develop'
        run: |
          cd server
          flyctl deploy --remote-only -a voice-church-api-dev
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
      
      - name: Deploy Production
        if: github.ref == 'refs/heads/main'
        run: |
          cd server
          flyctl deploy --remote-only -a voice-church-api-prod -c fly.prod.toml
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

### Add GitHub Secret

1. **Get Fly.io API Token:**
   ```bash
   fly auth token
   ```

2. **Add to GitHub:**
   - Repository → Settings → Secrets → Actions
   - New repository secret
   - Name: `FLY_API_TOKEN`
   - Value: [paste token]

---

## Troubleshooting

### Issue: App won't start

**Check logs:**
```bash
fly logs -a voice-church-api-dev

# Look for errors in:
# - Database connection
# - Missing environment variables
# - Port binding issues
```

**Common fixes:**
```bash
# Verify secrets are set
fly secrets list -a voice-church-api-dev

# Check app is listening on 0.0.0.0 (not localhost)
# In index.js: app.listen(PORT, '0.0.0.0', ...)

# Restart app
fly apps restart -a voice-church-api-dev
```

### Issue: Database connection timeout

**Check:**
```bash
# Test from Fly.io VM
fly ssh console -a voice-church-api-dev

# Test DNS resolution
nslookup db.[project-ref].supabase.co

# Test connectivity
nc -zv db.[project-ref].supabase.co 5432
```

**Fix:**
```bash
# Verify DATABASE_URL format
fly secrets list -a voice-church-api-dev

# Update if incorrect
fly secrets set DATABASE_URL="postgresql://..." -a voice-church-api-dev
```

### Issue: Health check failing

**Check health endpoint:**
```bash
# SSH into VM
fly ssh console -a voice-church-api-dev

# Test locally
curl http://localhost:3001/health

# Check if process is running
ps aux | grep node
```

**Fix in fly.toml:**
```toml
[http_service.checks.health]
  grace_period = "30s"  # Increase if app is slow to start
  interval = "60s"      # Less frequent checks
  timeout = "10s"       # Longer timeout
  path = "/health"
```

### Issue: CORS errors

**Update CORS origin:**
```bash
# Allow multiple origins
fly secrets set CORS_ORIGIN="https://dev-site.com,https://prod-site.com" -a voice-church-api-dev

# Restart app
fly apps restart -a voice-church-api-dev
```

### Issue: Out of memory

**Check memory usage:**
```bash
fly vm status -a voice-church-api-dev

# If consistently high, scale up:
fly scale vm shared-cpu-1x --memory 512 -a voice-church-api-dev
```

### Issue: Slow database queries

**Optimize connection pool:**

In `index.js`:
```javascript
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,              // Reduce max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});
```

---

## Quick Command Reference

```bash
# Deployment
fly deploy -a voice-church-api-dev
fly deploy -a voice-church-api-prod -c fly.prod.toml

# Secrets
fly secrets set KEY=value -a APP_NAME
fly secrets list -a APP_NAME
fly secrets unset KEY -a APP_NAME

# Logs & Monitoring
fly logs -a APP_NAME
fly logs -a APP_NAME -f  # Follow/tail
fly status -a APP_NAME
fly vm status -a APP_NAME

# SSH Access
fly ssh console -a APP_NAME
fly ssh sftp shell -a APP_NAME

# Scaling
fly scale count 2 -a APP_NAME
fly scale vm shared-cpu-1x --memory 512 -a APP_NAME

# Apps Management
fly apps list
fly apps restart -a APP_NAME
fly apps destroy APP_NAME

# Certificates
fly certs add api.example.com -a APP_NAME
fly certs show api.example.com -a APP_NAME
fly certs check api.example.com -a APP_NAME

# Regions
fly regions list
fly regions add lax -a APP_NAME  # Add LA region
```

---

## Cost Breakdown

**Free Tier Includes:**
- 3 shared-cpu-1x VMs (256MB RAM each)
- 3GB persistent storage
- 160GB outbound data transfer/month
- Free SSL certificates

**Your Setup (Free Tier):**
- voice-church-api-dev: 1 VM (256MB) = $0
- voice-church-api-prod: 1 VM (256MB) = $0
- **Total: $0/month**

**Upgrade Options:**
- Shared-cpu-1x (512MB): ~$2/month per VM
- Shared-cpu-1x (1GB): ~$5/month per VM
- Dedicated-cpu-1x (2GB): ~$15/month per VM
- Additional regions: ~$2-5/month per region

**Recommended Church Setup:**
- Development: Free tier (256MB) = $0
- Production: 512MB RAM = $2/month
- **Total: $2/month**

---

## Benefits Over Render

| Feature | Fly.io | Render (Free) | Winner |
|---------|--------|---------------|--------|
| IPv6 Support | ✅ Native | ❌ No | Fly.io |
| Cold Starts | ❌ No | ✅ Yes (15min) | Fly.io |
| Always On (Free) | ✅ Yes | ❌ No | Fly.io |
| Global Edge | ✅ Yes | ❌ No | Fly.io |
| SSH Access | ✅ Yes | ❌ No | Fly.io |
| WebSocket Support | ✅ Better | ✅ Limited | Fly.io |
| Auto-scaling | ✅ Yes | ✅ Limited | Fly.io |
| Free SSL | ✅ Yes | ✅ Yes | Tie |
| Deployment Speed | ✅ Faster | ⚠️ Slower | Fly.io |

---

## Next Steps

After backend is deployed:

1. ✅ Test all API endpoints
2. ✅ Update frontend VITE_API_URL
3. ✅ Deploy frontend to Vercel
4. ✅ Test full application flow
5. ✅ Set up monitoring alerts
6. ✅ Configure GitHub Actions CI/CD
7. ✅ Train church staff

---

## Support Resources

- **Fly.io Docs:** https://fly.io/docs
- **Fly.io Community:** https://community.fly.io
- **Supabase Docs:** https://supabase.com/docs
- **Your App Dashboard:** https://fly.io/dashboard

---

## Success Checklist

- [ ] Fly.io CLI installed and authenticated
- [ ] Development app deployed and healthy
- [ ] Production app deployed and healthy
- [ ] Supabase IPv6 connection working
- [ ] Custom domains configured with SSL
- [ ] Environment secrets set correctly
- [ ] Health checks passing
- [ ] Logs show no errors
- [ ] Frontend connected to backend
- [ ] Full application flow tested
- [ ] CI/CD pipeline configured
- [ ] Monitoring alerts set up

**🎉 Congratulations! Your backend is live on Fly.io with Supabase IPv6!**

---

*Last Updated: November 2024*
*Version: 1.0*

