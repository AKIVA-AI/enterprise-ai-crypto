# Enterprise Crypto — Algorithmic Trading Platform

**Archetype:** 7 — Algorithmic Trading Platform
**Composite Score:** 74/100 (re-scored 2026-04-05 in cross-system gap closure sprint, +3.0 from 71/100; D8 7→9 false negative correction, mypy CI, onboarding wizard, ARIA on 10 components)
**Prior Scores:** 71/100 (v2.14 baseline, 2026-04-04, full audit) | 72/100 (v2.11, 2026-03-17, post-Sprint 4)
**Evidence:** workspace memory `project_cross_system_gap_closure.md` and `project_crypto_full_audit_2026_04_04.md`
**Standards:** Akiva Build Standard v2.14 — see `akiva-enterprise-products/CLAUDE.md` for full standards reference.

## Key Paths

- **Codebase map:** `docs/CODEBASE_MAP.md`
- **Audit:** `docs/audits/ENTERPRISE_CRYPTO_FULL_AUDIT_2026-04-04.md`
- **Prior audit:** `docs/audits/ENTERPRISE_CRYPTO_AUDIT_REPORT_S4_2026-03-17.md`
- **Gap analysis:** `docs/audits/ENTERPRISE_CRYPTO_GAP_ANALYSIS_2026-03-14.md`
- **Capability inventory:** `docs/ENTERPRISE_CRYPTO_VERIFIED_CAPABILITY_INVENTORY_2026-03-14.md`

## Learned Corrections

Cross-system corrections (tsc, SECURITY DEFINER, SCRAM pooler) are in the root workspace `CLAUDE.md`. Only enterprise-crypto-specific corrections below:

- structlog's first positional arg is the event name — never pass `event=` as a keyword arg (causes `TypeError: got multiple values for argument 'event'`). Also avoid `timestamp=` as a kwarg since structlog's `TimeStamper` processor adds it automatically; use a prefixed name like `transition_timestamp` instead.
