#!/bin/bash
# Pre-Commit Checklist for Multi-Agent Development
# Run this before committing any changes

set -e

echo "🔍 Pre-Commit Checklist for Multi-Agent Development"
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILURES=0

# Function to check if file is critical
is_critical_file() {
    local file=$1
    
    # Critical backend files
    if [[ "$file" == *"backend/app/services/oms_execution.py"* ]] || \
       [[ "$file" == *"backend/app/services/risk_engine.py"* ]] || \
       [[ "$file" == *"backend/app/services/portfolio_engine.py"* ]] || \
       [[ "$file" == *"backend/app/services/engine_runner.py"* ]] || \
       [[ "$file" == *"backend/app/database.py"* ]] || \
       [[ "$file" == *"supabase/migrations/"*.sql ]] || \
       [[ "$file" == *"supabase/functions/_shared/"* ]]; then
        return 0
    fi
    
    return 1
}

# Check 1: Activity Log Updated
echo "📝 Check 1: Activity Log Updated"
if git diff --cached --name-only | grep -q "docs/AGENT_ACTIVITY_LOG.md"; then
    echo -e "${GREEN}✅ Activity log updated${NC}"
else
    echo -e "${RED}❌ Activity log NOT updated${NC}"
    echo "   Please update docs/AGENT_ACTIVITY_LOG.md before committing"
    FAILURES=$((FAILURES + 1))
fi
echo ""

# Check 2: Change Log Updated
echo "📋 Check 2: Change Log Updated"
if git diff --cached --name-only | grep -q "docs/CHANGE_LOG.md"; then
    echo -e "${GREEN}✅ Change log updated${NC}"
else
    echo -e "${YELLOW}⚠️  Change log NOT updated${NC}"
    echo "   Consider updating docs/CHANGE_LOG.md for significant changes"
fi
echo ""

# Check 3: Critical Files Modified
echo "🔒 Check 3: Critical Files Modified"
CRITICAL_FILES_MODIFIED=0
while IFS= read -r file; do
    if is_critical_file "$file"; then
        echo -e "${RED}⚠️  CRITICAL FILE: $file${NC}"
        CRITICAL_FILES_MODIFIED=$((CRITICAL_FILES_MODIFIED + 1))
    fi
done < <(git diff --cached --name-only)

if [ $CRITICAL_FILES_MODIFIED -gt 0 ]; then
    echo -e "${RED}❌ $CRITICAL_FILES_MODIFIED critical file(s) modified${NC}"
    echo "   Did you get user approval?"
    echo "   Did you create backups?"
    echo "   Did you test thoroughly?"
    read -p "   Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "   Commit aborted"
        exit 1
    fi
else
    echo -e "${GREEN}✅ No critical files modified${NC}"
fi
echo ""

# Check 4: Tests Run
echo "🧪 Check 4: Tests Run"
if [ -d "backend" ]; then
    echo "   Running backend tests..."
    if cd backend && python -m pytest tests/ -v --tb=short 2>&1 | tail -20; then
        echo -e "${GREEN}✅ Backend tests passed${NC}"
        cd ..
    else
        echo -e "${RED}❌ Backend tests failed${NC}"
        cd ..
        FAILURES=$((FAILURES + 1))
    fi
fi

if [ -f "package.json" ]; then
    echo "   Running frontend type check..."
    if npm run type-check 2>&1 | tail -10; then
        echo -e "${GREEN}✅ Frontend type check passed${NC}"
    else
        echo -e "${RED}❌ Frontend type check failed${NC}"
        FAILURES=$((FAILURES + 1))
    fi
fi
echo ""

# Check 5: No Secrets in Commit
echo "🔐 Check 5: No Secrets in Commit"
SECRETS_FOUND=0
while IFS= read -r file; do
    if git diff --cached "$file" | grep -iE "(api[_-]?key|secret|password|token|private[_-]?key)" | grep -v "# " | grep -v "//" > /dev/null; then
        echo -e "${RED}⚠️  Possible secret in: $file${NC}"
        SECRETS_FOUND=$((SECRETS_FOUND + 1))
    fi
done < <(git diff --cached --name-only)

if [ $SECRETS_FOUND -gt 0 ]; then
    echo -e "${RED}❌ Possible secrets found in $SECRETS_FOUND file(s)${NC}"
    echo "   Review carefully before committing"
    FAILURES=$((FAILURES + 1))
else
    echo -e "${GREEN}✅ No obvious secrets detected${NC}"
fi
echo ""

# Check 6: Backup Created for Critical Files
echo "💾 Check 6: Backups Created"
BACKUPS_NEEDED=0
while IFS= read -r file; do
    if is_critical_file "$file"; then
        BACKUP_FILE="${file}.backup.$(date +%Y%m%d)"
        if [ ! -f "$BACKUP_FILE" ]; then
            echo -e "${YELLOW}⚠️  No backup for: $file${NC}"
            BACKUPS_NEEDED=$((BACKUPS_NEEDED + 1))
        fi
    fi
done < <(git diff --cached --name-only)

if [ $BACKUPS_NEEDED -gt 0 ]; then
    echo -e "${YELLOW}⚠️  $BACKUPS_NEEDED critical file(s) without backups${NC}"
    echo "   Consider creating backups with:"
    echo "   cp <file> <file>.backup.\$(date +%Y%m%d_%H%M%S)"
else
    echo -e "${GREEN}✅ Backups check passed${NC}"
fi
echo ""

# Summary
echo "=================================================="
echo "📊 Summary"
echo "=================================================="

if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "Ready to commit. Remember to:"
    echo "1. Push to feature branch first"
    echo "2. Test in staging before production"
    echo "3. Monitor logs after deployment"
    exit 0
else
    echo -e "${RED}❌ $FAILURES check(s) failed${NC}"
    echo ""
    echo "Please address the issues above before committing."
    exit 1
fi

