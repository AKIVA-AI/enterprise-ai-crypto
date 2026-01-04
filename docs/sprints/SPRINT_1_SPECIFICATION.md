# Sprint 1 Specification: Foundation

**Duration:** 3 days  
**Goal:** Core backtesting engine + basic visualization  
**Status:** 🔵 READY TO START

---

## 📋 Sprint 1 Components

| Order | Component | Agent | Status |
|-------|-----------|-------|--------|
| 1.1 | BacktestResult model | CODEX | ⬜ Not Started |
| 1.2 | PerformanceMetrics service | CODEX | ⬜ Not Started |
| 1.3 | InstitutionalBacktester | CODEX | ⬜ Not Started |
| 1.4 | Backtest API endpoint | CODEX | ⬜ Not Started |
| 1.5 | Backend Review | AC | ⬜ Not Started |
| 1.6 | useBacktestResults hook | CLINE | ⬜ Not Started |
| 1.7 | EquityCurveChart | CLINE | ⬜ Not Started |
| 1.8 | PerformanceMetricsCard | CLINE | ⬜ Not Started |
| 1.9 | Frontend Review | AC | ⬜ Not Started |
| 1.10 | Integration Test | AC | ⬜ Not Started |

---

## 🐍 CODEX Task 1.1: BacktestResult Model

**File:** `backend/app/models/backtest_result.py`

```python
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4
import pandas as pd


@dataclass
class EquityPoint:
    """Single point on equity curve."""
    timestamp: datetime
    equity: float
    drawdown: float
    position_value: float
    cash: float


@dataclass
class TradeRecord:
    """Record of a single trade."""
    id: UUID
    timestamp_open: datetime
    timestamp_close: Optional[datetime]
    instrument: str
    side: str  # 'long' or 'short'
    size: float
    entry_price: float
    exit_price: Optional[float]
    pnl: Optional[float]
    pnl_percent: Optional[float]
    fees: float
    slippage: float


@dataclass
class PerformanceMetrics:
    """Comprehensive performance metrics."""
    # Returns
    total_return: float
    annualized_return: float
    
    # Risk-adjusted
    sharpe_ratio: float
    sortino_ratio: float
    calmar_ratio: float
    
    # Drawdown
    max_drawdown: float
    max_drawdown_duration_days: int
    avg_drawdown: float
    
    # Trade stats
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    profit_factor: float
    avg_win: float
    avg_loss: float
    largest_win: float
    largest_loss: float
    avg_trade_duration_hours: float
    
    # Risk
    volatility: float
    downside_volatility: float
    var_95: float  # Value at Risk 95%
    cvar_95: float  # Conditional VaR 95%


@dataclass
class BacktestResult:
    """Complete backtest result."""
    id: UUID = field(default_factory=uuid4)
    strategy_name: str = ""
    strategy_config: dict = field(default_factory=dict)
    
    # Time range
    start_date: datetime = None
    end_date: datetime = None
    
    # Configuration
    initial_capital: float = 100000.0
    instruments: List[str] = field(default_factory=list)
    timeframe: str = "1h"
    
    # Results
    final_equity: float = 0.0
    equity_curve: List[EquityPoint] = field(default_factory=list)
    trades: List[TradeRecord] = field(default_factory=list)
    metrics: PerformanceMetrics = None
    
    # Metadata
    created_at: datetime = field(default_factory=datetime.utcnow)
    execution_time_seconds: float = 0.0
    
    # Validation
    in_sample_metrics: Optional[PerformanceMetrics] = None
    out_sample_metrics: Optional[PerformanceMetrics] = None
    validation_metrics: Optional[PerformanceMetrics] = None
```

**Tests Required:**
- [ ] Test dataclass creation
- [ ] Test default values
- [ ] Test serialization to dict
- [ ] Test deserialization from dict

---

## 🐍 CODEX Task 1.2: PerformanceMetrics Service

**File:** `backend/app/services/performance_metrics.py`

```python
import numpy as np
import pandas as pd
from typing import List
from backend.app.models.backtest_result import (
    PerformanceMetrics, 
    EquityPoint, 
    TradeRecord
)


class PerformanceMetricsCalculator:
    """Calculate institutional-grade performance metrics."""
    
    def __init__(self, risk_free_rate: float = 0.02):
        """
        Initialize calculator.
        
        Args:
            risk_free_rate: Annual risk-free rate (default 2%)
        """
        self.risk_free_rate = risk_free_rate
    
    def calculate_all(
        self,
        equity_curve: List[EquityPoint],
        trades: List[TradeRecord],
        initial_capital: float
    ) -> PerformanceMetrics:
        """
        Calculate all performance metrics.
        
        Args:
            equity_curve: List of equity points
            trades: List of trade records
            initial_capital: Starting capital
        
        Returns:
            PerformanceMetrics with all values calculated
        """
        # Implementation here
        pass
    
    def calculate_sharpe_ratio(self, returns: pd.Series) -> float:
        """Calculate annualized Sharpe ratio."""
        pass
    
    def calculate_sortino_ratio(self, returns: pd.Series) -> float:
        """Calculate annualized Sortino ratio (downside only)."""
        pass
    
    def calculate_calmar_ratio(
        self, 
        annualized_return: float, 
        max_drawdown: float
    ) -> float:
        """Calculate Calmar ratio (return / max drawdown)."""
        pass
    
    def calculate_max_drawdown(self, equity_curve: pd.Series) -> float:
        """Calculate maximum peak-to-trough drawdown."""
        pass
    
    def calculate_var(
        self, 
        returns: pd.Series, 
        confidence: float = 0.95
    ) -> float:
        """Calculate Value at Risk."""
        pass
    
    def calculate_cvar(
        self, 
        returns: pd.Series, 
        confidence: float = 0.95
    ) -> float:
        """Calculate Conditional Value at Risk (Expected Shortfall)."""
        pass
```

**Tests Required:**
- [ ] test_sharpe_ratio_positive_returns
- [ ] test_sharpe_ratio_negative_returns
- [ ] test_sharpe_ratio_zero_volatility
- [ ] test_sortino_ratio_no_downside
- [ ] test_max_drawdown_simple_case
- [ ] test_max_drawdown_no_drawdown
- [ ] test_var_calculation
- [ ] test_cvar_greater_than_var
- [ ] test_calculate_all_integration

---

## 🐍 CODEX Task 1.3: InstitutionalBacktester

**File:** `backend/app/services/institutional_backtester.py`

```python
from typing import Any, Dict, Optional
from datetime import datetime
import pandas as pd
from freqtrade.strategy import IStrategy
from backend.app.models.backtest_result import BacktestResult
from backend.app.services.performance_metrics import PerformanceMetricsCalculator


@dataclass
class BacktestConfig:
    """Configuration for backtest run."""
    strategy_name: str
    instruments: List[str]
    start_date: datetime
    end_date: datetime
    initial_capital: float = 100000.0
    timeframe: str = "1h"
    slippage_bps: float = 5.0  # 5 basis points
    commission_bps: float = 10.0  # 10 basis points
    
    # Data splits for validation
    train_ratio: float = 0.6  # 60% for training
    validate_ratio: float = 0.2  # 20% for validation
    test_ratio: float = 0.2  # 20% for testing


class InstitutionalBacktester:
    """
    Professional-grade backtesting engine.
    
    Features:
    - In-sample/out-of-sample split (60/20/20)
    - Realistic slippage and commission modeling
    - Position sizing
    - Walk-forward ready
    """
    
    def __init__(self, config: BacktestConfig):
        """Initialize backtester with configuration."""
        self.config = config
        self.metrics_calculator = PerformanceMetricsCalculator()
    
    async def run_backtest(
        self,
        strategy: IStrategy,
        data: pd.DataFrame
    ) -> BacktestResult:
        """
        Run complete backtest with validation.
        
        Args:
            strategy: FreqTrade-compatible strategy
            data: OHLCV DataFrame
        
        Returns:
            BacktestResult with full metrics
        """
        pass
    
    def _split_data(
        self, 
        data: pd.DataFrame
    ) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """Split data into train/validate/test sets."""
        pass
    
    def _simulate_execution(
        self,
        signal: str,
        price: float,
        size: float
    ) -> tuple[float, float]:
        """
        Simulate realistic execution with slippage.
        
        Returns:
            (executed_price, fees)
        """
        pass
```

**Tests Required:**
- [ ] test_config_validation
- [ ] test_data_split_ratios
- [ ] test_slippage_calculation
- [ ] test_commission_calculation
- [ ] test_backtest_simple_strategy
- [ ] test_backtest_with_trades
- [ ] test_backtest_no_trades
- [ ] test_in_out_sample_metrics

---

## 🐍 CODEX Task 1.4: Backtest API Endpoint

**File:** `backend/app/api/backtest.py`

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/api/backtest", tags=["backtest"])


class BacktestRequest(BaseModel):
    """Request model for backtest."""
    strategy_name: str
    instruments: List[str]
    start_date: datetime
    end_date: datetime
    initial_capital: float = 100000.0
    timeframe: str = "1h"


class BacktestResponse(BaseModel):
    """Response model for backtest."""
    id: str
    strategy_name: str
    final_equity: float
    total_return: float
    sharpe_ratio: float
    max_drawdown: float
    total_trades: int
    win_rate: float
    # ... more fields


@router.post("/run", response_model=BacktestResponse)
async def run_backtest(request: BacktestRequest):
    """Run a backtest for the specified strategy."""
    pass


@router.get("/{backtest_id}", response_model=BacktestResponse)
async def get_backtest_result(backtest_id: str):
    """Get backtest result by ID."""
    pass


@router.get("/{backtest_id}/equity-curve")
async def get_equity_curve(backtest_id: str):
    """Get equity curve data for charting."""
    pass


@router.get("/{backtest_id}/trades")
async def get_trades(backtest_id: str):
    """Get list of trades from backtest."""
    pass
```

**Tests Required:**
- [ ] test_run_backtest_success
- [ ] test_run_backtest_invalid_strategy
- [ ] test_run_backtest_invalid_dates
- [ ] test_get_backtest_result_found
- [ ] test_get_backtest_result_not_found
- [ ] test_get_equity_curve
- [ ] test_get_trades

---

## ⚛️ CLINE Task 1.6: useBacktestResults Hook

**File:** `src/hooks/useBacktestResults.ts`

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

interface BacktestRequest {
  strategyName: string;
  instruments: string[];
  startDate: string;
  endDate: string;
  initialCapital?: number;
  timeframe?: string;
}

interface EquityPoint {
  timestamp: string;
  equity: number;
  drawdown: number;
}

interface PerformanceMetrics {
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  maxDrawdown: number;
  totalTrades: number;
  winRate: number;
  profitFactor: number;
}

interface BacktestResult {
  id: string;
  strategyName: string;
  finalEquity: number;
  equityCurve: EquityPoint[];
  metrics: PerformanceMetrics;
}

export function useBacktestResults(backtestId?: string) {
  // Fetch existing backtest result
}

export function useRunBacktest() {
  // Mutation to run new backtest
}

export function useEquityCurve(backtestId: string) {
  // Fetch equity curve data
}
```

---

## ⚛️ CLINE Task 1.7: EquityCurveChart

**File:** `src/components/strategy/EquityCurveChart.tsx`

- Line chart showing equity over time
- X-axis: Date
- Y-axis: Equity value
- Show drawdown as shaded area below
- Loading skeleton when fetching
- Error state on failure

---

## ⚛️ CLINE Task 1.8: PerformanceMetricsCard

**File:** `src/components/strategy/PerformanceMetricsCard.tsx`

- Grid of key metrics
- Color-coded (green positive, red negative)
- Sharpe, Sortino, Calmar ratios
- Max drawdown, Win rate, Profit factor
- Total return, Annualized return

---

## ✅ Acceptance Criteria

Sprint 1 is complete when:

- [ ] Can call `/api/backtest/run` with strategy config
- [ ] Backtest returns comprehensive metrics
- [ ] EquityCurveChart displays equity curve
- [ ] PerformanceMetricsCard shows all key metrics
- [ ] All backend tests pass (>95% coverage)
- [ ] All frontend components type-check
- [ ] Integration test passes end-to-end
- [ ] User approves and commits

---

## 🚀 Ready to Start!

**CODEX:** Begin with Task 1.1 (BacktestResult model)
**CLINE:** Wait for CODEX to complete + AC review
**AC:** Review as CODEX completes each task

