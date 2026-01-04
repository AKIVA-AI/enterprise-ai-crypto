"""
API Routes - Combined router for all API endpoints
"""
from fastapi import APIRouter

from . import trading, risk, venues, meme, system, agents, arbitrage, market, strategies, websocket, screener

# Create main API router
api_router = APIRouter()

# Include all API sub-routers
api_router.include_router(trading.router)
api_router.include_router(risk.router)
api_router.include_router(venues.router)
api_router.include_router(meme.router)
api_router.include_router(system.router)
api_router.include_router(agents.router)
api_router.include_router(arbitrage.router)
api_router.include_router(market.router)
api_router.include_router(strategies.router)
api_router.include_router(screener.router)

# WebSocket router (separate prefix, no auth middleware)
ws_router = websocket.router
