"""
Database connection and utilities for Supabase.
"""
import structlog
from datetime import datetime
from supabase import create_client, Client
from app.config import settings

logger = structlog.get_logger()

_supabase_client: Client | None = None
_db_initialized: bool = False


async def init_db():
    """
    Initialize the database connection.
    Creates Supabase client and validates connection.
    """
    global _db_initialized
    
    try:
        # Get or create the client
        client = get_supabase()
        
        # Validate connection with a simple query
        result = client.table("global_settings").select("id").limit(1).execute()
        
        _db_initialized = True
        logger.info("database_initialized", status="connected")
        
    except Exception as e:
        logger.error("database_initialization_failed", error=str(e))
        raise


async def close_db():
    """
    Close the database connection.
    Cleans up resources on shutdown.
    """
    global _supabase_client, _db_initialized
    
    try:
        # Supabase client doesn't require explicit closing
        # but we reset state for clean restarts
        _supabase_client = None
        _db_initialized = False
        
        logger.info("database_closed")
        
    except Exception as e:
        logger.error("database_close_failed", error=str(e))


def get_supabase() -> Client:
    """Get or create Supabase client."""
    global _supabase_client
    
    if _supabase_client is None:
        if not settings.supabase_url or not settings.supabase_service_role_key:
            raise ValueError("Supabase URL and service role key are required")

        _supabase_client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key
        )
        logger.info("supabase_client_initialized", url=settings.supabase_url)
    
    return _supabase_client


async def audit_log(
    action: str,
    resource_type: str,
    resource_id: str | None = None,
    user_id: str | None = None,
    user_email: str | None = None,
    before_state: dict | None = None,
    after_state: dict | None = None,
    severity: str = "info",
    book_id: str | None = None,
    ip_address: str | None = None
):
    """Log an audit event to the database asynchronously."""
    try:
        # Check kill switch first
        if await is_kill_switch_active():
            logger.warning("audit_log_blocked_kill_switch_active", action=action)
            return

        supabase = get_supabase()
        # Use async execute for non-blocking operation
        import asyncio
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, lambda: supabase.table("audit_events").insert({
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "user_id": user_id,
            "user_email": user_email,
            "before_state": before_state,
            "after_state": after_state,
            "severity": severity,
            "book_id": book_id,
            "ip_address": ip_address
        }).execute())

        logger.info(
            "audit_event_logged",
            action=action,
            resource_type=resource_type,
            resource_id=resource_id
        )
    except Exception as e:
        logger.error("audit_log_failed", error=str(e), action=action)


async def create_alert(
    title: str,
    message: str,
    severity: str = "info",
    source: str = "system",
    metadata: dict | None = None
):
    """Create an alert in the database."""
    try:
        supabase = get_supabase()
        supabase.table("alerts").insert({
            "title": title,
            "message": message,
            "severity": severity,
            "source": source,
            "metadata": metadata or {}
        }).execute()
        
        logger.info(
            "alert_created",
            title=title,
            severity=severity,
            source=source
        )
    except Exception as e:
        logger.error("alert_creation_failed", error=str(e), title=title)


# Kill Switch Implementation
_kill_switch_active = False
_kill_switch_reason = ""
_kill_switch_timestamp = None


async def activate_kill_switch(reason: str, user_id: str = "system") -> bool:
    """
    Activate the kill switch to immediately stop all trading operations.

    Args:
        reason: Reason for activation
        user_id: User ID activating the switch

    Returns:
        True if activated successfully
    """
    global _kill_switch_active, _kill_switch_reason, _kill_switch_timestamp

    try:
        _kill_switch_active = True
        _kill_switch_reason = reason
        _kill_switch_timestamp = datetime.utcnow()

        # Log the activation
        await audit_log(
            action="kill_switch_activated",
            resource_type="system",
            user_id=user_id,
            severity="critical",
            before_state={"active": False},
            after_state={
                "active": True,
                "reason": reason,
                "timestamp": _kill_switch_timestamp.isoformat()
            }
        )

        # Create alert
        await create_alert(
            title="KILL SWITCH ACTIVATED",
            message=f"Trading operations halted: {reason}",
            severity="critical",
            source="system"
        )

        logger.critical("kill_switch_activated", reason=reason, user_id=user_id)
        return True

    except Exception as e:
        logger.error("kill_switch_activation_failed", error=str(e))
        return False


async def deactivate_kill_switch(user_id: str = "system") -> bool:
    """
    Deactivate the kill switch to resume trading operations.

    Args:
        user_id: User ID deactivating the switch

    Returns:
        True if deactivated successfully
    """
    global _kill_switch_active, _kill_switch_reason, _kill_switch_timestamp

    try:
        was_active = _kill_switch_active
        reason = _kill_switch_reason

        _kill_switch_active = False
        _kill_switch_reason = ""
        _kill_switch_timestamp = None

        # Log the deactivation
        await audit_log(
            action="kill_switch_deactivated",
            resource_type="system",
            user_id=user_id,
            severity="warning",
            before_state={"active": was_active, "reason": reason},
            after_state={"active": False}
        )

        # Create alert
        await create_alert(
            title="KILL SWITCH DEACTIVATED",
            message="Trading operations resumed",
            severity="info",
            source="system"
        )

        logger.warning("kill_switch_deactivated", user_id=user_id)
        return True

    except Exception as e:
        logger.error("kill_switch_deactivation_failed", error=str(e))
        return False


async def is_kill_switch_active() -> bool:
    """
    Check if the kill switch is currently active.

    Returns:
        True if kill switch is active
    """
    return _kill_switch_active


async def get_kill_switch_status() -> dict:
    """
    Get detailed kill switch status.

    Returns:
        Dictionary with kill switch status information
    """
    return {
        "active": _kill_switch_active,
        "reason": _kill_switch_reason,
        "timestamp": _kill_switch_timestamp.isoformat() if _kill_switch_timestamp else None,
        "duration_minutes": (
            (datetime.utcnow() - _kill_switch_timestamp).total_seconds() / 60
            if _kill_switch_timestamp else None
        )
    }


async def check_kill_switch_for_trading() -> tuple[bool, str]:
    """
    Check if trading is allowed (kill switch inactive).

    Returns:
        Tuple of (allowed: bool, reason: str)
    """
    if _kill_switch_active:
        return False, f"Kill switch active: {_kill_switch_reason}"

    return True, ""
