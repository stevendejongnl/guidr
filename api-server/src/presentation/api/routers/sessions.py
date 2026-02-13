"""Session API router."""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status

from src.application.dtos import SessionCreateDTO
from src.application.use_cases.session import (
    CancelSession,
    CompleteSession,
    CreateSession,
    DeleteSession,
    GetAllSessions,
    GetSession,
    GetSessionsByGuide,
    GetSessionsByStatus,
    MoveSessionToStep,
    PauseSession,
    ResumeSession,
    StartSession,
)
from src.container import Container
from src.domain.entities import User
from src.domain.events.session_events import (
    SessionCancelled,
    SessionCompleted,
    SessionPaused,
    SessionResumed,
    SessionStarted,
    SessionStepChanged,
)
from src.domain.exceptions import EntityNotFoundException, ValidationException
from src.domain.services.event_bus import IEventBus

from ..dependencies.auth import get_current_user
from ..models import (
    ErrorResponse,
    MoveToStepRequest,
    PauseSessionRequest,
    SessionCreate,
    SessionResponse,
)

router = APIRouter(prefix="/sessions", tags=["sessions"])


# Container (injected at app startup)
_container: Container | None = None


def set_container(container: Container) -> None:
    """Set the DI container for this router."""
    global _container
    _container = container


# Dependency providers
def get_create_session_use_case() -> CreateSession:
    assert _container is not None, "Container not initialized"
    return _container.create_session_use_case()


def get_get_session_use_case() -> GetSession:
    assert _container is not None, "Container not initialized"
    return _container.get_session_use_case()


def get_get_all_sessions_use_case() -> GetAllSessions:
    assert _container is not None, "Container not initialized"
    return _container.get_all_sessions_use_case()


def get_get_sessions_by_guide_use_case() -> GetSessionsByGuide:
    assert _container is not None, "Container not initialized"
    return _container.get_sessions_by_guide_use_case()


def get_get_sessions_by_status_use_case() -> GetSessionsByStatus:
    assert _container is not None, "Container not initialized"
    return _container.get_sessions_by_status_use_case()


def get_start_session_use_case() -> StartSession:
    assert _container is not None, "Container not initialized"
    return _container.start_session_use_case()


def get_pause_session_use_case() -> PauseSession:
    assert _container is not None, "Container not initialized"
    return _container.pause_session_use_case()


def get_resume_session_use_case() -> ResumeSession:
    assert _container is not None, "Container not initialized"
    return _container.resume_session_use_case()


def get_complete_session_use_case() -> CompleteSession:
    assert _container is not None, "Container not initialized"
    return _container.complete_session_use_case()


def get_cancel_session_use_case() -> CancelSession:
    assert _container is not None, "Container not initialized"
    return _container.cancel_session_use_case()


def get_move_session_to_step_use_case() -> MoveSessionToStep:
    assert _container is not None, "Container not initialized"
    return _container.move_session_to_step_use_case()


def get_delete_session_use_case() -> DeleteSession:
    assert _container is not None, "Container not initialized"
    return _container.delete_session_use_case()


def get_event_bus() -> IEventBus:
    assert _container is not None, "Container not initialized"
    return _container.event_bus()


@router.post(
    "",
    response_model=SessionResponse,
    status_code=status.HTTP_201_CREATED,
    responses={400: {"model": ErrorResponse}},
)
async def create_session(
    session: SessionCreate,
    use_case: CreateSession = Depends(get_create_session_use_case),
) -> SessionResponse:
    """Create a new session."""
    try:
        dto = SessionCreateDTO(guide_id=session.guide_id)
        result = await use_case.execute(dto)
        return SessionResponse(
            id=result.id,
            guideId=result.guide_id,
            status=result.status,
            startedAt=result.started_at,
            completedAt=result.completed_at,
            currentStepId=result.current_step_id,
            stepElapsedSeconds=result.step_elapsed_seconds,
            createdAt=result.created_at,
            updatedAt=result.updated_at,
        )
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/{session_id}",
    response_model=SessionResponse,
    responses={404: {"model": ErrorResponse}},
)
async def get_session(
    session_id: str,
    use_case: GetSession = Depends(get_get_session_use_case),
) -> SessionResponse:
    """Get a session by ID."""
    result = await use_case.execute(session_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session not found: {session_id}",
        )
    return SessionResponse(
        id=result.id,
        guideId=result.guide_id,
        status=result.status,
        startedAt=result.started_at,
        completedAt=result.completed_at,
        currentStepId=result.current_step_id,
        createdAt=result.created_at,
        updatedAt=result.updated_at,
    )


@router.get("", response_model=list[SessionResponse])
async def list_sessions(
    guide_id: str | None = None,
    status_filter: str | None = None,
    use_case_all: GetAllSessions = Depends(get_get_all_sessions_use_case),
    use_case_by_guide: GetSessionsByGuide = Depends(get_get_sessions_by_guide_use_case),
    use_case_by_status: GetSessionsByStatus = Depends(
        get_get_sessions_by_status_use_case
    ),
) -> list[SessionResponse]:
    """List sessions with optional guide or status filter."""
    if guide_id:
        results = await use_case_by_guide.execute(guide_id)
    elif status_filter:
        results = await use_case_by_status.execute(status_filter)
    else:
        results = await use_case_all.execute()

    return [
        SessionResponse(
            id=r.id,
            guideId=r.guide_id,
            status=r.status,
            startedAt=r.started_at,
            completedAt=r.completed_at,
            currentStepId=r.current_step_id,
            stepElapsedSeconds=r.step_elapsed_seconds,
            createdAt=r.created_at,
            updatedAt=r.updated_at,
        )
        for r in results
    ]


# RESTful action endpoints for state transitions
@router.post(
    "/{session_id}/start",
    response_model=SessionResponse,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
async def start_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    use_case: StartSession = Depends(get_start_session_use_case),
    event_bus: IEventBus = Depends(get_event_bus),
) -> SessionResponse:
    """Start a session."""
    try:
        result = await use_case.execute(session_id)
        await event_bus.publish(
            SessionStarted(
                session_id=result.id,
                guide_id=result.guide_id,
                started_at=result.started_at or "",
                user_id=current_user.id.value,
            )
        )
        return SessionResponse(
            id=result.id,
            guideId=result.guide_id,
            status=result.status,
            startedAt=result.started_at,
            completedAt=result.completed_at,
            currentStepId=result.current_step_id,
            stepElapsedSeconds=result.step_elapsed_seconds,
            createdAt=result.created_at,
            updatedAt=result.updated_at,
        )
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
    "/{session_id}/pause",
    response_model=SessionResponse,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
async def pause_session(
    session_id: str,
    request: PauseSessionRequest,
    current_user: User = Depends(get_current_user),
    use_case: PauseSession = Depends(get_pause_session_use_case),
    event_bus: IEventBus = Depends(get_event_bus),
) -> SessionResponse:
    """Pause a session."""
    try:
        result = await use_case.execute(
            session_id, request.step_elapsed_seconds
        )
        await event_bus.publish(
            SessionPaused(
                session_id=result.id,
                user_id=current_user.id.value,
            )
        )
        return SessionResponse(
            id=result.id,
            guideId=result.guide_id,
            status=result.status,
            startedAt=result.started_at,
            completedAt=result.completed_at,
            currentStepId=result.current_step_id,
            stepElapsedSeconds=result.step_elapsed_seconds,
            createdAt=result.created_at,
            updatedAt=result.updated_at,
        )
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
    "/{session_id}/resume",
    response_model=SessionResponse,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
async def resume_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    use_case: ResumeSession = Depends(get_resume_session_use_case),
    event_bus: IEventBus = Depends(get_event_bus),
) -> SessionResponse:
    """Resume a session."""
    try:
        result = await use_case.execute(session_id)
        await event_bus.publish(
            SessionResumed(
                session_id=result.id,
                user_id=current_user.id.value,
            )
        )
        return SessionResponse(
            id=result.id,
            guideId=result.guide_id,
            status=result.status,
            startedAt=result.started_at,
            completedAt=result.completed_at,
            currentStepId=result.current_step_id,
            stepElapsedSeconds=result.step_elapsed_seconds,
            createdAt=result.created_at,
            updatedAt=result.updated_at,
        )
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
    "/{session_id}/complete",
    response_model=SessionResponse,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
async def complete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    use_case: CompleteSession = Depends(get_complete_session_use_case),
    event_bus: IEventBus = Depends(get_event_bus),
) -> SessionResponse:
    """Complete a session."""
    try:
        result = await use_case.execute(session_id)
        await event_bus.publish(
            SessionCompleted(
                session_id=result.id,
                completed_at=result.completed_at or "",
                user_id=current_user.id.value,
            )
        )
        return SessionResponse(
            id=result.id,
            guideId=result.guide_id,
            status=result.status,
            startedAt=result.started_at,
            completedAt=result.completed_at,
            currentStepId=result.current_step_id,
            stepElapsedSeconds=result.step_elapsed_seconds,
            createdAt=result.created_at,
            updatedAt=result.updated_at,
        )
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
    "/{session_id}/cancel",
    response_model=SessionResponse,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
async def cancel_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    use_case: CancelSession = Depends(get_cancel_session_use_case),
    event_bus: IEventBus = Depends(get_event_bus),
) -> SessionResponse:
    """Cancel a session."""
    try:
        result = await use_case.execute(session_id)
        await event_bus.publish(
            SessionCancelled(
                session_id=result.id,
                cancelled_at=(
                    result.completed_at
                    or datetime.now(UTC).isoformat()
                ),
                user_id=current_user.id.value,
            )
        )
        return SessionResponse(
            id=result.id,
            guideId=result.guide_id,
            status=result.status,
            startedAt=result.started_at,
            completedAt=result.completed_at,
            currentStepId=result.current_step_id,
            stepElapsedSeconds=result.step_elapsed_seconds,
            createdAt=result.created_at,
            updatedAt=result.updated_at,
        )
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
    "/{session_id}/move-to-step",
    response_model=SessionResponse,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
async def move_to_step(
    session_id: str,
    request: MoveToStepRequest,
    current_user: User = Depends(get_current_user),
    use_case: MoveSessionToStep = Depends(
        get_move_session_to_step_use_case
    ),
    event_bus: IEventBus = Depends(get_event_bus),
) -> SessionResponse:
    """Move session to a specific step."""
    try:
        # Get current step before move for event
        prev_step_id = None
        result = await use_case.execute(
            session_id, request.step_id
        )
        await event_bus.publish(
            SessionStepChanged(
                session_id=result.id,
                previous_step_id=prev_step_id,
                current_step_id=request.step_id,
                user_id=current_user.id.value,
            )
        )
        return SessionResponse(
            id=result.id,
            guideId=result.guide_id,
            status=result.status,
            startedAt=result.started_at,
            completedAt=result.completed_at,
            currentStepId=result.current_step_id,
            stepElapsedSeconds=result.step_elapsed_seconds,
            createdAt=result.created_at,
            updatedAt=result.updated_at,
        )
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


@router.delete(
    "/{session_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_session(
    session_id: str,
    use_case: DeleteSession = Depends(
        get_delete_session_use_case
    ),
) -> None:
    """Delete a session."""
    await use_case.execute(session_id)
