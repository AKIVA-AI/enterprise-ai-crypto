-- Basis Arbitrage / Cash-and-Carry Tables (Multi-tenant)
-- Date: 2026-01-05

-- Tenant tables
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'viewer',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT tenant_id
  FROM public.user_tenants
  WHERE user_id = auth.uid() AND is_default = true
  LIMIT 1;
$$;

-- Extend venues
DO $$ BEGIN
  CREATE TYPE public.venue_type AS ENUM ('spot', 'derivatives');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS venue_type public.venue_type DEFAULT 'spot' NOT NULL,
  ADD COLUMN IF NOT EXISTS supports_reduce_only BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS supports_ioc_fok BOOLEAN DEFAULT false NOT NULL;

-- Instruments mapping
CREATE TABLE IF NOT EXISTS public.instruments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  common_symbol TEXT NOT NULL,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  venue_symbol TEXT NOT NULL,
  contract_type TEXT NOT NULL DEFAULT 'spot',
  multiplier DECIMAL(20, 8) DEFAULT 1 NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, venue_id, venue_symbol)
);

-- Fees table
CREATE TABLE IF NOT EXISTS public.fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  maker_bps DECIMAL(10, 4) NOT NULL DEFAULT 10,
  taker_bps DECIMAL(10, 4) NOT NULL DEFAULT 12,
  withdraw_fees JSONB DEFAULT '{}' NOT NULL,
  tier TEXT DEFAULT 'standard' NOT NULL,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Funding rates
CREATE TABLE IF NOT EXISTS public.funding_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  instrument_id UUID NOT NULL REFERENCES public.instruments(id) ON DELETE CASCADE,
  funding_rate DECIMAL(18, 8) NOT NULL,
  funding_time TIMESTAMPTZ NOT NULL,
  mark_price DECIMAL(20, 8) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Basis quotes
CREATE TABLE IF NOT EXISTS public.basis_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  spot_venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  deriv_venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  instrument_id UUID NOT NULL REFERENCES public.instruments(id) ON DELETE CASCADE,
  spot_bid DECIMAL(20, 8) NOT NULL,
  spot_ask DECIMAL(20, 8) NOT NULL,
  perp_bid DECIMAL(20, 8) NOT NULL,
  perp_ask DECIMAL(20, 8) NOT NULL,
  basis_bps DECIMAL(12, 4) NOT NULL,
  basis_z DECIMAL(12, 4) NOT NULL,
  ts TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Strategy positions
CREATE TABLE IF NOT EXISTS public.strategy_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  strategy_id UUID NOT NULL REFERENCES public.strategies(id) ON DELETE CASCADE,
  instrument_id UUID NOT NULL REFERENCES public.instruments(id) ON DELETE CASCADE,
  spot_position DECIMAL(20, 8) NOT NULL DEFAULT 0,
  deriv_position DECIMAL(20, 8) NOT NULL DEFAULT 0,
  avg_entry_basis_bps DECIMAL(12, 4) NOT NULL DEFAULT 0,
  hedged_ratio DECIMAL(8, 4) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, strategy_id, instrument_id)
);

-- Multi-leg intents
CREATE TABLE IF NOT EXISTS public.multi_leg_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  intent_id UUID NOT NULL,
  legs_json JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Leg events (append-only)
CREATE TABLE IF NOT EXISTS public.leg_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  intent_id UUID NOT NULL,
  leg_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  payload_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Basis PnL
CREATE TABLE IF NOT EXISTS public.basis_pnl (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  intent_id UUID NOT NULL,
  realized_pnl DECIMAL(20, 8) NOT NULL DEFAULT 0,
  unrealized_pnl DECIMAL(20, 8) NOT NULL DEFAULT 0,
  funding_pnl DECIMAL(20, 8) NOT NULL DEFAULT 0,
  fees_pnl DECIMAL(20, 8) NOT NULL DEFAULT 0,
  slippage_pnl DECIMAL(20, 8) NOT NULL DEFAULT 0,
  ts TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_instruments_tenant_symbol ON public.instruments(tenant_id, common_symbol);
CREATE INDEX IF NOT EXISTS idx_fees_tenant_venue ON public.fees(tenant_id, venue_id);
CREATE INDEX IF NOT EXISTS idx_funding_rates_tenant_instrument ON public.funding_rates(tenant_id, instrument_id, funding_time DESC);
CREATE INDEX IF NOT EXISTS idx_basis_quotes_tenant_instrument ON public.basis_quotes(tenant_id, instrument_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_strategy_positions_tenant_instrument ON public.strategy_positions(tenant_id, instrument_id);
CREATE INDEX IF NOT EXISTS idx_leg_events_tenant_intent ON public.leg_events(tenant_id, intent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_basis_pnl_tenant_intent ON public.basis_pnl(tenant_id, intent_id, ts DESC);

-- Enable RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.basis_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multi_leg_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leg_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.basis_pnl ENABLE ROW LEVEL SECURITY;

-- Tenant/member access policies
CREATE POLICY "Tenant members can view tenant"
  ON public.tenants FOR SELECT TO authenticated
  USING (id IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()));

CREATE POLICY "Tenant members can view own memberships"
  ON public.user_tenants FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Tenant scoped access instruments"
  ON public.instruments FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "Tenant scoped access fees"
  ON public.fees FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "Tenant scoped access funding rates"
  ON public.funding_rates FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "Tenant scoped access basis quotes"
  ON public.basis_quotes FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "Tenant scoped access strategy positions"
  ON public.strategy_positions FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "Tenant scoped access multi leg intents"
  ON public.multi_leg_intents FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "Tenant scoped access leg events"
  ON public.leg_events FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "Tenant scoped access basis pnl"
  ON public.basis_pnl FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- Service role policies
CREATE POLICY "Service role manages tenants"
  ON public.tenants FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages user tenants"
  ON public.user_tenants FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages instruments"
  ON public.instruments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages fees"
  ON public.fees FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages funding rates"
  ON public.funding_rates FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages basis quotes"
  ON public.basis_quotes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages strategy positions"
  ON public.strategy_positions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages multi leg intents"
  ON public.multi_leg_intents FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages leg events"
  ON public.leg_events FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages basis pnl"
  ON public.basis_pnl FOR ALL TO service_role USING (true) WITH CHECK (true);
