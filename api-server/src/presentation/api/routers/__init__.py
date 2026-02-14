"""API routers."""

from .audit_logs import router as audit_logs_router
from .config import router as config_router
from .generation import router as generation_router
from .guide_favorites import router as guide_favorites_router
from .guides import router as guides_router
from .sessions import router as sessions_router
from .step_timers import router as step_timers_router
from .steps import router as steps_router
from .system import router as system_router
from .users import router as users_router

__all__ = [
    "audit_logs_router",
    "generation_router",
    "guide_favorites_router",
    "guides_router",
    "steps_router",
    "step_timers_router",
    "sessions_router",
    "users_router",
    "config_router",
    "system_router",
]
