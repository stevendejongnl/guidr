"""Guide API router."""

from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends

from src.domain.exceptions import ValidationException, EntityNotFoundException
from src.application.use_cases.guide import (
    CreateGuide,
    GetGuide,
    GetAllGuides,
    GetGuidesByCategory,
    UpdateGuide,
    DeleteGuide,
)
from src.application.dtos import GuideCreateDTO, GuideUpdateDTO
from ..models import GuideCreate, GuideUpdate, GuideResponse, ErrorResponse

router = APIRouter(prefix="/guides", tags=["guides"])


# Placeholder dependencies
def get_create_guide_use_case() -> CreateGuide:
    raise NotImplementedError("DI container not yet implemented")


def get_get_guide_use_case() -> GetGuide:
    raise NotImplementedError("DI container not yet implemented")


def get_get_all_guides_use_case() -> GetAllGuides:
    raise NotImplementedError("DI container not yet implemented")


def get_get_guides_by_category_use_case() -> GetGuidesByCategory:
    raise NotImplementedError("DI container not yet implemented")


def get_update_guide_use_case() -> UpdateGuide:
    raise NotImplementedError("DI container not yet implemented")


def get_delete_guide_use_case() -> DeleteGuide:
    raise NotImplementedError("DI container not yet implemented")


@router.post(
    "",
    response_model=GuideResponse,
    status_code=status.HTTP_201_CREATED,
    responses={400: {"model": ErrorResponse}},
)
async def create_guide(
    guide: GuideCreate,
    use_case: CreateGuide = Depends(get_create_guide_use_case),
) -> GuideResponse:
    """Create a new guide."""
    try:
        dto = GuideCreateDTO(
            category_id=guide.category_id,
            title=guide.title,
            description=guide.description,
        )
        result = await use_case.execute(dto)
        return GuideResponse(
            id=result.id,
            category_id=result.category_id,
            title=result.title,
            description=result.description,
            step_ids=result.step_ids,
            created_at=result.created_at,
            updated_at=result.updated_at,
        )
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/{guide_id}",
    response_model=GuideResponse,
    responses={404: {"model": ErrorResponse}},
)
async def get_guide(
    guide_id: str,
    use_case: GetGuide = Depends(get_get_guide_use_case),
) -> GuideResponse:
    """Get a guide by ID."""
    result = await use_case.execute(guide_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Guide not found: {guide_id}",
        )
    return GuideResponse(
        id=result.id,
        category_id=result.category_id,
        title=result.title,
        description=result.description,
        step_ids=result.step_ids,
        created_at=result.created_at,
        updated_at=result.updated_at,
    )


@router.get("", response_model=list[GuideResponse])
async def list_guides(
    category_id: Optional[str] = None,
    use_case_all: GetAllGuides = Depends(get_get_all_guides_use_case),
    use_case_by_category: GetGuidesByCategory = Depends(
        get_get_guides_by_category_use_case
    ),
) -> list[GuideResponse]:
    """List guides with optional category filter."""
    if category_id:
        results = await use_case_by_category.execute(category_id)
    else:
        results = await use_case_all.execute()

    return [
        GuideResponse(
            id=r.id,
            category_id=r.category_id,
            title=r.title,
            description=r.description,
            step_ids=r.step_ids,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )
        for r in results
    ]


@router.patch(
    "/{guide_id}",
    response_model=GuideResponse,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def update_guide(
    guide_id: str,
    guide: GuideUpdate,
    use_case: UpdateGuide = Depends(get_update_guide_use_case),
) -> GuideResponse:
    """Update a guide (partial update)."""
    try:
        dto = GuideUpdateDTO(title=guide.title, description=guide.description)
        result = await use_case.execute(guide_id, dto)
        return GuideResponse(
            id=result.id,
            category_id=result.category_id,
            title=result.title,
            description=result.description,
            step_ids=result.step_ids,
            created_at=result.created_at,
            updated_at=result.updated_at,
        )
    except EntityNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{guide_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_guide(
    guide_id: str,
    use_case: DeleteGuide = Depends(get_delete_guide_use_case),
) -> None:
    """Delete a guide."""
    await use_case.execute(guide_id)
