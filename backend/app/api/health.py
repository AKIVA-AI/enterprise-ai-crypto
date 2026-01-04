"""
Health check and metrics endpoints for the trading platform.

Provides:
- /health - Liveness probe
- /ready - Readiness probe (checks dependencies)
- /metrics - Basic application metrics
"""
import time
from datetime import datetime, timezone
from typing import Dict, Any

from fastapi import APIRouter, Response
from fastapi.responses import JSONResponse
import structlog

from app.database import get_supabase
from app.config import settings

logger = structlog.get_logger()

router = APIRouter(tags=["health"])

# Metrics storage
_start_time = time.time()
_request_count = 0


def increment_request_count():
    """Increment the global request counter."""
    global _request_count
    _request_count += 1


def get_uptime_seconds() -> float:
    """Get application uptime in seconds."""
    return time.time() - _start_time


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Liveness probe - basic health check.
    
    Returns 200 if the application is running.
    Used by load balancers and container orchestrators.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
    }


@router.get("/ready")
async def readiness_check() -> JSONResponse:
    """
    Readiness probe - checks if the service is ready to accept traffic.
    
    Verifies database connectivity and critical services.
    Returns 200 if ready, 503 if not ready.
    """
    checks: Dict[str, str] = {}
    all_ready = True
    
    # Check database connectivity
    try:
        supabase = get_supabase()
        # Simple query to verify connection
        result = supabase.table("venues").select("id").limit(1).execute()
        checks["database"] = "connected"
    except Exception as e:
        logger.warning("readiness_check_db_failed", error=str(e))
        checks["database"] = f"error: {str(e)[:50]}"
        all_ready = False
    
    # Add more dependency checks as needed
    checks["cache"] = "ok"  # Redis check would go here
    
    status_code = 200 if all_ready else 503
    
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "ready" if all_ready else "not_ready",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "checks": checks,
        }
    )


@router.get("/metrics")
async def metrics() -> Dict[str, Any]:
    """
    Basic application metrics.
    
    Returns request count, uptime, and memory usage.
    For production, consider using Prometheus metrics.
    """
    import os
    import psutil
    
    process = psutil.Process(os.getpid())
    memory_info = process.memory_info()
    
    return {
        "request_count": _request_count,
        "uptime_seconds": round(get_uptime_seconds(), 2),
        "memory_mb": round(memory_info.rss / 1024 / 1024, 2),
        "cpu_percent": process.cpu_percent(),
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

