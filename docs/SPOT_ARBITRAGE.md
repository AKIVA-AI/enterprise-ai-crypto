Cross-Venue Spot Arbitrage

Overview
- Cross-venue spot arbitrage exploits price differences between exchanges.
- Coinbase Advanced is the primary venue; other venues are optional.
- Inventory is assumed to be pre-positioned to avoid transfer latency.

Execution modes
- Inventory mode: sell from inventory on expensive venue, buy on cheap venue.
- Legged mode: sell first (IOC/FOK intent), then buy; enforced max time between legs.

Cost model
- Net edge = executable spread minus fees, slippage buffer, and latency buffer.
- Opportunities below the minimum edge are rejected before OMS execution.

Failure modes and safety responses
- If the second leg fails, the first leg is unwound immediately.
- Reconciliation detects inventory drift and sets reduce-only on books.
- All actions are recorded in audit logs and leg_events.

Coinbase Advanced considerations
- Coinbase is spot-only in the US.
- This module remains spot-only and CFTC-compatible.
- Additional venues are integrated through adapters in paper or live mode.
