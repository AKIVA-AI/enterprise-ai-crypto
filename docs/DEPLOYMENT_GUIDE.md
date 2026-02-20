# 🚀 Deployment Guide - Production Launch

**Last Updated:** January 3, 2026
**Status:** ✅ Code ready for deployment

---

## 📋 **Pre-Deployment Checklist**

### **✅ Code Quality (COMPLETE)**
- [x] TypeScript strict mode enabled
- [x] 0 lint errors (49 warnings - acceptable)
- [x] Build succeeds
- [x] 87 tests (57 frontend unit + 30 backend)
- [x] E2E tests configured (4 specs)

### **✅ CI/CD Pipeline (COMPLETE)**
- [x] GitHub Actions CI with tests
- [x] E2E workflow (PR/nightly)
- [x] Docker build validation
- [x] Security scanning (Trivy)

### **✅ Deployment Infrastructure (COMPLETE)**
- [x] `docker-compose.yml` - production
- [x] `docker-compose.staging.yml` - staging
- [x] `.env.production.example` template
- [x] `.env.staging.example` template
- [x] `scripts/deploy.sh` - unified deployment
- [x] `scripts/health-check.sh` - health validation
- [x] `/health` and `/ready` endpoints

### **⏳ Production Configuration (USER ACTION REQUIRED)**
- [ ] Set up Supabase production project
- [ ] Configure production environment variables
- [ ] Set up monitoring (Sentry DSN)
- [ ] Choose deployment platform (Northflank/Vercel/VPS)

---

## 🎯 **Deployment Options**

### **Option 1: Northflank (Recommended) ⭐**
**Pros:**
- Hosts BOTH frontend AND backend in one platform
- Docker-native, easy scaling
- Built-in Redis addon
- Excellent for microservices
- Great monitoring and logs

**Cons:** Requires Docker configuration (already done!)

**What Gets Deployed:**
- ✅ Frontend (React/TypeScript) - Port 3000
- ✅ Backend (Python/FastAPI) - Port 8000
- ✅ Redis (Addon) - Port 6379
- ✅ Agent Orchestrator (Background service)

**Steps:**
1. Connect GitHub repository
2. Create 4 services (frontend, backend, agents, redis)
3. Set environment variables
4. Deploy all services

**Cost:** ~$20-50/month (all-in-one)

---

### **Option 2: Vercel (Frontend) + Railway (Backend)**
**Pros:** Easy setup, generous free tier  
**Cons:** Separate deployments

**Steps:**
1. Deploy frontend to Vercel
2. Deploy backend to Railway
3. Configure CORS
4. Set environment variables

**Cost:** Free tier available, ~$10-30/month for production

---

### **Option 3: Self-Hosted (VPS)**
**Pros:** Full control, cost-effective at scale  
**Cons:** More setup, maintenance required

**Steps:**
1. Set up VPS (DigitalOcean, Linode, etc.)
2. Install Docker + Docker Compose
3. Configure nginx reverse proxy
4. Set up SSL certificates
5. Deploy with docker-compose

**Cost:** ~$10-20/month

---

## 🔧 **Deployment Steps (Northflank)**

### **Step 1: Prepare Repository**

```bash
# Ensure everything is committed
git add .
git commit -m "chore: Production readiness - TypeScript strict mode, lint fixes"
git push origin main
```

### **Step 2: Configure Northflank**

1. **Create Project**
   - Go to Northflank dashboard
   - Create new project: "enterprise-crypto"

2. **Add Services**
   - **Frontend Service:**
     - Type: Static Site
     - Build command: `npm run build`
     - Output directory: `dist`
     - Port: 5173

   - **Backend Service:**
     - Type: Docker
     - Dockerfile: `backend/Dockerfile`
     - Port: 8000

3. **Configure Environment Variables**
   - Copy from `.env.production.example`
   - Set all required variables
   - **CRITICAL:** Set `PAPER_TRADING=true`

### **Step 3: Database Setup**

1. **Supabase Production Instance**
   ```bash
   # Create production project at supabase.com
   # Run migrations
   # Configure RLS policies
   # Set up backups
   ```

2. **Environment Variables**
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### **Step 4: Deploy**

```bash
# Northflank will auto-deploy on git push
git push origin main

# Or trigger manual deployment in Northflank dashboard
```

### **Step 5: Verify Deployment**

1. **Check Frontend**
   - Visit deployed URL
   - Verify app loads
   - Check console for errors

2. **Check Backend**
   - Test API endpoints
   - Verify database connection
   - Check logs

3. **Test Critical Flows**
   - Login/authentication
   - Market data loading
   - Kill switch activation
   - Paper trading order submission

---

## 🔒 **Security Configuration**

### **1. Environment Variables**
```bash
# NEVER commit these to git!
JWT_SECRET=<generate-with-openssl-rand-hex-32>
SUPABASE_SERVICE_ROLE_KEY=<from-supabase-dashboard>
COINGECKO_API_KEY=<from-coingecko>
```

### **2. CORS Configuration**
```bash
# backend/app/main.py
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

### **3. Rate Limiting**
```bash
API_RATE_LIMIT=100  # requests per minute
MAX_CONCURRENT_ORDERS=5
```

### **4. SSL/TLS**
- Use HTTPS only
- Configure SSL certificates
- Enable HSTS headers

---

## 📊 **Monitoring Setup**

### **1. Error Tracking (Sentry)**
```bash
# Install Sentry
npm install @sentry/react @sentry/vite-plugin

# Configure in vite.config.ts
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project
```

### **2. Uptime Monitoring**
- Use UptimeRobot or Pingdom
- Monitor frontend + backend
- Set up alerts

### **3. Log Aggregation**
- Use Northflank logs
- Or set up external logging (Papertrail, Logtail)

### **4. Performance Monitoring**
- Use Vercel Analytics
- Or Google Analytics
- Monitor page load times

---

## 🚦 **Staged Rollout Plan**

### **Stage 1: Observer Mode (Week 1)**
**Goal:** Verify system stability

- Deploy to production
- All users in observer mode
- Monitor for errors
- No trading enabled

**Success Criteria:**
- [ ] No critical errors for 7 days
- [ ] All data loading correctly
- [ ] Monitoring working
- [ ] Alerts functioning

---

### **Stage 2: Paper Trading (Week 2-4)**
**Goal:** Test trading logic

- Enable paper trading mode
- Execute simulated trades
- Monitor execution quality
- Verify P&L calculations

**Success Criteria:**
- [ ] 100+ paper trades executed
- [ ] No system errors
- [ ] Position tracking accurate
- [ ] Risk limits respected

---

### **Stage 3: Guarded Live (Week 5+)**
**Goal:** Real trading with minimal risk

- Enable live trading for select users
- Maximum position: $500
- Close monitoring
- Daily reviews

**Success Criteria:**
- [ ] Live trading working
- [ ] No critical errors
- [ ] Risk controls functioning
- [ ] Positive P&L or explainable losses

---

## 🔄 **Rollback Plan**

### **If Deployment Fails:**

1. **Immediate Rollback**
   ```bash
   # Northflank: Rollback to previous deployment
   # Or: git revert and redeploy
   ```

2. **Check Logs**
   ```bash
   # Northflank dashboard > Logs
   # Look for errors
   ```

3. **Fix and Redeploy**
   ```bash
   git commit -m "fix: deployment issue"
   git push origin main
   ```

### **If Production Issues:**

1. **Activate Kill Switch**
   - Stop all trading immediately
   - Investigate issue

2. **Roll Back to Last Known Good**
   - Revert to previous deployment
   - Verify stability

3. **Post-Mortem**
   - Document what went wrong
   - Fix root cause
   - Add tests to prevent recurrence

---

## 📞 **Support & Maintenance**

### **Daily Tasks:**
- Check error logs
- Monitor system health
- Review trading activity
- Check alerts

### **Weekly Tasks:**
- Review P&L
- Update risk limits
- Check for security updates
- Backup database

### **Monthly Tasks:**
- Security audit
- Performance review
- Cost optimization
- Feature planning

---

## ✅ **Deployment Checklist**

- [ ] Code quality verified (TypeScript strict, 0 lint errors)
- [ ] Tests passing (84 tests)
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Monitoring configured
- [ ] Alerts set up
- [ ] SSL certificates configured
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] Backup strategy in place
- [ ] Rollback plan documented
- [ ] Team trained on deployment process

---

## 🎉 **Ready to Deploy!**

Once all checklist items are complete, you're ready for production deployment!

**Next Steps:**
1. Set up production environment
2. Configure monitoring
3. Deploy to staging first
4. Test thoroughly
5. Deploy to production
6. Monitor closely for 7 days

**Good luck!** 🚀

