Capital Allocator

Philosophy
- The allocator sits above strategies and below RiskEngine.
- It allocates capital based on regime, performance, risk, and capacity.
- Decisions are transparent, deterministic, and auditable.

Regime detection
- Direction: trending_up, trending_down, range_bound.
- Volatility: low_vol, medium_vol, high_vol.
- Liquidity: deep_liquidity, normal, thin.
- Risk bias combines direction, volatility, and liquidity.

Allocation rules
- Base weights per strategy type are configured in `backend/data/config/capital_allocator.json`.
- Performance multiplier penalizes low Sharpe and high drawdown.
- Regime multipliers favor market-neutral strategies in high volatility.
- Correlation clusters receive a diversification penalty.

Risk governance
- Allocator freezes if data quality is stale or reconciliation mismatches persist.
- Strategies can be disabled by allocation (enabled=false).
- RiskEngine enforces hard limits; allocator sets soft limits.

Auditability
- Allocations are stored in `strategy_allocations`.
- Decisions are stored in `allocator_decisions` with rationale JSON.
- Regime states are stored in `market_regimes`.

Integration
- EngineRunner runs the allocator each cycle.
- TradeIntents are scaled by allocation and risk multipliers before RiskEngine.
- OMS sizes orders based on allocator-adjusted intent sizes.
