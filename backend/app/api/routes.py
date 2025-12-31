"""
API Routes - Combined router for all API endpoints
"""
from fastapi import APIRouter

from . import trading, risk, venues, meme, system, agents

# Create main API router
api_router = APIRouter()

# Include all API sub-routers
api_router.include_router(trading.router)
api_router.include_router(risk.router)
api_router.include_router(venues.router)
api_router.include_router(meme.router)
api_router.include_router(system.router)
api_router.include_router(agents.router)
