"""
Strategy Metrics Service - aggregates performance and risk metrics.
"""
from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional

import structlog

from app.config import settings
from app.database import get_supabase

logger = structlog.get_logger()


class StrategyMetricsService:
    """Compute and store performance and risk metrics for allocator."""

    def __init__(self):
        self._correlation_map = {
            "futures_scalp": "directional",
            "spot": "directional",
            "basis": "market_neutral",
            "spot_arb": "market_neutral",
        }

    async def refresh(self, tenant_id: Optional[str] = None) -> None:
        tenant_id = tenant_id or settings.tenant_id
        if not tenant_id:
            return
        try:
            supabase = get_supabase()
            strategies = supabase.table("strategies").select(
                "id, strategy_type, enabled"
            ).eq("tenant_id", tenant_id).execute()

            for strategy in strategies.data:
                strategy_id = strategy["id"]
                strategy_type = strategy.get("strategy_type", "spot")
                if not strategy.get("enabled", True):
                    continue

                perf = self._compute_performance(supabase, strategy_id)
                risk = self._compute_risk(supabase, strategy_id, strategy_type)

                if perf:
                    supabase.table("strategy_performance").insert({
                        "tenant_id": tenant_id,
                        "strategy_id": strategy_id,
                        "window": "7d",
                        "pnl": perf["pnl"],
                        "sharpe": perf["sharpe"],
                        "sortino": perf["sortino"],
                        "max_drawdown": perf["max_drawdown"],
                        "win_rate": perf["win_rate"],
                        "turnover": perf["turnover"],
                        "ts": datetime.utcnow().isoformat(),
                    }).execute()

                if risk:
                    supabase.table("strategy_risk_metrics").insert({
                        "tenant_id": tenant_id,
                        "strategy_id": strategy_id,
                        "gross_exposure": risk["gross_exposure"],
                        "net_exposure": risk["net_exposure"],
                        "var_estimate": risk["var_estimate"],
                        "stress_loss_estimate": risk["stress_loss_estimate"],
                        "correlation_cluster": risk["correlation_cluster"],
                        "ts": datetime.utcnow().isoformat(),
                    }).execute()

        except Exception as exc:
            logger.warning("strategy_metrics_refresh_failed", error=str(exc))

    def _compute_performance(self, supabase, strategy_id: str) -> Optional[Dict]:
        positions = supabase.table("positions").select(
            "unrealized_pnl, realized_pnl"
        ).eq("strategy_id", strategy_id).execute()

        if not positions.data:
            return None
        pnl = sum(
            float(row.get("unrealized_pnl", 0)) + float(row.get("realized_pnl", 0))
            for row in positions.data
        )
        trades = supabase.table("orders").select("id", count="exact").eq(
            "strategy_id", strategy_id
        ).execute()
        trade_count = trades.count or 1
        win_rate = 0.5

        return {
            "pnl": pnl,
            "sharpe": pnl / max(trade_count, 1),
            "sortino": pnl / max(trade_count, 1),
            "max_drawdown": 0.0,
            "win_rate": win_rate,
            "turnover": trade_count,
        }

    def _compute_risk(self, supabase, strategy_id: str, strategy_type: str) -> Dict:
        positions = supabase.table("positions").select(
            "size, mark_price, side"
        ).eq("strategy_id", strategy_id).execute()
        gross = 0.0
        net = 0.0
        for row in positions.data:
            size = float(row.get("size", 0))
            price = float(row.get("mark_price", 0))
            value = size * price
            gross += abs(value)
            if row.get("side") == "sell":
                value = -value
            net += value

        var_estimate = gross * 0.05
        stress_loss = gross * 0.1
        cluster = self._correlation_map.get(strategy_type, "directional")

        return {
            "gross_exposure": gross,
            "net_exposure": net,
            "var_estimate": var_estimate,
            "stress_loss_estimate": stress_loss,
            "correlation_cluster": cluster,
        }


strategy_metrics_service = StrategyMetricsService()
