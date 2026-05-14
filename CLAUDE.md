# Enterprise Crypto — Algorithmic Trading Platform

**Archetype:** 7 — Algorithmic Trading Platform
**Composite Score:** 74/100 (re-scored 2026-04-05 in cross-system gap closure sprint, +3.0 from 71/100; D8 7→9 false negative correction, mypy CI, onboarding wizard, ARIA on 10 components)
**Prior Scores:** 71/100 (v2.14 baseline, 2026-04-04, full audit) | 72/100 (v2.11, 2026-03-17, post-Sprint 4)
**Evidence:** workspace memory `project_cross_system_gap_closure.md` and `project_crypto_full_audit_2026_04_04.md`
**Standards:** See `akiva-enterprise-products/CLAUDE.md` for current Akiva Build Standard version and full standards reference.

## Stack

- **Backend:** Python (FastAPI) at `apps/backend/` — trading engine, strategy/PnL services, structlog observability
- **Frontend:** TypeScript / React (Vite) at repo root — onboarding wizard, dashboards, ARIA-compliant trading UI
- **Coverage gates:** mypy (CI-blocking, lifted D8 7→9 in 2026-04-05 closure sprint)

## Verification Commands

| Action | Command | Run from |
|--------|---------|----------|
| Backend test | `pytest --cov=app` | `apps/backend/` |
| Backend lint / type-check | `ruff check app/` | `apps/backend/` |
| Frontend test | `npm test` | repo root |
| Frontend type-check | `npm run typecheck` | repo root |

## Key Paths

- **Codebase map:** `docs/CODEBASE_MAP.md`
- **Audit:** `docs/audits/ENTERPRISE_CRYPTO_FULL_AUDIT_2026-04-04.md`
- **Prior audit:** `docs/audits/ENTERPRISE_CRYPTO_AUDIT_REPORT_S4_2026-03-17.md`
- **Gap analysis:** `docs/audits/ENTERPRISE_CRYPTO_GAP_ANALYSIS_2026-03-14.md`
- **Capability inventory:** `docs/ENTERPRISE_CRYPTO_VERIFIED_CAPABILITY_INVENTORY_2026-03-14.md`

## Learned Corrections

Cross-system corrections (tsc, SECURITY DEFINER, SCRAM pooler) are in the root workspace `CLAUDE.md`. Only enterprise-crypto-specific corrections below:

- **Supabase migrations must include explicit GRANTs for new `public.*` tables.** Starting 2026-05-30 (new projects) / 2026-10-30 (existing projects), Supabase removes implicit Data API exposure of `public`-schema tables. Every new `CREATE TABLE public.*` must include `GRANT ... TO authenticated` (and `anon` / `service_role` as appropriate) BEFORE the `CREATE POLICY` statements, or PostgREST returns `42501`. RLS and GRANTs are separate layers — RLS filters rows on granted tables; GRANT controls Data API access. Canonical pattern: `supabase/migrations/_GRANT_TEMPLATE.sql`. CI guard: `.github/workflows/supabase-grants-check.yml`. Per-file opt-out for service-role-only tables: `-- supabase-grants-check: ignore`.
- structlog's first positional arg is the event name — never pass `event=` as a keyword arg (causes `TypeError: got multiple values for argument 'event'`). Also avoid `timestamp=` as a kwarg since structlog's `TimeStamper` processor adds it automatically; use a prefixed name like `transition_timestamp` instead.
