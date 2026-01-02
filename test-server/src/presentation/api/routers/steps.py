"""Step API router."""

from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends

from src.domain.exceptions import ValidationException, EntityNotFoundException
from src.application.use_cases.step import (
    CreateStep,
    GetStep,
    GetAllSteps,
    GetStepsByGuide,
    UpdateStep,
    DeleteStep,
)
from src.application.dtos import StepCreateDTO, StepUpdateDTO
from ..models import StepCreate, StepUpdate, StepResponse, ErrorResponse

router = APIRouter(prefix="/steps", tags=["steps"])


# Placeholder dependencies
def get_create_step_use_case() -> CreateStep:
    raise NotImplementedError("DI container not yet implemented")


def get_get_step_use_case() -> GetStep:
    raise NotImplementedError("DI container not yet implemented")


def get_get_all_steps_use_case() -> GetAllSteps:
    raise NotImplementedError("DI container not yet implemented")


def get_get_steps_by_guide_use_case() -> GetStepsByGuide:
    raise NotImplementedError("DI container not yet implemented")


def get_update_step_use_case() -> UpdateStep:
    raise NotImplementedError("DI container not yet implemented")


def get_delete_step_use_case() -> DeleteStep:
    raise NotImplementedError("DI container not yet implemented")


@router.post(
    "",
    response_model=StepResponse,
    status_code=status.HTTP_201_CREATED,
    responses={400: {"model": ErrorResponse}},
)
async def create_step(
    step: StepCreate,
    use_case: CreateStep = Depends(get_create_step_use_case),
) -> StepResponse:
    """Create a new step."""
    try:
        dto = StepCreateDTO(
            guide_id=step.guide_id,
            order=step.order,
            title=step.title,
            description=step.description,
            duration=step.duration,
        )
        result = await use_case.execute(dto)
        return StepResponse(
            id=result.id,
            guide_id=result.guide_id,
            order=result.order,
            title=result.title,
            description=result.description,
            duration=result.duration,
            created_at=result.created_at,
            updated_at=result.updated_at,
        )
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/{step_id}",
    response_model=StepResponse,
    responses={404: {"model": ErrorResponse}},
)
async def get_step(
    step_id: str,
    use_case: GetStep = Depends(get_get_step_use_case),
) -> StepResponse:
    """Get a step by ID."""
    result = await use_case.execute(step_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Step not found: {step_id}",
        )
    return StepResponse(
        id=result.id,
        guide_id=result.guide_id,
        order=result.order,
        title=result.title,
        description=result.description,
        duration=result.duration,
        created_at=result.created_at,
        updated_at=result.updated_at,
    )


@router.get("", response_model=list[StepResponse])
async def list_steps(
    guide_id: Optional[str] = None,
    use_case_all: GetAllSteps = Depends(get_get_all_steps_use_case),
    use_case_by_guide: GetStepsByGuide = Depends(get_get_steps_by_guide_use_case),
) -> list[StepResponse]:
    """List steps with optional guide filter (returns ordered by order field)."""
    if guide_id:
        results = await use_case_by_guide.execute(guide_id)
    else:
        results = await use_case_all.execute()

    return [
        StepResponse(
            id=r.id,
            guide_id=r.guide_id,
            order=r.order,
            title=r.title,
            description=r.description,
            duration=r.duration,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )
        for r in results
    ]


@router.patch(
    "/{step_id}",
    response_model=StepResponse,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def update_step(
    step_id: str,
    step: StepUpdate,
    use_case: UpdateStep = Depends(get_update_step_use_case),
) -> StepResponse:
    """Update a step (partial update)."""
    try:
        dto = StepUpdateDTO(
            order=step.order,
            title=step.title,
            description=step.description,
            duration=step.duration,
        )
        result = await use_case.execute(step_id, dto)
        return StepResponse(
            id=result.id,
            guide_id=result.guide_id,
            order=result.order,
            title=result.title,
            description=result.description,
            duration=result.duration,
            created_at=result.created_at,
            updated_at=result.updated_at,
        )
    except EntityNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{step_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_step(
    step_id: str,
    use_case: DeleteStep = Depends(get_delete_step_use_case),
) -> None:
    """Delete a step."""
    await use_case.execute(step_id)
