# Multi-Agent Coordination Guide

**Date:** 2026-01-08  
**Purpose:** Ensure safe collaboration between CLINE, Augment Code, and Open Hands

## 🚨 Critical Principle

**NEVER modify application logic without explicit user approval and coordination with other agents.**

## Agent Roles & Responsibilities

### CLINE
- **Primary Focus:** Frontend development, UI/UX, React components
- **Safe Zone:** `src/`, `public/`, frontend tests
- **Caution Zone:** API integration code, state management
- **No-Touch Zone:** Backend services, database migrations, OMS logic

### Augment Code (AC)
- **Primary Focus:** Architecture, documentation, code review, refactoring
- **Safe Zone:** `docs/`, code analysis, architectural planning
- **Caution Zone:** Backend services, edge functions
- **No-Touch Zone:** Active trading logic, risk management without approval

### Open Hands
- **Primary Focus:** Backend services, API development, infrastructure
- **Safe Zone:** `backend/`, API routes, service layer
- **Caution Zone:** Database migrations, OMS execution logic
- **No-Touch Zone:** Frontend code, active trading strategies

## 🔒 Critical Files - REQUIRE APPROVAL

These files contain **critical application logic** and require explicit user approval before modification:

### OMS & Execution (HIGHEST RISK)
```
backend/app/services/oms_execution.py          ← Order execution logic
backend/app/services/risk_engine.py            ← Risk checks and limits
backend/app/services/portfolio_engine.py       ← Position sizing and capital allocation
backend/app/services/engine_runner.py          ← Main trading engine orchestrator
```

**Why Critical:** These files handle real money and trading decisions. Bugs can cause financial loss.

**Modification Protocol:**
1. ✅ Get explicit user approval
2. ✅ Create backup: `cp file.py file.backup.$(date +%Y%m%d_%H%M%S).py`
3. ✅ Document changes in CHANGE_LOG.md
4. ✅ Run tests before committing
5. ✅ Notify other agents in coordination log

### Database & Migrations (HIGH RISK)
```
supabase/migrations/*.sql                      ← Database schema changes
backend/app/database.py                        ← Database connection and utilities
```

**Why Critical:** Schema changes affect all services. Rollback is complex.

**Modification Protocol:**
1. ✅ Get explicit user approval
2. ✅ Test migration in local environment first
3. ✅ Create rollback migration
4. ✅ Document in migration notes
5. ✅ Coordinate with all agents

### Edge Functions (MEDIUM-HIGH RISK)
```
supabase/functions/*/index.ts                  ← Edge function logic
supabase/functions/_shared/*.ts                ← Shared utilities
```

**Why Critical:** These handle user requests and create trading intents.

**Modification Protocol:**
1. ✅ Get user approval for logic changes
2. ✅ Test locally before deploying
3. ✅ Document API changes
4. ✅ Update frontend if API changes

### Configuration (MEDIUM RISK)
```
backend/app/config.py                          ← Backend configuration
backend/app/core/config.py                     ← Core settings
.env files                                     ← Environment variables
```

**Why Critical:** Wrong config can break production or expose secrets.

**Modification Protocol:**
1. ✅ Never commit secrets
2. ✅ Document config changes
3. ✅ Verify in staging first

## 📋 Coordination Protocols

### Protocol 1: Before Starting Work

**Every agent must:**
1. Check `docs/AGENT_ACTIVITY_LOG.md` for recent changes
2. Announce intention in activity log
3. Check for conflicts with other agents' work
4. Get user approval for critical file changes

**Example Entry:**
```markdown
## 2026-01-08 14:30 - Augment Code
**Task:** Update cross-exchange-arbitrage edge function
**Files:** supabase/functions/cross-exchange-arbitrage/index.v2.ts
**Status:** IN PROGRESS
**ETA:** 30 minutes
**Conflicts:** None detected
```

### Protocol 2: During Work

**Every agent must:**
1. Update activity log every 30 minutes
2. Document all file modifications
3. Run tests before committing
4. Alert user of any unexpected issues

### Protocol 3: After Completing Work

**Every agent must:**
1. Update activity log with COMPLETE status
2. Document changes in CHANGE_LOG.md
3. List all modified files
4. Note any breaking changes
5. Suggest next steps

### Protocol 4: Handoff Between Agents

**When handing off work:**
1. Complete current task or reach stable checkpoint
2. Document current state in activity log
3. List pending tasks
4. Note any blockers or dependencies
5. Tag the next agent in activity log

**Example Handoff:**
```markdown
## 2026-01-08 15:00 - Augment Code → CLINE
**Completed:** Updated edge functions for OMS-first architecture
**Files Modified:** 
  - supabase/functions/cross-exchange-arbitrage/index.v2.ts
  - supabase/functions/funding-arbitrage/index.v2.ts
**Next Steps:** Update frontend to use new intent-based API
**Blockers:** None
**Notes:** API now returns intent_id instead of order_id
@CLINE: Please update frontend API calls to handle intent-based flow
```

## 🚫 Forbidden Operations (Without Approval)

### NEVER Do These Without Explicit User Approval:

1. ❌ Modify OMS execution logic
2. ❌ Change risk engine rules
3. ❌ Alter position sizing logic
4. ❌ Modify database migrations
5. ❌ Change authentication/authorization
6. ❌ Modify kill switch logic
7. ❌ Change audit logging
8. ❌ Alter tenant isolation logic
9. ❌ Deploy to production
10. ❌ Delete or rename critical files

### ALWAYS Do These:

1. ✅ Create backups before modifying critical files
2. ✅ Run tests before committing
3. ✅ Document all changes
4. ✅ Update activity log
5. ✅ Coordinate with other agents
6. ✅ Ask user when uncertain

## 📝 Required Documentation

### For Every Change:

1. **Activity Log Entry** (`docs/AGENT_ACTIVITY_LOG.md`)
   - Timestamp
   - Agent name
   - Task description
   - Files modified
   - Status

2. **Change Log Entry** (`docs/CHANGE_LOG.md`)
   - Date
   - Agent
   - Type of change (feature, fix, refactor, docs)
   - Files affected
   - Breaking changes
   - Migration notes

3. **Test Results** (if applicable)
   - Tests run
   - Pass/fail status
   - Coverage changes

## 🔍 Conflict Detection

### Before Modifying a File:

1. Check git status: `git status`
2. Check recent commits: `git log --oneline -10 <file>`
3. Check activity log for recent changes
4. If another agent modified recently, coordinate first

### If Conflict Detected:

1. ⚠️ STOP - Do not proceed
2. 📢 Alert user and other agent
3. 🤝 Coordinate resolution
4. ✅ Get approval before proceeding

## 🧪 Testing Requirements

### Before Committing:

**Backend Changes:**
```bash
cd backend
pytest tests/ -v
```

**Frontend Changes:**
```bash
npm run test
npm run type-check
```

**Edge Functions:**
```bash
# Test locally
supabase functions serve <function-name>
# Run integration tests
```

### After Deployment:

1. ✅ Verify in staging
2. ✅ Run smoke tests
3. ✅ Check logs for errors
4. ✅ Monitor for 15 minutes

## 🚨 Emergency Procedures

### If You Break Something:

1. **STOP** - Don't make it worse
2. **ALERT** - Notify user immediately
3. **ROLLBACK** - Revert to last known good state
4. **DOCUMENT** - Log what happened
5. **FIX** - Address root cause with approval

### Rollback Commands:

```bash
# Rollback git commit
git revert HEAD

# Rollback database migration
supabase migration down

# Rollback edge function
supabase functions deploy <function-name> --version <previous-version>

# Restore from backup
cp file.backup.TIMESTAMP.py file.py
```

## 📊 Agent Activity Dashboard

### Check Before Starting:
```bash
# View recent activity
cat docs/AGENT_ACTIVITY_LOG.md | tail -50

# Check for active work
grep "IN PROGRESS" docs/AGENT_ACTIVITY_LOG.md

# View recent changes
cat docs/CHANGE_LOG.md | tail -30
```

## 🎯 Best Practices

1. **Communicate Early and Often**
   - Update activity log frequently
   - Alert other agents of breaking changes
   - Ask user when uncertain

2. **Test Thoroughly**
   - Run tests before committing
   - Test in staging before production
   - Monitor after deployment

3. **Document Everything**
   - Activity log for coordination
   - Change log for history
   - Code comments for context

4. **Respect Boundaries**
   - Stay in your safe zone
   - Get approval for caution zone
   - Never touch no-touch zone without explicit approval

5. **Backup Critical Files**
   - Always create backups before modifying
   - Use timestamped filenames
   - Keep backups for 30 days

## 📞 Escalation Path

1. **Minor Issue** → Document in activity log
2. **Coordination Needed** → Tag other agent in activity log
3. **Critical File Change** → Get user approval first
4. **Breaking Change** → Alert user and all agents
5. **Production Issue** → STOP, alert user, rollback

---

**Remember: When in doubt, ask the user. It's better to ask than to break production!**

