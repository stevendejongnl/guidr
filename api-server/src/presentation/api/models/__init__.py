"""API models for presentation layer."""

from .audit_log_models import AuditLogResponse
from .config_models import ConfigResponse
from .error_models import ErrorDetail, ErrorResponse
from .generation_models import (
    CreateGuideWithStepsRequest,
    GeneratedGuideResponse,
    GeneratedStepResponse,
    GenerateGuideFromUrlRequest,
    GenerateGuideRequest,
    GuideWithStepsResponse,
)
from .guide_favorite_models import GuideFavoriteListResponse, GuideFavoriteResponse
from .guide_models import CopyGuideRequest, GuideCreate, GuideResponse, GuideUpdate
from .session_models import MoveToStepRequest, PauseSessionRequest, SessionCreate, SessionResponse
from .step_models import StepCreate, StepResponse, StepUpdate
from .step_timer_models import (
    ActiveStepTimerResponse,
    StepTimerResponse,
    StepTimerStart,
)
from .user_models import (
    AdminUpdateUserRequest,
    ChangeEmailRequest,
    ChangePasswordRequest,
    DeleteAccountRequest,
    RefreshTokenRequest,
    Token,
    TokenResponse,
    UpdateProfileRequest,
    UserLogin,
    UserRegister,
    UserResponse,
)

__all__ = [
    # Error models
    "ErrorDetail",
    "ErrorResponse",
    # Audit Log
    "AuditLogResponse",
    # Generation
    "GenerateGuideRequest",
    "GenerateGuideFromUrlRequest",
    "GeneratedStepResponse",
    "GeneratedGuideResponse",
    "CreateGuideWithStepsRequest",
    "GuideWithStepsResponse",
    # Guide
    "CopyGuideRequest",
    "GuideCreate",
    "GuideUpdate",
    "GuideResponse",
    # Guide Favorite
    "GuideFavoriteListResponse",
    "GuideFavoriteResponse",
    # Step
    "StepCreate",
    "StepUpdate",
    "StepResponse",
    # Session
    "SessionCreate",
    "SessionResponse",
    "MoveToStepRequest",
    "PauseSessionRequest",
    # Step Timer
    "ActiveStepTimerResponse",
    "StepTimerStart",
    "StepTimerResponse",
    # User
    "AdminUpdateUserRequest",
    "ChangeEmailRequest",
    "ChangePasswordRequest",
    "DeleteAccountRequest",
    "UpdateProfileRequest",
    "UserRegister",
    "UserLogin",
    "UserResponse",
    "RefreshTokenRequest",
    "Token",
    "TokenResponse",
    # Config
    "ConfigResponse",
]
