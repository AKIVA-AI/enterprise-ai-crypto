-- ============================================================================
-- Supabase migration template — GRANT-compliant CREATE TABLE pattern
-- ============================================================================
-- REQUIRED starting 2026-05-30 (new projects) / 2026-10-30 (existing projects).
-- Supabase removes implicit Data API grants on tables created in `public`.
-- Without an explicit GRANT, PostgREST returns 42501 and clients fail.
--
-- RLS policies and GRANTs are separate layers:
--   GRANT -> controls whether the role can REACH the table via the Data API.
--   RLS   -> controls which ROWS within an already-granted table the role sees.
-- Both are required.
--
-- CI guard: .github/workflows/supabase-grants-check.yml blocks PRs that miss GRANTs.
-- Per-file opt-out for intentionally service-role-only tables:
--   -- supabase-grants-check: ignore
-- ============================================================================
--
-- This file is a REFERENCE TEMPLATE. It is named with a leading underscore
-- (_GRANT_TEMPLATE.sql) so Supabase CLI does not apply it as a real migration.
-- Copy the relevant variant into your real migration file and customize.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Step 1: create the table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.your_table (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Step 2: GRANTs (REQUIRED — pick the variant matching the access pattern)
-- ---------------------------------------------------------------------------

-- Variant A — User-owned table (most common):
GRANT SELECT, INSERT, UPDATE, DELETE ON public.your_table TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.your_table TO service_role;

-- Variant B — Public-read reference table (e.g., status lookups):
-- GRANT SELECT                         ON public.your_table TO anon;
-- GRANT SELECT                         ON public.your_table TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.your_table TO service_role;

-- Variant C — Service-role-only (token blacklists, key vaults, internal queues):
-- Add this comment at the TOP of the real migration file to bypass the CI guard:
-- -- supabase-grants-check: ignore
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.your_table TO service_role;

-- ---------------------------------------------------------------------------
-- Step 3: enable Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Step 4: row-level policies
-- ---------------------------------------------------------------------------
CREATE POLICY "Users read their own rows"
    ON public.your_table
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users write their own rows"
    ON public.your_table
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
