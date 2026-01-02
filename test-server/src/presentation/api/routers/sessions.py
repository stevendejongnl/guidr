"""Session API router."""

from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends

from src.domain.exceptions import ValidationException, EntityNotFoundException
from src.application.use_cases.session import (
    CreateSession,
    GetSession,
    GetAllSessions,
    GetSessionsByGuide,
    GetSessionsByStatus,
    StartSession,
    PauseSession,
    ResumeSession,
    CompleteSession,
    CancelSession,
    MoveSessionToStep,
    DeleteSession,
)
from src.application.dtos import SessionCreateDTO
from ..models import (
    SessionCreate,
    SessionResponse,
    MoveToStepRequest,
    ErrorResponse,
)

router = APIRouter(prefix="/sessions", tags=["sessions"])


# Placeholder dependencies
def get_create_session_use_case() -> CreateSession:
    raise NotImplementedError("DI container not yet implemented")


def get_get_session_use_case() -> GetSession:
    raise NotImplementedError("DI container not yet implemented")


def get_get_all_sessions_use_case() -> GetAllSessions:
    raise NotImplementedError("DI container not yet implemented")


def get_get_sessions_by_guide_use_case() -> GetSessionsByGuide:
    raise NotImplementedError("DI container not yet implemented")


def get_get_sessions_by_status_use_case() -> GetSessionsByStatus:
    raise NotImplementedError("DI container not yet implemented")


def get_start_session_use_case() -> StartSession:
    raise NotImplementedError("DI container not yet implemented")


def get_pause_session_use_case() -> PauseSession:
    raise NotImplementedError("DI container not yet implemented")


def get_resume_session_use_case() -> ResumeSession:
    raise NotImplementedError("DI container not yet implemented")


def get_complete_session_use_case() -> CompleteSession:
    raise NotImplementedError("DI container not yet implemented")


def get_cancel_session_use_case() -> CancelSession:
    raise NotImplementedError("DI container not yet implemented")


def get_move_session_to_step_use_case() -> MoveSessionToStep:
    raise NotImplementedError("DI container not yet implemented")


def get_delete_session_use_case() -> DeleteSession:
    raise NotImplementedError("DI container not yet implemented")


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
            guide_id=result.guide_id,
            status=result.status,
            started_at=result.started_at,
            completed_at=result.completed_at,
            current_step_id=result.current_step_id,
            created_at=result.created_at,
            updated_at=result.updated_at,
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
        guide_id=result.guide_id,
        status=result.status,
        started_at=result.started_at,
        completed_at=result.completed_at,
        current_step_id=result.current_step_id,
        created_at=result.created_at,
        updated_at=result.updated_at,
    )


@router.get("", response_model=list[SessionResponse])
async def list_sessions(
    guide_id: Optional[str] = None,
    status_filter: Optional[str] = None,
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
            guide_id=r.guide_id,
            status=r.status,
            started_at=r.started_at,
            completed_at=r.completed_at,
            current_step_id=r.current_step_id,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )
        for r in results
    ]


# RESTful action endpoints for state transitions
@router.post(
    "/{session_id}/start",
    response_model=SessionResponse,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def start_session(
    session_id: str,
    use_case: StartSession = Depends(get_start_session_use_case),
) -> SessionResponse:
    """Start a session."""
    try:
        result = await use_case.execute(session_id)
        return SessionResponse(
            id=result.id,
            guide_id=result.guide_id,
            status=result.status,
            started_at=result.started_at,
            completed_at=result.completed_at,
            current_step_id=result.current_step_id,
            created_at=result.created_at,
            updated_at=result.updated_at,
        )
    except EntityNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post(
    "/{session_id}/pause",
    response_model=SessionResponse,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def pause_session(
    session_id: str,
    use_case: PauseSession = Depends(get_pause_session_use_case),
) -> SessionResponse:
    """Pause a session."""
    try:
        result = await use_case.execute(session_id)
        return SessionResponse(
            id=result.id,
            guide_id=result.guide_id,
            status=result.status,
            started_at=result.started_at,
            completed_at=result.completed_at,
            current_step_id=result.current_step_id,
            created_at=result.created_at,
            updated_at=result.updated_at,
        )
    except EntityNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post(
    "/{session_id}/resume",
    response_model=SessionResponse,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def resume_session(
    session_id: str,
    use_case: ResumeSession = Depends(get_resume_session_use_case),
) -> SessionResponse:
    """Resume a session."""
    try:
        result = await use_case.execute(session_id)
        return SessionResponse(
            id=result.id,
            guide_id=result.guide_id,
            status=result.status,
            started_at=result.started_at,
            completed_at=result.completed_at,
            current_step_id=result.current_step_id,
            created_at=result.created_at,
            updated_at=result.updated_at,
        )
    except EntityNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post(
    "/{session_id}/complete",
    response_model=SessionResponse,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def complete_session(
    session_id: str,
    use_case: CompleteSession = Depends(get_complete_session_use_case),
) -> SessionResponse:
    """Complete a session."""
    try:
        result = await use_case.execute(session_id)
        return SessionResponse(
            id=result.id,
            guide_id=result.guide_id,
            status=result.status,
            started_at=result.started_at,
            completed_at=result.completed_at,
            current_step_id=result.current_step_id,
            created_at=result.created_at,
            updated_at=result.updated_at,
        )
    except EntityNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post(
    "/{session_id}/cancel",
    response_model=SessionResponse,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def cancel_session(
    session_id: str,
    use_case: CancelSession = Depends(get_cancel_session_use_case),
) -> SessionResponse:
    """Cancel a session."""
    try:
        result = await use_case.execute(session_id)
        return SessionResponse(
            id=result.id,
            guide_id=result.guide_id,
            status=result.status,
            started_at=result.started_at,
            completed_at=result.completed_at,
            current_step_id=result.current_step_id,
            created_at=result.created_at,
            updated_at=result.updated_at,
        )
    except EntityNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post(
    "/{session_id}/move-to-step",
    response_model=SessionResponse,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def move_to_step(
    session_id: str,
    request: MoveToStepRequest,
    use_case: MoveSessionToStep = Depends(get_move_session_to_step_use_case),
) -> SessionResponse:
    """Move session to a specific step."""
    try:
        result = await use_case.execute(session_id, request.step_id)
        return SessionResponse(
            id=result.id,
            guide_id=result.guide_id,
            status=result.status,
            started_at=result.started_at,
            completed_at=result.completed_at,
            current_step_id=result.current_step_id,
            created_at=result.created_at,
            updated_at=result.updated_at,
        )
    except EntityNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: str,
    use_case: DeleteSession = Depends(get_delete_session_use_case),
) -> None:
    """Delete a session."""
    await use_case.execute(session_id)
