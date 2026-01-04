Institutional Grade Overview

Intent lifecycle
- OpportunityScanner evaluates multi-timeframe signals and arbitrage edges.
- Opportunities become TradeIntents with expected edge, confidence, and explanations.
- RiskEngine evaluates intent-level constraints (drawdown, concentration, venue health).
- OMSExecutionService enforces execution cost gates and places orders.
- ReconciliationService monitors mismatches and triggers protective actions.

Risk gates
- Global kill switch and circuit breakers are always evaluated.
- Books can be put into reduce-only mode when reconciliation mismatches persist.
- Per-trade limits include position size, daily loss, and concentration.

Cost model
- EdgeCostModel estimates all-in costs: fees, spread, slippage, latency, funding, basis.
- OMS rejects intents where expected_edge_bps < total_cost_bps + MIN_EDGE_BUFFER_BPS.
- Edge input sources are attached to TradeIntent metadata for auditability.

Arbitrage modes
- Cross-venue: buy on the lowest ask, sell on the highest bid with leg controls.
- Basis: spot vs perp price divergence, with funding and basis buffers.
- Execution plans can be legged or atomic; legged plans enforce time and slippage limits.

Adding a new strategy
- Add a new entry in `backend/data/config/strategies.json`.
- Provide `type`, `universe`, and `timeframes` for directional strategies.
- Provide `venue_routing` and `min_edge_bps` for arbitrage strategies.
- Ensure required data inputs are declared in `data_requirements`.
