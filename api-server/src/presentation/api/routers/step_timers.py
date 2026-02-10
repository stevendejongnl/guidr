"""Step timer API router."""

from fastapi import APIRouter, Depends, HTTPException, status

from src.application.use_cases.step_timer import (
    GetStepTimersByGuide,
    PauseStepTimer,
    ResetStepTimer,
    StartStepTimer,
)
from src.container import Container
from src.domain.entities import User
from src.domain.exceptions import (
    EntityNotFoundException,
    ValidationException,
)

from ..dependencies.auth import get_current_user
from ..models import (
    ErrorResponse,
    StepTimerResponse,
    StepTimerStart,
)

router = APIRouter(prefix="/step-timers", tags=["step-timers"])


# Container (injected at app startup)
_container: Container | None = None


def set_container(container: Container) -> None:
    """Set the DI container for this router."""
    global _container
    _container = container


# Dependency providers
def get_start_step_timer_use_case() -> StartStepTimer:
    assert _container is not None, "Container not initialized"
    return _container.start_step_timer_use_case()


def get_pause_step_timer_use_case() -> PauseStepTimer:
    assert _container is not None, "Container not initialized"
    return _container.pause_step_timer_use_case()


def get_reset_step_timer_use_case() -> ResetStepTimer:
    assert _container is not None, "Container not initialized"
    return _container.reset_step_timer_use_case()


def get_get_step_timers_use_case() -> GetStepTimersByGuide:
    assert _container is not None, "Container not initialized"
    return _container.get_step_timers_by_guide_use_case()


def _to_response(dto) -> StepTimerResponse:
    """Convert a StepTimerResponseDTO to a StepTimerResponse."""
    return StepTimerResponse(
        id=dto.id,
        stepId=dto.step_id,
        guideId=dto.guide_id,
        userId=dto.user_id,
        status=dto.status,
        startedAt=dto.started_at,
        accumulatedSeconds=dto.accumulated_seconds,
        durationSeconds=dto.duration_seconds,
        createdAt=dto.created_at,
        updatedAt=dto.updated_at,
    )


@router.post(
    "/start",
    response_model=StepTimerResponse,
    status_code=status.HTTP_200_OK,
    responses={400: {"model": ErrorResponse}},
)
async def start_timer(
    request: StepTimerStart,
    current_user: User = Depends(get_current_user),
    use_case: StartStepTimer = Depends(
        get_start_step_timer_use_case
    ),
) -> StepTimerResponse:
    """Start or resume a step timer."""
    try:
        result = await use_case.execute(
            step_id=request.step_id,
            guide_id=request.guide_id,
            duration_seconds=request.duration_seconds,
            user_id=current_user.id.value,
        )
        return _to_response(result)
    except ValidationException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post(
    "/{timer_id}/pause",
    response_model=StepTimerResponse,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
async def pause_timer(
    timer_id: str,
    current_user: User = Depends(get_current_user),
    use_case: PauseStepTimer = Depends(
        get_pause_step_timer_use_case
    ),
) -> StepTimerResponse:
    """Pause a running step timer."""
    try:
        result = await use_case.execute(timer_id)
        return _to_response(result)
    except EntityNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except ValidationException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post(
    "/{timer_id}/reset",
    response_model=StepTimerResponse,
    responses={404: {"model": ErrorResponse}},
)
async def reset_timer(
    timer_id: str,
    current_user: User = Depends(get_current_user),
    use_case: ResetStepTimer = Depends(
        get_reset_step_timer_use_case
    ),
) -> StepTimerResponse:
    """Reset a step timer to idle state."""
    try:
        result = await use_case.execute(timer_id)
        return _to_response(result)
    except EntityNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get(
    "",
    response_model=list[StepTimerResponse],
)
async def list_timers(
    guide_id: str,
    current_user: User = Depends(get_current_user),
    use_case: GetStepTimersByGuide = Depends(
        get_get_step_timers_use_case
    ),
) -> list[StepTimerResponse]:
    """Get all timers for a guide (current user)."""
    results = await use_case.execute(
        guide_id=guide_id,
        user_id=current_user.id.value,
    )
    return [_to_response(r) for r in results]
