# ADR-002: Supabase RLS for Multi-Tenant Data Isolation

**Status:** Accepted
**Date:** 2026-01-20
**Decision Makers:** Platform Architecture Team, Security Lead

## Context

Enterprise Crypto serves multiple trading desks (tenants) within a single deployment. Each tenant operates independent trading books, strategies, positions, and risk limits. Data isolation is critical:

- A trader on Desk A must never see Desk B's positions, orders, or P&L
- Audit events must be immutable and append-only
- Service-level operations (backend agents, cron jobs) need cross-tenant access
- API key encryption must be handled server-side with no client exposure

We considered three approaches:

1. **Application-level filtering:** Add `WHERE tenant_id = ?` to every query in application code.
2. **Separate databases per tenant:** Each tenant gets its own Supabase project.
3. **Row-Level Security (RLS) at the database layer:** PostgreSQL RLS policies enforce isolation transparently.

## Decision

We chose **Supabase Row-Level Security (RLS)** with 212 policies across 16+ tables.

Key implementation details:
- Multi-tenant isolation uses `book_id` and a `current_tenant_id()` SQL function that extracts the tenant from the JWT
- Role-based access uses `has_any_role()` function supporting 7 roles: admin, cio, trader, ops, research, auditor, viewer
- Service role bypass allows backend operations to operate cross-tenant
- Audit events table (`audit_events`) is INSERT-only: no UPDATE or DELETE policies exist, making the audit trail immutable by design
- API key encryption uses pgcrypto AES-256 via SECURITY DEFINER functions (with `SET search_path = public` per Supabase linter 0011)

## Consequences

**Positive:**
- Defense in depth: even if application code has a bug, the database enforces isolation
- No possibility of accidental cross-tenant data leaks from missing WHERE clauses
- RLS policies are version-controlled in SQL migrations (42 migration files)
- Immutable audit trail is enforced at the database level, not application level
- Role-based access is consistent whether queries come from the frontend, edge functions, or backend
- Policy definitions serve as living documentation of access rules

**Negative:**
- 212 RLS policies add complexity to database migrations; policy conflicts can cause subtle query failures
- Debugging permission errors requires understanding both the application layer and the RLS policy layer
- Performance: RLS adds overhead to every query (mitigated by indexing `book_id` and `tenant_id` columns)
- Testing requires careful setup of JWT claims and role assignments
- `active_agents` is a VIEW, not a table; it cannot have RLS policies, ALTER TABLE, or GRANT statements applied to it

**Risks Accepted:**
- RLS policy count (212) is high and could become difficult to maintain; we mitigate this with naming conventions and migration review requirements
- Circuit breaker triggers operate via PostgreSQL triggers on fills/positions, which execute within the RLS context; these must use SECURITY DEFINER to function correctly
