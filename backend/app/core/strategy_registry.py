"""
Strategy Registry - loads strategy definitions and scanner configuration.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional
from uuid import UUID, uuid4, uuid5, NAMESPACE_URL

import structlog

from app.config import settings

logger = structlog.get_logger()


@dataclass
class StrategyTimeframes:
    fast: str
    medium: str
    slow: str


@dataclass
class StrategyDefinition:
    name: str
    type: str
    enabled: bool = True
    universe: List[str] = field(default_factory=list)
    timeframes: Optional[StrategyTimeframes] = None
    min_confidence: float = 0.6
    max_risk_per_trade: float = 0.01
    expected_holding_minutes: int = 60
    edge_model_inputs: List[str] = field(default_factory=list)
    data_requirements: List[str] = field(default_factory=list)
    venue_routing: List[str] = field(default_factory=list)
    book_type: Optional[str] = None
    book_id: Optional[UUID] = None
    min_edge_bps: Optional[float] = None
    id: UUID = field(default_factory=uuid4)


@dataclass
class ScannerConfig:
    top_k: int = 5
    max_opportunities: int = 50


class StrategyRegistry:
    """Loads strategy definitions from JSON config."""

    def __init__(self, config_path: Optional[Path] = None):
        self.config_path = config_path or (settings.CONFIG_DIR / "strategies.json")
        self._strategies: Dict[str, StrategyDefinition] = {}
        self._scanner_config = ScannerConfig()

    def load(self) -> None:
        if not self.config_path.exists():
            logger.warning("strategy_config_missing", path=str(self.config_path))
            return

        try:
            with open(self.config_path, "r", encoding="utf-8") as handle:
                payload = json.load(handle)

            self._scanner_config = ScannerConfig(**payload.get("scanner", {}))
            self._strategies.clear()

            for raw in payload.get("strategies", []):
                timeframes = None
                if raw.get("timeframes"):
                    timeframes = StrategyTimeframes(**raw["timeframes"])

                strategy_id = raw.get("id")
                if strategy_id:
                    strategy_uuid = UUID(strategy_id)
                else:
                    strategy_uuid = uuid5(NAMESPACE_URL, raw.get("name", "strategy"))

                definition = StrategyDefinition(
                    name=raw.get("name", "unnamed"),
                    type=raw.get("type", "spot"),
                    enabled=raw.get("enabled", True),
                    universe=raw.get("universe", []),
                    timeframes=timeframes,
                    min_confidence=raw.get("min_confidence", 0.6),
                    max_risk_per_trade=raw.get("max_risk_per_trade", 0.01),
                    expected_holding_minutes=raw.get("expected_holding_minutes", 60),
                    edge_model_inputs=raw.get("edge_model_inputs", []),
                    data_requirements=raw.get("data_requirements", []),
                    venue_routing=raw.get("venue_routing", []),
                    book_type=raw.get("book_type"),
                    book_id=UUID(raw["book_id"]) if raw.get("book_id") else None,
                    min_edge_bps=raw.get("min_edge_bps"),
                    id=strategy_uuid,
                )
                self._strategies[definition.name] = definition

            logger.info("strategy_registry_loaded", count=len(self._strategies))
        except Exception as exc:
            logger.error("strategy_registry_load_failed", error=str(exc))

    def get_enabled_strategies(self) -> List[StrategyDefinition]:
        if not self._strategies:
            self.load()
        return [s for s in self._strategies.values() if s.enabled]

    def get_strategy(self, name: str) -> Optional[StrategyDefinition]:
        if not self._strategies:
            self.load()
        return self._strategies.get(name)

    @property
    def scanner_config(self) -> ScannerConfig:
        if not self._strategies:
            self.load()
        return self._scanner_config


strategy_registry = StrategyRegistry()
