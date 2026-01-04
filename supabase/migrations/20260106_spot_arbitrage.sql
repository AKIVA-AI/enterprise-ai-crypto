-- Cross-Venue Spot Arbitrage Tables (Multi-tenant)
-- Date: 2026-01-06

-- Spot quotes
CREATE TABLE IF NOT EXISTS public.spot_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  instrument_id UUID NOT NULL REFERENCES public.instruments(id) ON DELETE CASCADE,
  bid_price DECIMAL(20, 8) NOT NULL,
  ask_price DECIMAL(20, 8) NOT NULL,
  bid_size DECIMAL(20, 8) NOT NULL,
  ask_size DECIMAL(20, 8) NOT NULL,
  spread_bps DECIMAL(12, 4) NOT NULL,
  ts TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Arbitrage spreads
CREATE TABLE IF NOT EXISTS public.arb_spreads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  instrument_id UUID NOT NULL REFERENCES public.instruments(id) ON DELETE CASCADE,
  buy_venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  sell_venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  executable_spread_bps DECIMAL(12, 4) NOT NULL,
  net_edge_bps DECIMAL(12, 4) NOT NULL,
  liquidity_score DECIMAL(10, 4) NOT NULL,
  latency_score DECIMAL(10, 4) NOT NULL,
  ts TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Venue inventory
CREATE TABLE IF NOT EXISTS public.venue_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  instrument_id UUID NOT NULL REFERENCES public.instruments(id) ON DELETE CASCADE,
  available_qty DECIMAL(20, 8) NOT NULL DEFAULT 0,
  reserved_qty DECIMAL(20, 8) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, venue_id, instrument_id)
);

-- Arbitrage PnL (append-only)
CREATE TABLE IF NOT EXISTS public.arb_pnl (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  intent_id UUID NOT NULL,
  gross_pnl DECIMAL(20, 8) NOT NULL DEFAULT 0,
  fees DECIMAL(20, 8) NOT NULL DEFAULT 0,
  slippage DECIMAL(20, 8) NOT NULL DEFAULT 0,
  net_pnl DECIMAL(20, 8) NOT NULL DEFAULT 0,
  ts TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Extend multi_leg_intents with execution mode
ALTER TABLE public.multi_leg_intents
  ADD COLUMN IF NOT EXISTS execution_mode TEXT NOT NULL DEFAULT 'legged';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_spot_quotes_tenant_instrument
  ON public.spot_quotes(tenant_id, instrument_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_spot_quotes_tenant_venue
  ON public.spot_quotes(tenant_id, venue_id);
CREATE INDEX IF NOT EXISTS idx_arb_spreads_tenant_instrument
  ON public.arb_spreads(tenant_id, instrument_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_arb_spreads_tenant_venue
  ON public.arb_spreads(tenant_id, buy_venue_id, sell_venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_inventory_tenant_venue
  ON public.venue_inventory(tenant_id, venue_id);
CREATE INDEX IF NOT EXISTS idx_arb_pnl_tenant_intent
  ON public.arb_pnl(tenant_id, intent_id, ts DESC);

-- Enable RLS
ALTER TABLE public.spot_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arb_spreads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arb_pnl ENABLE ROW LEVEL SECURITY;

-- Tenant scoped policies
CREATE POLICY "Tenant scoped access spot quotes"
  ON public.spot_quotes FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "Tenant scoped access arb spreads"
  ON public.arb_spreads FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "Tenant scoped access venue inventory"
  ON public.venue_inventory FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "Tenant scoped access arb pnl insert"
  ON public.arb_pnl FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "Tenant scoped access arb pnl select"
  ON public.arb_pnl FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

-- Service role policies
CREATE POLICY "Service role manages spot quotes"
  ON public.spot_quotes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages arb spreads"
  ON public.arb_spreads FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages venue inventory"
  ON public.venue_inventory FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages arb pnl"
  ON public.arb_pnl FOR ALL TO service_role USING (true) WITH CHECK (true);
