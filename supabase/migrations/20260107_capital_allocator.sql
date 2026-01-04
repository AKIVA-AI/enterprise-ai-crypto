-- Capital Allocator Schema (Multi-tenant)
-- Date: 2026-01-07

DO $$ BEGIN
  CREATE TYPE public.strategy_type AS ENUM ('futures_scalp', 'spot', 'basis', 'spot_arb');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Extend strategies table for allocator metadata
ALTER TABLE public.strategies
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS strategy_type public.strategy_type DEFAULT 'spot' NOT NULL,
  ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS max_notional DECIMAL(20, 8) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS min_notional DECIMAL(20, 8) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS capacity_estimate DECIMAL(20, 8) DEFAULT 0 NOT NULL;

-- Strategy allocations
CREATE TABLE IF NOT EXISTS public.strategy_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  strategy_id UUID NOT NULL REFERENCES public.strategies(id) ON DELETE CASCADE,
  allocated_capital DECIMAL(20, 8) NOT NULL,
  allocation_pct DECIMAL(10, 6) NOT NULL,
  leverage_cap DECIMAL(10, 4) NOT NULL DEFAULT 1.0,
  risk_multiplier DECIMAL(10, 4) NOT NULL DEFAULT 1.0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, strategy_id)
);

-- Strategy performance
CREATE TABLE IF NOT EXISTS public.strategy_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  strategy_id UUID NOT NULL REFERENCES public.strategies(id) ON DELETE CASCADE,
  window TEXT NOT NULL,
  pnl DECIMAL(20, 8) NOT NULL DEFAULT 0,
  sharpe DECIMAL(10, 4) NOT NULL DEFAULT 0,
  sortino DECIMAL(10, 4) NOT NULL DEFAULT 0,
  max_drawdown DECIMAL(10, 4) NOT NULL DEFAULT 0,
  win_rate DECIMAL(10, 4) NOT NULL DEFAULT 0,
  turnover DECIMAL(10, 4) NOT NULL DEFAULT 0,
  ts TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Strategy risk metrics
CREATE TABLE IF NOT EXISTS public.strategy_risk_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  strategy_id UUID NOT NULL REFERENCES public.strategies(id) ON DELETE CASCADE,
  gross_exposure DECIMAL(20, 8) NOT NULL DEFAULT 0,
  net_exposure DECIMAL(20, 8) NOT NULL DEFAULT 0,
  var_estimate DECIMAL(20, 8) NOT NULL DEFAULT 0,
  stress_loss_estimate DECIMAL(20, 8) NOT NULL DEFAULT 0,
  correlation_cluster TEXT,
  ts TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Allocator decisions (append-only)
CREATE TABLE IF NOT EXISTS public.allocator_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  decision_id UUID NOT NULL,
  regime_state JSONB NOT NULL,
  allocation_snapshot_json JSONB NOT NULL,
  rationale_json JSONB NOT NULL,
  ts TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Market regimes (append-only)
CREATE TABLE IF NOT EXISTS public.market_regimes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  direction TEXT NOT NULL,
  volatility TEXT NOT NULL,
  liquidity TEXT NOT NULL,
  risk_bias TEXT NOT NULL,
  regime_state JSONB NOT NULL,
  ts TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_strategy_allocations_tenant
  ON public.strategy_allocations(tenant_id, strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_performance_tenant
  ON public.strategy_performance(tenant_id, strategy_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_strategy_risk_metrics_tenant
  ON public.strategy_risk_metrics(tenant_id, strategy_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_allocator_decisions_tenant
  ON public.allocator_decisions(tenant_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_market_regimes_tenant
  ON public.market_regimes(tenant_id, ts DESC);

-- Enable RLS
ALTER TABLE public.strategy_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_risk_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allocator_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_regimes ENABLE ROW LEVEL SECURITY;

-- Tenant scoped policies
CREATE POLICY "Tenant scoped access strategy allocations"
  ON public.strategy_allocations FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "Tenant scoped access strategy performance"
  ON public.strategy_performance FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "Tenant scoped access strategy risk metrics"
  ON public.strategy_risk_metrics FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "Tenant scoped allocator decisions insert"
  ON public.allocator_decisions FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY "Tenant scoped allocator decisions select"
  ON public.allocator_decisions FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "Tenant scoped market regimes insert"
  ON public.market_regimes FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY "Tenant scoped market regimes select"
  ON public.market_regimes FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

-- Service role policies
CREATE POLICY "Service role manages strategy allocations"
  ON public.strategy_allocations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages strategy performance"
  ON public.strategy_performance FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages strategy risk metrics"
  ON public.strategy_risk_metrics FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages allocator decisions"
  ON public.allocator_decisions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages market regimes"
  ON public.market_regimes FOR ALL TO service_role USING (true) WITH CHECK (true);
