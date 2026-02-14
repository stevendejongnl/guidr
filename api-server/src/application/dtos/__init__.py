"""Application DTOs for external communication."""

from .audit_log_dtos import AuditLogQueryDTO, AuditLogResponseDTO
from .generation_dtos import (
    GeneratedGuideDTO,
    GeneratedStepDTO,
    GenerateGuideDTO,
    GenerateGuideFromUrlDTO,
)
from .guide_dtos import GuideCreateDTO, GuideResponseDTO, GuideUpdateDTO
from .guide_with_steps_dtos import CreateGuideWithStepsDTO, StepInput
from .session_dtos import (
    SessionCreateDTO,
    SessionResponseDTO,
    SessionUpdateDTO,
)
from .step_dtos import StepCreateDTO, StepResponseDTO, StepUpdateDTO
from .step_timer_dtos import (
    ActiveStepTimerResponseDTO,
    StepTimerCreateDTO,
    StepTimerResponseDTO,
)
from .user_dtos import (
    ChangeEmailDTO,
    ChangePasswordDTO,
    DeleteAccountDTO,
    UpdateProfileDTO,
    UserCreateDTO,
    UserLoginDTO,
    UserResponseDTO,
)

__all__ = [
    # Audit Log
    "AuditLogQueryDTO",
    "AuditLogResponseDTO",
    # Generation
    "GenerateGuideDTO",
    "GenerateGuideFromUrlDTO",
    "GeneratedGuideDTO",
    "GeneratedStepDTO",
    # Guide
    "GuideCreateDTO",
    "GuideUpdateDTO",
    "GuideResponseDTO",
    # Guide with Steps
    "CreateGuideWithStepsDTO",
    "StepInput",
    # Step
    "StepCreateDTO",
    "StepUpdateDTO",
    "StepResponseDTO",
    # Session
    "SessionCreateDTO",
    "SessionUpdateDTO",
    "SessionResponseDTO",
    # Step Timer
    "ActiveStepTimerResponseDTO",
    "StepTimerCreateDTO",
    "StepTimerResponseDTO",
    # User
    "ChangeEmailDTO",
    "ChangePasswordDTO",
    "DeleteAccountDTO",
    "UpdateProfileDTO",
    "UserCreateDTO",
    "UserLoginDTO",
    "UserResponseDTO",
]
