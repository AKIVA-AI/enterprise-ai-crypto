Basis Arbitrage (Cash-and-Carry)

What basis is
- Basis is the price difference between spot and derivatives.
- Funding is the periodic payment on perpetuals that incentivizes price convergence.

Open rules
- Cash-and-carry: open when executable basis (perp_bid - spot_ask) bps >= open_threshold_bps.
- Reverse carry (optional): open when executable basis (perp_ask - spot_bid) bps <= -open_threshold_bps.
- Expected return must exceed min_expected_return_bps after costs and buffers.
- Liquidity guardrails: spreads must stay under cap, volume above minimum.

Close rules
- Basis falls below close_threshold_bps.
- Max holding time reached or risk constraints trigger.
- Reconciliation or venue health issues force reduce-only or unwind.

Cost model and buffers
- BasisEdgeModel accounts for funding, basis convergence, fees, slippage, latency, and unwind risk.
- Inputs and outputs are stored on each TradeIntent for auditability.

Legging and unwind behavior
- Default execution: derivatives leg first (IOC/FOK intent) to reduce directional exposure.
- Leg controls: max_time_between_legs_ms and max_leg_slippage_bps.
- If the second leg fails, the first leg is unwound immediately.
- Every leg action is recorded in leg_events and audit_log.

Safety and audit trail
- RiskEngine gates every intent.
- Reconciliation enforces hedged ratio tolerance and can set reduce-only.
- Alerts and audit logs are written for all protective actions.

Coinbase Advanced limitation
- Coinbase Advanced is spot-only for US users.
- The perp leg must be routed to an international derivatives venue via adapters.
- This module is exchange-agnostic for derivatives and supports stub adapters in paper mode.
