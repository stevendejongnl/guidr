"""Guide API router."""


from fastapi import APIRouter, Depends, HTTPException, status

from src.application.dtos import GuideCreateDTO, GuideUpdateDTO
from src.application.use_cases.guide import (
    CreateGuide,
    DeleteGuide,
    GetAllGuides,
    GetGuide,
    GetGuidesByCategory,
    UpdateGuide,
)
from src.container import Container
from src.domain.entities import User
from src.domain.exceptions import EntityNotFoundException, ValidationException

from ..dependencies.auth import get_current_user
from ..models import ErrorResponse, GuideCreate, GuideResponse, GuideUpdate

router = APIRouter(prefix="/guides", tags=["guides"])


# Container (injected at app startup)
_container: Container | None = None


def set_container(container: Container) -> None:
    """Set the DI container for this router."""
    global _container
    _container = container


# Dependency providers
def get_create_guide_use_case() -> CreateGuide:
    assert _container is not None, "Container not initialized"
    return _container.create_guide_use_case()


def get_get_guide_use_case() -> GetGuide:
    assert _container is not None, "Container not initialized"
    return _container.get_guide_use_case()


def get_get_all_guides_use_case() -> GetAllGuides:
    assert _container is not None, "Container not initialized"
    return _container.get_all_guides_use_case()


def get_get_guides_by_category_use_case() -> GetGuidesByCategory:
    assert _container is not None, "Container not initialized"
    return _container.get_guides_by_category_use_case()


def get_update_guide_use_case() -> UpdateGuide:
    assert _container is not None, "Container not initialized"
    return _container.update_guide_use_case()


def get_delete_guide_use_case() -> DeleteGuide:
    assert _container is not None, "Container not initialized"
    return _container.delete_guide_use_case()


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
            categoryId=result.category_id,
            title=result.title,
            description=result.description,
            stepIds=result.step_ids,
            createdAt=result.created_at,
            updatedAt=result.updated_at,
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
        categoryId=result.category_id,
        title=result.title,
        description=result.description,
        stepIds=result.step_ids,
        createdAt=result.created_at,
        updatedAt=result.updated_at,
    )


@router.get("", response_model=list[GuideResponse])
async def list_guides(
    category_id: str | None = None,
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
            categoryId=r.category_id,
            title=r.title,
            description=r.description,
            stepIds=r.step_ids,
            createdAt=r.created_at,
            updatedAt=r.updated_at,
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
    current_user: User = Depends(get_current_user),
) -> GuideResponse:
    """Update a guide (partial update)."""
    try:
        dto = GuideUpdateDTO(title=guide.title, description=guide.description)
        result = await use_case.execute(guide_id, dto, current_user)
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Guide not found: {guide_id}",
            )
        return GuideResponse(
            id=result.id,
            categoryId=result.category_id,
            title=result.title,
            description=result.description,
            stepIds=result.step_ids,
            createdAt=result.created_at,
            updatedAt=result.updated_at,
        )
    except EntityNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{guide_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_guide(
    guide_id: str,
    use_case: DeleteGuide = Depends(get_delete_guide_use_case),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete a guide."""
    await use_case.execute(guide_id, current_user)
