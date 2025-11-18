# 🚀 Voice Church Deployment Guide - Development Only

**Complete deployment with CI/CD and frontend hosting**

---

## ✅ What's Already Done

- ✅ Backend deployed on Fly.io: `https://voice-church-api-dev.fly.dev`
- ✅ Supabase database connected with IPv6
- ✅ Environment secrets set

---

## 🤖 Step 1: GitHub Actions CI/CD (Auto-Deploy Backend)

### Create Workflow File

**Create `.github/workflows/deploy.yml`:**

```yaml
name: Deploy Backend to Fly.io

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: superfly/flyctl-actions/setup-flyctl@master
      
      - name: Deploy to Fly.io
        run: |
          cd server
          flyctl deploy --remote-only -a voice-church-api-dev
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

### Get Fly.io API Token

```bash
fly auth token
```

Copy the token.

### Add to GitHub Secrets

1. Go to: `https://github.com/rajeshkumarthakur/ministry-budget-app/settings/secrets/actions`
2. Click **New repository secret**
3. Name: `FLY_API_TOKEN`
4. Value: [Paste the token]
5. Click **Add secret**

✅ **Now every push to `main` auto-deploys your backend!**

---

## 🎨 Step 2: Deploy Frontend to Vercel

### Why Vercel?
- ✅ Free forever for personal projects
- ✅ Automatic deployments from GitHub
- ✅ Built-in CDN and SSL
- ✅ Perfect for React/Vite apps
- ✅ Zero configuration needed

### 2.1: Sign Up & Connect

1. **Go to:** https://vercel.com
2. **Sign up** with GitHub (easiest)
3. Click **Add New** → **Project**
4. **Import** `ministry-budget-app` repository

### 2.2: Configure Project

**Framework Preset:** Vite

**Root Directory:** `client`

**Build Command:** `npm run build`

**Output Directory:** `dist`

**Install Command:** `npm install`

### 2.3: Environment Variables

Click **Environment Variables** and add:

```
VITE_API_URL=https://voice-church-api-dev.fly.dev
```

### 2.4: Deploy

Click **Deploy**

Wait 2-3 minutes...

✅ **You'll get a URL like:** `https://ministry-budget-app.vercel.app`

---

## 🌐 Step 3: Configure Custom Domain (Optional)

### If You Want: `thevoicechurch.synapsedigitalai.com`

#### In Vercel:

1. **Project Settings** → **Domains**
2. **Add:** `thevoicechurch.synapsedigitalai.com`
3. Vercel will show DNS records

#### In Hostinger:

1. **Domains** → `synapsedigitalai.com` → **DNS Zone**
2. Add CNAME:
   - **Type:** CNAME
   - **Name:** `thevoicechurch`
   - **Target:** `cname.vercel-dns.com`
   - **TTL:** 3600

**Wait 15-30 minutes for DNS propagation**

✅ **Your app will be at:** `https://thevoicechurch.synapsedigitalai.com`

---

## 🔄 Step 4: Update Backend CORS

Since frontend URL changed, update CORS:

```bash
fly secrets set CORS_ORIGIN="https://ministry-budget-app.vercel.app,http://localhost:5173" -a voice-church-api-dev
```

Or if using custom domain:

```bash
fly secrets set CORS_ORIGIN="https://thevoicechurch.synapsedigitalai.com,http://localhost:5173" -a voice-church-api-dev
```

---

## 🔄 Step 5: Enable Auto-Deploy for Frontend

Vercel automatically deploys on every push to `main`.

**To customize:**

1. **Project Settings** → **Git**
2. **Production Branch:** `main`
3. **Auto-Deploy:** ON ✅

Now:
- Push to GitHub → Backend auto-deploys (GitHub Actions)
- Push to GitHub → Frontend auto-deploys (Vercel)

---

## 🧪 Step 6: Test Everything

### Test Backend

```bash
curl https://voice-church-api-dev.fly.dev/health
```

**Expected:**
```json
{
  "status": "healthy",
  "database": "connected",
  "environment": "development"
}
```

### Test Frontend

1. Open: `https://ministry-budget-app.vercel.app` (or your custom domain)
2. Try logging in with test credentials
3. Check if forms load
4. Test creating/submitting a form

### Test Full Flow

1. **Login** on frontend
2. **Create** a ministry form
3. **Submit** for approval
4. Check **database** in Supabase
5. Test **PDF export**

---

## 📊 Useful Commands

### Backend (Fly.io)

```bash
# View logs
fly logs -a voice-church-api-dev -f

# Check status
fly status -a voice-church-api-dev

# Restart app
fly apps restart -a voice-church-api-dev

# Update secrets
fly secrets set KEY=value -a voice-church-api-dev

# SSH into server
fly ssh console -a voice-church-api-dev

# Open dashboard
fly dashboard -a voice-church-api-dev
```

### Frontend (Vercel)

```bash
# Install Vercel CLI (optional)
npm i -g vercel

# View logs
vercel logs

# Redeploy
vercel --prod
```

### Check CI/CD

- Backend deploys: `https://github.com/rajeshkumarthakur/ministry-budget-app/actions`
- Frontend deploys: Vercel Dashboard → Deployments

---

## 🔧 Troubleshooting

### Backend Issues

**Health check fails:**
```bash
fly logs -a voice-church-api-dev
fly secrets list -a voice-church-api-dev
fly apps restart -a voice-church-api-dev
```

**Database connection error:**
```bash
# Verify DATABASE_URL is set correctly
fly secrets list -a voice-church-api-dev

# Test inside VM
fly ssh console -a voice-church-api-dev
node -e "console.log(process.env.DATABASE_URL)"
```

### Frontend Issues

**Can't connect to backend:**
1. Check VITE_API_URL in Vercel environment variables
2. Check CORS_ORIGIN in Fly.io secrets
3. Verify backend is running: `fly status -a voice-church-api-dev`

**CORS errors:**
```bash
# Update backend CORS to include frontend URL
fly secrets set CORS_ORIGIN="https://your-vercel-app.vercel.app,http://localhost:5173" -a voice-church-api-dev
```

**Build fails in Vercel:**
1. Check build logs in Vercel dashboard
2. Verify `client/package.json` has correct scripts
3. Make sure all dependencies are in `package.json`

### CI/CD Issues

**GitHub Actions fails:**
1. Check Actions tab: `https://github.com/rajeshkumarthakur/ministry-budget-app/actions`
2. Verify `FLY_API_TOKEN` secret is set
3. Check workflow file syntax

**Vercel not deploying:**
1. Check Vercel dashboard → Deployments
2. Verify GitHub integration is connected
3. Check build logs for errors

---

## 📱 Your URLs

Save these:

```
Backend API:
https://voice-church-api-dev.fly.dev

Frontend App:
https://ministry-budget-app.vercel.app
(or https://thevoicechurch.synapsedigitalai.com if custom domain)

Dashboards:
- Fly.io: https://fly.io/dashboard
- Vercel: https://vercel.com/dashboard
- Supabase: https://app.supabase.com
- GitHub: https://github.com/rajeshkumarthakur/ministry-budget-app
```

---

## 💰 Monthly Cost

```
Backend (Fly.io):      $0 (256MB free tier)
Frontend (Vercel):     $0 (free forever)
Database (Supabase):   $0 (free tier)
Domain (Hostinger):    $0 (already owned)
GitHub Actions:        $0 (free for public repos)
───────────────────────────
TOTAL:                 $0/month 🎉
```

---

## 🎯 Deployment Checklist

### Backend
- [x] Fly.io app created: `voice-church-api-dev`
- [x] Docker configured
- [x] Secrets set (DATABASE_URL, JWT_SECRET, CORS_ORIGIN)
- [x] Health check passing
- [x] Supabase connected via IPv6

### Frontend
- [ ] Vercel project created
- [ ] Connected to GitHub repo
- [ ] Environment variable set (VITE_API_URL)
- [ ] Deployed successfully
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active

### CI/CD
- [ ] GitHub workflow file created (`.github/workflows/deploy.yml`)
- [ ] Fly.io API token added to GitHub secrets
- [ ] Test push triggers auto-deploy
- [ ] Vercel auto-deploy enabled

### Testing
- [ ] Backend health check works
- [ ] Frontend loads
- [ ] Login works
- [ ] Forms can be created
- [ ] Forms can be submitted
- [ ] PDF export works
- [ ] No CORS errors

---

## 🚀 Next Steps After Deployment

### 1. Train Church Staff
- Walk through the app
- Show how to create forms
- Explain approval workflow
- Demo PDF export

### 2. Create User Accounts
```bash
# Add users through admin panel or directly in Supabase
```

### 3. Monitor for First Week
- Check Fly.io logs daily
- Monitor Vercel deployment success
- Watch for errors in Supabase

### 4. Set Up Backups
- Supabase: Automatic daily backups (free tier: 7 days)
- Code: Already backed up on GitHub

### 5. Future Enhancements
- Add email notifications
- Implement budget analytics
- Create mobile-responsive improvements
- Add export to Excel

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ Backend health check returns "healthy"  
✅ Frontend loads without errors  
✅ Users can login  
✅ Forms can be created and submitted  
✅ Approvals work  
✅ PDF export functions  
✅ Push to GitHub auto-deploys both frontend and backend  
✅ No CORS errors  
✅ SSL certificates active on both  
✅ Church staff can use the system  

---

## 📞 Support Resources

**Platform Documentation:**
- Fly.io: https://fly.io/docs
- Vercel: https://vercel.com/docs
- Supabase: https://supabase.com/docs
- Vite: https://vitejs.dev/guide

**Community:**
- Fly.io Community: https://community.fly.io
- Vercel Discord: https://vercel.com/discord

**Your Repository:**
https://github.com/rajeshkumarthakur/ministry-budget-app

---

## 🎊 Congratulations!

You now have a fully deployed, auto-scaling, production-ready church ministry management system with:

- 🚀 Fast backend with IPv6 Supabase connection
- 🌐 Lightning-fast frontend on global CDN
- 🤖 Automated CI/CD pipeline
- 🔒 SSL security everywhere
- 💰 $0/month cost
- 📈 Room to scale as church grows

**Your church is modern! 🙏**

---

*Last Updated: November 2024*
*Deployment Type: Development Environment*
*Stack: Fly.io + Vercel + Supabase*

