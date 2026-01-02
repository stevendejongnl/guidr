"""API routers."""

from .categories import router as categories_router
from .guides import router as guides_router
from .steps import router as steps_router
from .sessions import router as sessions_router
from .users import router as users_router
from .config import router as config_router
from .system import router as system_router

__all__ = [
    "categories_router",
    "guides_router",
    "steps_router",
    "sessions_router",
    "users_router",
    "config_router",
    "system_router",
]
