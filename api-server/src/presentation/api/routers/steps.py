"""Step API router."""


from fastapi import APIRouter, Depends, HTTPException, status

from src.application.dtos import StepCreateDTO, StepUpdateDTO
from src.application.use_cases.step import (
    CreateStep,
    DeleteStep,
    GetAllSteps,
    GetStep,
    GetStepsByGuide,
    UpdateStep,
)
from src.container import Container
from src.domain.entities import User
from src.domain.exceptions import (
    AuthorizationException,
    EntityNotFoundException,
    ValidationException,
)

from ..dependencies.auth import get_current_user, get_optional_current_user
from ..models import ErrorResponse, StepCreate, StepResponse, StepUpdate

router = APIRouter(prefix="/steps", tags=["steps"])


# Container (injected at app startup)
_container: Container | None = None


def set_container(container: Container) -> None:
    """Set the DI container for this router."""
    global _container
    _container = container


# Dependency providers
def get_create_step_use_case() -> CreateStep:
    assert _container is not None, "Container not initialized"
    return _container.create_step_use_case()


def get_get_step_use_case() -> GetStep:
    assert _container is not None, "Container not initialized"
    return _container.get_step_use_case()


def get_get_all_steps_use_case() -> GetAllSteps:
    assert _container is not None, "Container not initialized"
    return _container.get_all_steps_use_case()


def get_get_steps_by_guide_use_case() -> GetStepsByGuide:
    assert _container is not None, "Container not initialized"
    return _container.get_steps_by_guide_use_case()


def get_update_step_use_case() -> UpdateStep:
    assert _container is not None, "Container not initialized"
    return _container.update_step_use_case()


def get_delete_step_use_case() -> DeleteStep:
    assert _container is not None, "Container not initialized"
    return _container.delete_step_use_case()


@router.post(
    "",
    response_model=StepResponse,
    status_code=status.HTTP_201_CREATED,
    responses={400: {"model": ErrorResponse}, 403: {"model": ErrorResponse}},
)
async def create_step(
    step: StepCreate,
    use_case: CreateStep = Depends(get_create_step_use_case),
    current_user: User = Depends(get_current_user),
) -> StepResponse:
    """Create a new step (guide owner or admin only)."""
    try:
        dto = StepCreateDTO(
            guide_id=step.guide_id,
            order=step.order,
            title=step.title,
            description=step.description,
            duration=step.duration,
        )
        result = await use_case.execute(dto, current_user)
        return StepResponse(
            id=result.id,
            guideId=result.guide_id,
            order=result.order,
            title=result.title,
            description=result.description,
            duration=result.duration,
            createdAt=result.created_at,
            updatedAt=result.updated_at,
        )
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except AuthorizationException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.get(
    "/{step_id}",
    response_model=StepResponse,
    responses={404: {"model": ErrorResponse}},
)
async def get_step(
    step_id: str,
    use_case: GetStep = Depends(get_get_step_use_case),
    current_user: User | None = Depends(get_optional_current_user),
) -> StepResponse:
    """Get a step by ID (respects guide visibility)."""
    result = await use_case.execute(step_id, current_user)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Step not found: {step_id}",
        )
    return StepResponse(
        id=result.id,
        guideId=result.guide_id,
        order=result.order,
        title=result.title,
        description=result.description,
        duration=result.duration,
        createdAt=result.created_at,
        updatedAt=result.updated_at,
    )


@router.get(
    "",
    response_model=list[StepResponse],
    responses={403: {"model": ErrorResponse}},
)
async def list_steps(
    guide_id: str | None = None,
    use_case_all: GetAllSteps = Depends(get_get_all_steps_use_case),
    use_case_by_guide: GetStepsByGuide = Depends(get_get_steps_by_guide_use_case),
    current_user: User | None = Depends(get_optional_current_user),
) -> list[StepResponse]:
    """List steps with optional guide filter (respects guide visibility)."""
    try:
        if guide_id:
            results = await use_case_by_guide.execute(guide_id, current_user)
        else:
            results = await use_case_all.execute()
    except AuthorizationException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

    return [
        StepResponse(
            id=r.id,
            guideId=r.guide_id,
            order=r.order,
            title=r.title,
            description=r.description,
            duration=r.duration,
            createdAt=r.created_at,
            updatedAt=r.updated_at,
        )
        for r in results
    ]


@router.patch(
    "/{step_id}",
    response_model=StepResponse,
    responses={
        400: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
async def update_step(
    step_id: str,
    step: StepUpdate,
    use_case: UpdateStep = Depends(get_update_step_use_case),
    current_user: User = Depends(get_current_user),
) -> StepResponse:
    """Update a step (guide owner or admin only)."""
    try:
        dto = StepUpdateDTO(
            order=step.order,
            title=step.title,
            description=step.description,
            duration=step.duration,
        )
        result = await use_case.execute(step_id, dto, current_user)
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Step not found: {step_id}",
            )
        return StepResponse(
            id=result.id,
            guideId=result.guide_id,
            order=result.order,
            title=result.title,
            description=result.description,
            duration=result.duration,
            createdAt=result.created_at,
            updatedAt=result.updated_at,
        )
    except EntityNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except AuthorizationException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.delete(
    "/{step_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={403: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def delete_step(
    step_id: str,
    use_case: DeleteStep = Depends(get_delete_step_use_case),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete a step (guide owner or admin only)."""
    try:
        await use_case.execute(step_id, current_user)
    except EntityNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except AuthorizationException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
