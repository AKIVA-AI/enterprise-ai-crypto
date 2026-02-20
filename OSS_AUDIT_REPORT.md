# Enterprise Crypto - OSS Audit Report

**Date:** February 20, 2026  
**Project:** enterprise-crypto  
**Auditor:** Automated Audit

---

## Executive Summary

This report documents the findings from an open-source software (OSS) audit of the enterprise-crypto project. The audit focused on frontend and backend dependencies, identifying potential version conflicts and security concerns.

---

## Frontend Dependencies (package.json)

### Analysis
The frontend uses a standard React + TypeScript stack with:
- **UI Framework:** Radix UI primitives with shadcn/ui patterns
- **State Management:** React Query, React Hook Form
- **Web3:** wagmi, viem, @web3modal/wagmi
- **Charting:** lightweight-charts, recharts

### Potential Issues

| Package | Version | Status | Notes |
|---------|---------|--------|-------|
| wagmi | 3.1.3 | ⚠️ Review | Major version may have breaking changes |
| viem | 2.43.3 | ⚠️ Review | Verify compatibility with wagmi 3.x |
| react-router-dom | 6.30.1 | ✓ OK | Recent stable version |

### Recommendations
1. **Web3 Libraries:** Ensure wagmi and viem versions are compatible
2. **Testing:** Add Playwright for E2E testing coverage

---

## Backend Dependencies (backend/requirements.txt)

### Critical Issues Found

| Package | Current | Recommended | Severity | Issue |
|---------|---------|-------------|----------|-------|
| httpx | >=0.24.0,<0.26.0 | >=0.27.0 | 🔴 High | supabase 2.3.4 may require newer httpx |
| websockets | 12.0 | 14.1 | 🟡 Medium | Security patches in newer versions |
| aiohttp | >=3.9.0 | >=3.11.18 | 🔴 High | Minimum version too low, security risk |
| pydantic | 2.6.1 | >=2.6.1,<3.0 | 🟡 Medium | Consider upgrading for bug fixes |

### Package Conflicts Identified

1. **httpx conflict:** 
   - Current constraint: `>=0.24.0,<0.26.0`
   - supabase 2.3.4 typically requires httpx >=0.27.0
   - **Action:** Update to `>=0.27.0`

2. **websockets outdated:**
   - Current: 12.0
   - Recent versions have security fixes
   - **Action:** Update to 14.1

3. **aiohttp minimum version:**
   - Current: `>=3.9.0`
   - Vulnerabilities in older versions
   - **Action:** Update to `>=3.11.18`

4. **supabase version:**
   - Current: 2.3.4
   - Consider upgrading to latest for bug fixes
   - **Action:** Review and update

---

## Security Considerations

### Current Risks
1. **Outdated dependencies:** Several packages have known CVEs in older versions
2. **Loose version constraints:** aiohttp allows any 3.9+ version which could pull vulnerable versions
3. **Crypto libraries:** Ensure ccxt, freqtrade versions are current

### Recommendations
1. Run `pip-audit` or `safety` to check for known vulnerabilities
2. Consider using Dependabot for automated updates
3. Pin exact versions for production-critical dependencies

---

## Action Items

### Immediate (High Priority)
- [ ] Update httpx constraint: `>=0.27.0`
- [ ] Update aiohttp: `>=3.11.18`
- [ ] Update websockets: `14.1`

### Short-term (Medium Priority)
- [ ] Review supabase version compatibility
- [ ] Consider upgrading pydantic
- [ ] Add dependency scanning to CI/CD

### Long-term (Low Priority)
- [ ] Implement Dependabot
- [ ] Regular security audits
- [ ] Document dependency update process

---

## Testing Notes

- Backend has pytest configuration
- Frontend has vitest and playwright configs
- Consider adding security scanning tools

---

## Conclusion

The enterprise-crypto project has several dependency version issues that should be addressed, particularly in the backend. The most critical are:
1. httpx version constraint conflicts with supabase
2. Outdated aiohttp with potential security vulnerabilities
3. Outdated websockets library

These issues can be resolved by updating the version constraints in `backend/requirements.txt`.
