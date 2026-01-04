# Critical Files Protection Guide

**Purpose:** Identify and protect files that contain critical application logic

**Rule:** 🚨 **NEVER modify these files without explicit user approval** 🚨

---

## 🔴 CRITICAL - Trading & Execution Logic

### 1. OMS Execution Service
**File:** `backend/app/services/oms_execution.py`

**Why Critical:**
- Handles real order execution
- Routes orders to exchanges
- Manages order lifecycle
- Processes fills and partial fills
- **Bugs can cause financial loss**

**Protection Level:** 🔴 HIGHEST - Requires user approval + testing + staging verification

**Modification Protocol:**
1. ✅ Get explicit user approval
2. ✅ Create timestamped backup
3. ✅ Write tests for changes
4. ✅ Test in staging with paper trading
5. ✅ Monitor closely after deployment
6. ✅ Have rollback plan ready

**Backup Command:**
```bash
cp backend/app/services/oms_execution.py \
   backend/app/services/oms_execution.backup.$(date +%Y%m%d_%H%M%S).py
```

---

### 2. Risk Engine
**File:** `backend/app/services/risk_engine.py`

**Why Critical:**
- Evaluates trade intents against risk rules
- Enforces position limits
- Checks kill switch
- Prevents excessive risk
- **Bugs can allow dangerous trades**

**Protection Level:** 🔴 HIGHEST - Requires user approval + testing + staging verification

**Key Functions to Protect:**
- `check_intent()` - Main risk check
- `_check_global_kill_switch()` - Kill switch logic
- `_check_position_limits()` - Position limit enforcement
- `_check_concentration()` - Concentration risk

**Modification Protocol:**
Same as OMS Execution Service

---

### 3. Portfolio Engine
**File:** `backend/app/services/portfolio_engine.py`

**Why Critical:**
- Calculates position sizes
- Manages capital allocation
- Tracks book exposure
- Enforces tier limits
- **Bugs can cause over-leverage**

**Protection Level:** 🔴 HIGHEST - Requires user approval + testing + staging verification

**Key Functions to Protect:**
- `calculate_position_size()` - Position sizing logic
- `update_book_exposure()` - Exposure tracking
- `_get_tier_exposure()` - Tier allocation

---

### 4. Engine Runner
**File:** `backend/app/services/engine_runner.py`

**Why Critical:**
- Orchestrates all trading engines
- Coordinates strategy → risk → OMS flow
- Handles intent lifecycle
- **Bugs can break entire trading system**

**Protection Level:** 🔴 HIGHEST - Requires user approval + testing + staging verification

---

## 🟠 HIGH RISK - Database & Schema

### 5. Database Migrations
**Files:** `supabase/migrations/*.sql`

**Why Critical:**
- Changes database schema
- Affects all services
- Difficult to rollback
- **Bugs can corrupt data**

**Protection Level:** 🟠 HIGH - Requires user approval + local testing + rollback plan

**Modification Protocol:**
1. ✅ Get explicit user approval
2. ✅ Test migration locally first
3. ✅ Create rollback migration
4. ✅ Backup database before applying
5. ✅ Document in migration notes
6. ✅ Coordinate with all agents

**Testing Commands:**
```bash
# Test migration locally
supabase db reset
supabase migration up

# Create rollback migration
supabase migration new rollback_YYYYMMDD_description
```

---

### 6. Database Utilities
**File:** `backend/app/database.py`

**Why Critical:**
- Database connection management
- Audit logging
- Alert creation
- Kill switch checks
- **Bugs can break all database access**

**Protection Level:** 🟠 HIGH - Requires user approval + testing

**Key Functions to Protect:**
- `get_supabase()` - Database connection
- `audit_log()` - Audit logging
- `check_kill_switch_for_trading()` - Kill switch
- `create_alert()` - Alert creation

---

## 🟡 MEDIUM RISK - Edge Functions & API

### 7. Edge Functions
**Files:** `supabase/functions/*/index.ts`

**Why Critical:**
- Handle user requests
- Create trading intents
- Enforce tenant isolation
- **Bugs can allow unauthorized access**

**Protection Level:** 🟡 MEDIUM - Requires user approval for logic changes

**Modification Protocol:**
1. ✅ Get user approval for logic changes
2. ✅ Test locally before deploying
3. ✅ Document API changes
4. ✅ Update frontend if API changes
5. ✅ Monitor logs after deployment

---

### 8. Shared Edge Function Utilities
**Files:** 
- `supabase/functions/_shared/oms-client.ts`
- `supabase/functions/_shared/tenant-guard.ts`

**Why Critical:**
- Used by all edge functions
- Enforce tenant isolation
- Create intents with idempotency
- **Bugs affect all edge functions**

**Protection Level:** 🟡 MEDIUM - Requires user approval + testing

---

### 9. API Routes
**Files:** `backend/app/api/routes/*.py`

**Why Critical:**
- Expose backend functionality
- Handle authentication
- Validate requests
- **Bugs can expose sensitive data**

**Protection Level:** 🟡 MEDIUM - Requires user approval for auth/validation changes

---

## 🟢 LOW RISK - Configuration & Docs

### 10. Configuration Files
**Files:**
- `backend/app/config.py`
- `backend/app/core/config.py`
- `.env` files

**Why Critical:**
- Control system behavior
- Store sensitive settings
- **Wrong config can break production**

**Protection Level:** 🟢 LOW - Document changes, verify in staging

**Rules:**
- ❌ NEVER commit secrets
- ✅ Document all config changes
- ✅ Verify in staging first
- ✅ Use environment variables for secrets

---

### 11. Documentation
**Files:** `docs/*.md`

**Why Critical:**
- Guide developers
- Document architecture
- **Outdated docs can mislead**

**Protection Level:** 🟢 LOW - Can modify freely, but keep accurate

**Rules:**
- ✅ Keep docs up to date
- ✅ Document breaking changes
- ✅ Include code examples
- ✅ Review for accuracy

---

## 🔒 Protection Mechanisms

### 1. Backup Before Modify
```bash
# Create timestamped backup
cp <file> <file>.backup.$(date +%Y%m%d_%H%M%S)

# Example
cp backend/app/services/oms_execution.py \
   backend/app/services/oms_execution.backup.20260108_153000.py
```

### 2. Test Before Commit
```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend tests
npm run test
npm run type-check

# Edge function tests
supabase functions serve <function-name>
```

### 3. Staging Verification
```bash
# Deploy to staging
./deploy.sh staging

# Run smoke tests
./scripts/smoke-tests.sh staging

# Monitor logs
supabase functions logs <function-name> --tail
```

### 4. Rollback Plan
```bash
# Git rollback
git revert HEAD

# File rollback
cp <file>.backup.TIMESTAMP <file>

# Database rollback
supabase migration down
```

---

## 🚨 Emergency Procedures

### If You Accidentally Modify a Critical File:

1. **STOP** - Don't commit or deploy
2. **ALERT** - Notify user immediately
3. **REVERT** - Restore from backup
4. **DOCUMENT** - Log what happened
5. **LEARN** - Update protection mechanisms

### If Critical File is Broken in Production:

1. **ALERT** - Notify user immediately
2. **ROLLBACK** - Revert to last known good version
3. **VERIFY** - Test rollback worked
4. **MONITOR** - Watch for issues
5. **POST-MORTEM** - Document incident

---

## 📋 Pre-Modification Checklist

Before modifying any critical file:

- [ ] Is this file on the critical list?
- [ ] Do I have explicit user approval?
- [ ] Have I created a timestamped backup?
- [ ] Have I read the modification protocol?
- [ ] Do I have tests for my changes?
- [ ] Have I tested locally?
- [ ] Do I have a rollback plan?
- [ ] Have I documented the changes?
- [ ] Have I updated the activity log?
- [ ] Have I coordinated with other agents?

**If you answered NO to any of these, STOP and address it first.**

---

## 🎯 Safe Zones by Agent

### CLINE (Frontend)
**Safe to Modify:**
- `src/` (React components, pages, hooks)
- `public/` (Static assets)
- Frontend tests

**Requires Approval:**
- API integration code
- State management
- Authentication logic

**Never Touch:**
- Backend services
- Database migrations
- OMS logic

### Augment Code (Architecture)
**Safe to Modify:**
- `docs/` (Documentation)
- Code analysis
- Architectural planning

**Requires Approval:**
- Backend services
- Edge functions
- Database schema

**Never Touch:**
- Active trading logic without approval
- Risk management without approval
- Production deployments without approval

### Open Hands (Backend)
**Safe to Modify:**
- `backend/app/api/` (API routes)
- Service layer (non-critical)
- Tests

**Requires Approval:**
- OMS execution logic
- Risk engine
- Portfolio engine
- Database migrations

**Never Touch:**
- Frontend code
- Active trading strategies without approval

---

**Remember: When in doubt, ask the user. It's better to ask than to break production!**

