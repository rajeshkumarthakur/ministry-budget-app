# 🚀 Fly.io + Supabase IPv6 - Quick Start Guide

**Complete in 30 minutes!**

---

## ⚡ Prerequisites

```bash
# 1. Install Fly.io CLI
# Windows PowerShell:
iwr https://fly.io/install.ps1 -useb | iex

# Mac/Linux:
curl -L https://fly.io/install.sh | sh

# 2. Login
fly auth login

# 3. Verify
fly auth whoami
```

---

## 📦 Step 1: Prepare Your Server

**Navigate to server directory:**
```bash
cd server
```

**Create `Dockerfile`:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
CMD ["npm", "start"]
```

**Create `.dockerignore`:**
```
node_modules
npm-debug.log
.env
.env.*
.git
```

**Update `index.js` to listen on 0.0.0.0:**
```javascript
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## 🎯 Step 2: Get Supabase Connection String

1. Go to **Supabase Dashboard** → Your Project
2. **Settings** → **Database**
3. Copy **Connection string** (URI format):

```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Save this!** You'll need it for both dev and prod.

---

## 🚢 Step 3: Deploy Development

```bash
# Initialize Fly.io app
fly launch

# When prompted:
# App name: voice-church-api-dev
# Region: Choose closest to you (e.g., iad for US East)
# PostgreSQL: No (using Supabase)
# Deploy now: No
```

**This creates `fly.toml`. Update it:**

```toml
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
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

  [http_service.checks.health]
    grace_period = "10s"
    interval = "30s"
    method = "GET"
    timeout = "5s"
    path = "/health"

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

**Set secrets:**

```bash
# Database URL
fly secrets set DATABASE_URL="postgresql://postgres:[DEV_PASSWORD]@db.[DEV_PROJECT].supabase.co:5432/postgres"

# JWT Secret (generate random)
fly secrets set JWT_SECRET="$(openssl rand -hex 64)"

# CORS Origin
fly secrets set CORS_ORIGIN="https://dev-thevoicechurch.synapsedigitalai.com,http://localhost:5173"
```

**Deploy:**

```bash
fly deploy

# Wait 2-3 minutes...

# Test
fly status
curl https://voice-church-api-dev.fly.dev/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-11-17T...",
  "environment": "development",
  "database": "connected"
}
```

✅ **Development deployed!**

---

## 🏭 Step 4: Deploy Production

```bash
# Create new app
fly launch --no-deploy

# When prompted:
# App name: voice-church-api-prod
# Same region as dev
# PostgreSQL: No
```

**Create `fly.prod.toml`:**

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

  [http_service.checks.health]
    grace_period = "10s"
    interval = "30s"
    method = "GET"
    timeout = "5s"
    path = "/health"

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 512
```

**Set production secrets:**

```bash
# Use PRODUCTION database and different JWT secret!
fly secrets set DATABASE_URL="postgresql://postgres:[PROD_PASSWORD]@db.[PROD_PROJECT].supabase.co:5432/postgres" -a voice-church-api-prod

fly secrets set JWT_SECRET="$(openssl rand -hex 64)" -a voice-church-api-prod

fly secrets set CORS_ORIGIN="https://thevoicechurch.synapsedigitalai.com" -a voice-church-api-prod
```

**Deploy production:**

```bash
fly deploy -a voice-church-api-prod -c fly.prod.toml

# Test
curl https://voice-church-api-prod.fly.dev/health
```

✅ **Production deployed!**

---

## 🌐 Step 5: Custom Domains (Optional)

**Add domains:**
```bash
fly certs add api-dev.thevoicechurch.synapsedigitalai.com -a voice-church-api-dev
fly certs add api.thevoicechurch.synapsedigitalai.com -a voice-church-api-prod
```

**Configure DNS in Hostinger:**

| Type | Name | Target | TTL |
|------|------|--------|-----|
| CNAME | api-dev.thevoicechurch | voice-church-api-dev.fly.dev | 3600 |
| CNAME | api.thevoicechurch | voice-church-api-prod.fly.dev | 3600 |

**Wait 15-30 minutes for DNS propagation.**

**Verify:**
```bash
fly certs check api-dev.thevoicechurch.synapsedigitalai.com -a voice-church-api-dev
```

---

## 🔄 Step 6: Update Frontend

**In Vercel, update environment variables:**

**Development Project:**
```
VITE_API_URL=https://voice-church-api-dev.fly.dev
# Or if using custom domain:
VITE_API_URL=https://api-dev.thevoicechurch.synapsedigitalai.com
```

**Production Project:**
```
VITE_API_URL=https://voice-church-api-prod.fly.dev
# Or if using custom domain:
VITE_API_URL=https://api.thevoicechurch.synapsedigitalai.com
```

**Redeploy frontend in Vercel.**

---

## 🤖 Step 7: GitHub Actions CI/CD

**Create `.github/workflows/deploy-flyio.yml`:**

```yaml
name: Deploy to Fly.io

on:
  push:
    branches: [main, develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: superfly/flyctl-actions/setup-flyctl@master
      
      - name: Deploy Dev
        if: github.ref == 'refs/heads/develop'
        run: |
          cd server
          flyctl deploy --remote-only -a voice-church-api-dev
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
      
      - name: Deploy Prod
        if: github.ref == 'refs/heads/main'
        run: |
          cd server
          flyctl deploy --remote-only -a voice-church-api-prod -c fly.prod.toml
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

**Get Fly.io token:**
```bash
fly auth token
```

**Add to GitHub:**
- Repository → Settings → Secrets → Actions
- New secret: `FLY_API_TOKEN`
- Paste token

✅ **CI/CD configured!**

---

## 📊 Useful Commands

```bash
# View logs
fly logs -a voice-church-api-dev
fly logs -a voice-church-api-dev -f  # Live tail

# Check status
fly status -a voice-church-api-dev

# SSH into VM
fly ssh console -a voice-church-api-dev

# Restart app
fly apps restart -a voice-church-api-dev

# List apps
fly apps list

# View secrets (values hidden)
fly secrets list -a voice-church-api-dev

# Update secret
fly secrets set KEY=value -a voice-church-api-dev

# Scale up memory (if needed)
fly scale vm shared-cpu-1x --memory 512 -a voice-church-api-prod

# Open dashboard
fly dashboard -a voice-church-api-dev
```

---

## 🧪 Test Your Deployment

**1. Health Check:**
```bash
curl https://voice-church-api-dev.fly.dev/health
```

**2. Login API:**
```bash
curl -X POST https://voice-church-api-dev.fly.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@thevoicechurch.org","pin":"1234"}'
```

**3. Check Logs:**
```bash
fly logs -a voice-church-api-dev
```

**4. Frontend Connection:**
- Open your frontend app
- Try logging in
- Check browser console for errors

---

## 🔧 Troubleshooting

### App won't start
```bash
# Check logs
fly logs -a voice-church-api-dev

# Verify secrets
fly secrets list -a voice-church-api-dev

# Restart
fly apps restart -a voice-church-api-dev
```

### Database connection fails
```bash
# SSH into VM and test
fly ssh console -a voice-church-api-dev

# Inside VM:
node -e "const pg=require('pg');const p=new pg.Pool({connectionString:process.env.DATABASE_URL});p.query('SELECT NOW()',(e,r)=>{console.log(e||r.rows[0]);p.end()});"
```

### CORS errors
```bash
# Update CORS origin
fly secrets set CORS_ORIGIN="https://your-frontend.com" -a voice-church-api-dev

# Restart
fly apps restart -a voice-church-api-dev
```

---

## ✅ Completion Checklist

- [ ] Fly.io CLI installed
- [ ] Development app deployed
- [ ] Production app deployed
- [ ] Health checks passing
- [ ] Supabase connected (IPv6)
- [ ] Frontend updated with API URLs
- [ ] Custom domains configured (optional)
- [ ] SSL certificates active
- [ ] CI/CD pipeline working
- [ ] Full app tested end-to-end

---

## 💰 Cost

**Your Setup:**
- Dev: Free (256MB VM)
- Prod: Free or $2/month (512MB VM)

**Total: $0-2/month** 🎉

---

## 📱 URLs Summary

Save these for your records:

```
Development Backend:
https://voice-church-api-dev.fly.dev

Production Backend:
https://voice-church-api-prod.fly.dev

Fly.io Dashboard:
https://fly.io/dashboard

Supabase Dashboard:
https://app.supabase.com
```

---

## 🎉 Success!

Your backend is now running on Fly.io with:
- ✅ Supabase IPv6 connection (faster!)
- ✅ No cold starts
- ✅ Global edge deployment
- ✅ Free SSL certificates
- ✅ Automatic health checks
- ✅ SSH access for debugging

**Next:** Deploy your frontend to Vercel and connect everything!

---

*Last Updated: November 2024*

