"""
Trading Configuration Loader

Loads trading parameters from JSON config files, with support for
environment variable overrides and Supabase dynamic config.
"""

import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

_CONFIG_DIR = Path(__file__).parent.parent.parent / "data" / "config"
_TRADING_CONFIG_PATH = _CONFIG_DIR / "trading_params.json"


class TradingConfig:
    """
    Centralized trading configuration.

    Priority order:
    1. Environment variable overrides (TRADING_*)
    2. Config file (trading_params.json)
    3. Hardcoded defaults (fallback)
    """

    _instance: Optional["TradingConfig"] = None
    _config: Dict[str, Any] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._load()
        return cls._instance

    def _load(self):
        """Load configuration from file."""
        try:
            if _TRADING_CONFIG_PATH.exists():
                with open(_TRADING_CONFIG_PATH) as f:
                    self._config = json.load(f)
                logger.info(f"Loaded trading config from {_TRADING_CONFIG_PATH}")
            else:
                logger.warning(
                    f"Trading config not found at {_TRADING_CONFIG_PATH}, using defaults"
                )
                self._config = {}
        except Exception as e:
            logger.error(f"Failed to load trading config: {e}")
            self._config = {}

    def reload(self):
        """Reload configuration from file."""
        self._load()

    def get(self, section: str, key: str, default: Any = None) -> Any:
        """Get a config value with optional env var override."""
        # Check environment variable first: TRADING_SECTION_KEY
        env_key = f"TRADING_{section.upper()}_{key.upper()}"
        env_val = os.getenv(env_key)
        if env_val is not None:
            # Try to parse as JSON for complex types
            try:
                return json.loads(env_val)
            except (json.JSONDecodeError, ValueError):
                return env_val

        # Then check config file
        section_data = self._config.get(section, {})
        return section_data.get(key, default)

    def get_section(self, section: str) -> Dict[str, Any]:
        """Get an entire config section."""
        return self._config.get(section, {})

    @property
    def signal_strategies(self) -> Dict[str, Any]:
        return self.get_section("signal_strategies")

    @property
    def risk_limits(self) -> Dict[str, Any]:
        return self.get_section("risk_limits")

    @property
    def capital_allocation(self) -> Dict[str, Any]:
        return self.get_section("capital_allocation")


# Singleton instance
trading_config = TradingConfig()
