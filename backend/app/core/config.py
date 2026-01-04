"""
Configuration re-export for backward compatibility.
The canonical configuration is in app.config.
"""
from app.config import settings, Settings, VenueConfig, RiskConfig

__all__ = ["settings", "Settings", "VenueConfig", "RiskConfig"]

