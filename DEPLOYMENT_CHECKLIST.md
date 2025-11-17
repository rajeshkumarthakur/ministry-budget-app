# 🚀 Voice Church Deployment - Quick Reference Checklist

Print this page and check off items as you complete them!

---

## PHASE 1: GITHUB SETUP (30 min)

**Repository Creation:**
- [ ] Created GitHub repository: `voice-church-ministry-planning`
- [ ] Set to Private
- [ ] Added .gitignore file

**Local Setup:**
- [ ] Initialized git: `git init`
- [ ] Added remote: `git remote add origin [URL]`
- [ ] Pushed main branch: `git push -u origin main`
- [ ] Created develop branch: `git checkout -b develop`
- [ ] Pushed develop branch: `git push -u origin develop`

**Configuration:**
- [ ] Created `.github/workflows/deploy.yml`
- [ ] Branch protection on main (optional)

---

## PHASE 2: DATABASE (SUPABASE) (45 min)

**Development Database:**
- [ ] Created Supabase account
- [ ] Created project: `voice-church-dev`
- [ ] Saved password: ___________________
- [ ] Copied connection string
- [ ] Ran schema.sql in SQL Editor
- [ ] Verified tables created
- [ ] Created admin user

**Production Database:**
- [ ] Created project: `voice-church-prod`
- [ ] Saved password: ___________________
- [ ] Copied connection string
- [ ] Ran schema.sql in SQL Editor
- [ ] Verified tables created
- [ ] Created admin user

**Configuration:**
- [ ] Enabled SSL enforcement
- [ ] Verified backup schedule

**Connection Strings:**
```
Dev:  _________________________________
Prod: _________________________________
```

---

## PHASE 3: BACKEND (RENDER) (45 min)

**Development Service:**
- [ ] Created Render account
- [ ] Connected GitHub
- [ ] Created service: `voice-church-api-dev`
- [ ] Branch: `develop`
- [ ] Root directory: `server`
- [ ] Build: `npm install`
- [ ] Start: `npm start`

**Environment Variables (Dev):**
- [ ] DATABASE_URL: [Supabase dev string]
- [ ] JWT_SECRET: [Generated random string]
- [ ] CORS_ORIGIN: https://dev-thevoicechurch.synapsedigitalai.com
- [ ] NODE_ENV: development
- [ ] PORT: 3001

- [ ] Service deployed successfully
- [ ] Health check works: /health endpoint

**Production Service:**
- [ ] Created service: `voice-church-api-prod`
- [ ] Branch: `main`
- [ ] Same config as dev

**Environment Variables (Prod):**
- [ ] DATABASE_URL: [Supabase prod string]
- [ ] JWT_SECRET: [Different random string]
- [ ] CORS_ORIGIN: https://thevoicechurch.synapsedigitalai.com
- [ ] NODE_ENV: production
- [ ] PORT: 3001

- [ ] Service deployed successfully
- [ ] Health check works: /health endpoint

**Service URLs:**
```
Dev:  _________________________________
Prod: _________________________________
```

---

## PHASE 4: FRONTEND (VERCEL) (30 min)

**Development Project:**
- [ ] Created Vercel account
- [ ] Imported GitHub repository
- [ ] Project name: `voice-church-dev`
- [ ] Framework: Vite
- [ ] Root directory: `client`
- [ ] Build: `npm run build`
- [ ] Output: `dist`

**Environment Variables (Dev):**
- [ ] VITE_API_URL: [Render dev URL]

- [ ] Project deployed successfully
- [ ] Site loads correctly

**Production Project:**
- [ ] Project name: `voice-church-prod`
- [ ] Same config as dev

**Environment Variables (Prod):**
- [ ] VITE_API_URL: [Render prod URL]

- [ ] Project deployed successfully
- [ ] Site loads correctly

**Git Configuration:**
- [ ] Dev project → branch: `develop`
- [ ] Prod project → branch: `main`

**Vercel URLs:**
```
Dev:  _________________________________
Prod: _________________________________
```

---

## PHASE 5: CUSTOM DOMAINS (30 min)

**Vercel Domain Configuration:**
- [ ] Dev project → Add domain: dev-thevoicechurch.synapsedigitalai.com
- [ ] Prod project → Add domain: thevoicechurch.synapsedigitalai.com
- [ ] Noted DNS records needed

**Hostinger DNS Configuration:**
- [ ] Logged into Hostinger
- [ ] Navigated to: Domains → synapsedigitalai.com → DNS Zone

**Development CNAME:**
- [ ] Type: CNAME
- [ ] Name: dev-thevoicechurch
- [ ] Target: cname.vercel-dns.com
- [ ] TTL: 3600

**Production CNAME:**
- [ ] Type: CNAME
- [ ] Name: thevoicechurch
- [ ] Target: cname.vercel-dns.com
- [ ] TTL: 3600

**Verification:**
- [ ] Waited 15-30 minutes
- [ ] Checked dnschecker.org
- [ ] Dev domain shows "Valid Configuration" in Vercel
- [ ] Prod domain shows "Valid Configuration" in Vercel
- [ ] SSL active (padlock icon) on both

**Update Backend CORS:**
- [ ] Updated CORS_ORIGIN in Render (dev)
- [ ] Updated CORS_ORIGIN in Render (prod)
- [ ] Redeployed both services

---

## PHASE 6: CI/CD PIPELINE (30 min)

**GitHub Actions:**
- [ ] Created `.github/workflows/deploy.yml`
- [ ] Committed and pushed to repository
- [ ] Verified workflow appears in Actions tab

**Auto-Deploy Configuration:**
- [ ] Render auto-deploy enabled
- [ ] Vercel auto-deploy enabled

**Testing:**
- [ ] Made test commit to develop
- [ ] GitHub Actions ran successfully
- [ ] Render dev service auto-deployed
- [ ] Vercel dev project auto-deployed
- [ ] Verified changes on dev site

- [ ] Made test commit to main
- [ ] GitHub Actions ran successfully
- [ ] Render prod service auto-deployed
- [ ] Vercel prod project auto-deployed
- [ ] Verified changes on prod site

---

## PHASE 7: MONITORING & BACKUPS (30 min)

**Monitoring Setup:**
- [ ] Bookmarked Render dashboard
- [ ] Bookmarked Vercel dashboard
- [ ] Bookmarked Supabase dashboard
- [ ] Configured email alerts (Render)
- [ ] Enabled Web Analytics (Vercel)

**Backup Verification:**
- [ ] Verified Supabase auto-backups (dev)
- [ ] Verified Supabase auto-backups (prod)
- [ ] Documented backup schedule
- [ ] Created manual backup script (optional)

**Health Checks:**
- [ ] Dev backend health: ✓
- [ ] Prod backend health: ✓
- [ ] Dev frontend loads: ✓
- [ ] Prod frontend loads: ✓

---

## FINAL TESTING CHECKLIST

**Development Environment:**
- [ ] Site loads: https://dev-thevoicechurch.synapsedigitalai.com
- [ ] SSL active (padlock icon)
- [ ] Can login with admin credentials
- [ ] Can create new form
- [ ] Can submit form
- [ ] Can approve form
- [ ] Can reject form
- [ ] Can export PDF
- [ ] Running totals calculate correctly
- [ ] All navigation works

**Production Environment:**
- [ ] Site loads: https://thevoicechurch.synapsedigitalai.com
- [ ] SSL active (padlock icon)
- [ ] Can login with admin credentials
- [ ] Can create new form
- [ ] Can submit form
- [ ] Can approve form
- [ ] Can reject form
- [ ] Can export PDF
- [ ] Running totals calculate correctly
- [ ] All navigation works

---

## POST-DEPLOYMENT

**Documentation:**
- [ ] Saved all credentials securely
- [ ] Documented service URLs
- [ ] Shared access with team
- [ ] Updated deployment docs

**Team Setup:**
- [ ] Added team members to GitHub
- [ ] Added team members to services (if needed)
- [ ] Created user accounts in system
- [ ] Trained church staff on system

**Ongoing Maintenance:**
- [ ] Set calendar reminder: Weekly log checks
- [ ] Set calendar reminder: Monthly backup verification
- [ ] Set calendar reminder: Quarterly dependency updates
- [ ] Documented rollback procedure

---

## IMPORTANT INFORMATION

**Admin Credentials:**
```
Email: ___________________________________
Password: _________________________________
```

**Service Dashboards:**
```
GitHub: https://github.com/[USERNAME]/voice-church-ministry-planning
Supabase Dev: https://app.supabase.com/project/[DEV-ID]
Supabase Prod: https://app.supabase.com/project/[PROD-ID]
Render Dev: https://dashboard.render.com/web/[DEV-SERVICE]
Render Prod: https://dashboard.render.com/web/[PROD-SERVICE]
Vercel Dev: https://vercel.com/[USERNAME]/voice-church-dev
Vercel Prod: https://vercel.com/[USERNAME]/voice-church-prod
```

**Live URLs:**
```
Development: https://dev-thevoicechurch.synapsedigitalai.com
Production: https://thevoicechurch.synapsedigitalai.com
```

---

## MONTHLY COST TRACKER

```
GitHub:      $____  (usually $0)
Supabase:    $____  (usually $0)
Render:      $____  ($0 or $14 for 2 services)
Vercel:      $____  (usually $0)
Other:       $____

TOTAL:       $____  /month
```

---

## COMPLETION

**Deployment Completed:** ___ / ___ / _____

**Deployed By:** _______________________

**Time Taken:** _______ hours

**Issues Encountered:** 
```
_____________________________________________
_____________________________________________
_____________________________________________
```

**Notes:**
```
_____________________________________________
_____________________________________________
_____________________________________________
```

---

## 🎉 CONGRATULATIONS!

Your Voice Church Ministry Planning System is now live!

✅ Development environment ready for testing  
✅ Production environment ready for church use  
✅ CI/CD pipeline automating deployments  
✅ Monitoring and backups in place  
✅ Team has access  

**Next Steps:**
1. Train church staff
2. Create user accounts
3. Monitor for first week
4. Gather feedback
5. Plan enhancements

---

*Print Date: ___ / ___ / _____*
*Version: 1.0*
