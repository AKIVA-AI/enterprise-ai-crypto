"""
Logging configuration for the trading platform.

Provides:
- JSON logging in production
- Console logging in development
- Request ID context binding
"""
import logging
import sys
from typing import Any, Dict

import structlog
from structlog.typing import EventDict

from app.config import settings


def configure_logging() -> structlog.BoundLogger:
    """
    Configure structured logging based on environment.
    
    Production: JSON format for log aggregation
    Development: Console format for readability
    """
    
    # Determine if we're in production
    is_production = settings.ENVIRONMENT == "production"
    
    # Common processors
    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.UnicodeDecoder(),
    ]
    
    if is_production:
        # JSON format for production (log aggregation friendly)
        processors = shared_processors + [
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ]
        renderer = structlog.processors.JSONRenderer()
    else:
        # Console format for development (human readable)
        processors = shared_processors + [
            structlog.dev.ConsoleRenderer(colors=True),
        ]
        renderer = structlog.dev.ConsoleRenderer(colors=True)
    
    # Configure structlog
    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(
            logging.INFO if is_production else logging.DEBUG
        ),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )
    
    # Configure standard library logging
    log_level = logging.INFO if is_production else logging.DEBUG
    
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level,
    )
    
    # Silence noisy loggers
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    
    logger = structlog.get_logger()
    logger.info(
        "logging_configured",
        environment=settings.ENVIRONMENT,
        log_level="INFO" if is_production else "DEBUG",
        format="json" if is_production else "console",
    )
    
    return logger

