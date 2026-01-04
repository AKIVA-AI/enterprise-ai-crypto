from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class BacktestRequest(BaseModel):
    """Request model for running a backtest."""
    strategy_name: str = Field(..., description="Name of the strategy to backtest")
    instruments: List[str] = Field(..., description="List of trading pairs", min_length=1)
    start_date: datetime = Field(..., description="Backtest start date")
    end_date: datetime = Field(..., description="Backtest end date")
    initial_capital: float = Field(default=100000.0, gt=0, description="Starting capital")
    timeframe: str = Field(default="1h", description="Candle timeframe")
    slippage_bps: float = Field(default=5.0, ge=0, description="Slippage in basis points")
    commission_bps: float = Field(default=10.0, ge=0, description="Commission in basis points")

    @field_validator("end_date")
    @classmethod
    def end_after_start(cls, value: datetime, info):
        start_date = info.data.get("start_date") if info.data else None
        if start_date is not None and value <= start_date:
            raise ValueError("end_date must be after start_date")
        return value

    @field_validator("instruments")
    @classmethod
    def validate_instruments(cls, value: List[str]):
        valid_pairs = ["BTC-USD", "ETH-USD", "SOL-USD", "BTC-USDT", "ETH-USDT"]
        for inst in value:
            if inst not in valid_pairs:
                raise ValueError(f"Invalid instrument: {inst}. Valid: {valid_pairs}")
        return value

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "strategy_name": "RSIMomentumStrategy",
                "instruments": ["BTC-USD"],
                "start_date": "2023-01-01T00:00:00Z",
                "end_date": "2024-01-01T00:00:00Z",
                "initial_capital": 100000.0,
                "timeframe": "1h",
            }
        }
    )


class EquityPointResponse(BaseModel):
    """Single point on equity curve."""
    timestamp: datetime
    equity: float
    drawdown: float
    position_value: float
    cash: float


class TradeResponse(BaseModel):
    """Single trade record."""
    id: str
    timestamp_open: datetime
    timestamp_close: Optional[datetime]
    instrument: str
    side: str
    size: float
    entry_price: float
    exit_price: Optional[float]
    pnl: Optional[float]
    pnl_percent: Optional[float]
    fees: float


class PerformanceMetricsResponse(BaseModel):
    """Performance metrics summary."""
    # Returns
    total_return: float
    annualized_return: float

    # Risk-adjusted ratios
    sharpe_ratio: float
    sortino_ratio: float
    calmar_ratio: float

    # Drawdown
    max_drawdown: float
    max_drawdown_duration_days: int

    # Trade statistics
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    profit_factor: float
    avg_win: float
    avg_loss: float

    # Risk metrics
    volatility: float
    var_95: float
    cvar_95: float


class BacktestSummaryResponse(BaseModel):
    """Summary response for backtest (without full equity curve)."""
    id: str
    strategy_name: str
    status: str  # 'completed', 'failed', 'running'

    # Time info
    start_date: datetime
    end_date: datetime
    created_at: datetime
    execution_time_seconds: float

    # Key results
    initial_capital: float
    final_equity: float
    total_return: float
    total_trades: int

    # Key metrics
    sharpe_ratio: float
    max_drawdown: float
    win_rate: float

    # Validation status
    has_in_sample: bool
    has_out_sample: bool


class BacktestDetailResponse(BaseModel):
    """Full backtest response with all data."""
    id: str
    strategy_name: str
    strategy_config: Dict[str, Any]
    status: str

    # Configuration
    instruments: List[str]
    timeframe: str
    start_date: datetime
    end_date: datetime
    initial_capital: float

    # Results
    final_equity: float

    # Metrics
    metrics: PerformanceMetricsResponse
    in_sample_metrics: Optional[PerformanceMetricsResponse]
    out_sample_metrics: Optional[PerformanceMetricsResponse]
    validation_metrics: Optional[PerformanceMetricsResponse]

    # Metadata
    created_at: datetime
    execution_time_seconds: float


class EquityCurveResponse(BaseModel):
    """Equity curve data for charting."""
    backtest_id: str
    strategy_name: str
    data: List[EquityPointResponse]


class TradesResponse(BaseModel):
    """List of trades from backtest."""
    backtest_id: str
    strategy_name: str
    total_trades: int
    trades: List[TradeResponse]


class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str
    detail: Optional[str] = None
    code: str
