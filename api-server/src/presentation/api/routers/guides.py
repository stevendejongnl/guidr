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
from src.domain.exceptions import (
    AuthorizationException,
    EntityNotFoundException,
    ValidationException,
)

from ..dependencies.auth import get_current_user, get_optional_current_user
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


def _guide_response_from_dto(result) -> GuideResponse:  # type: ignore
    """Convert GuideResponseDTO to GuideResponse Pydantic model."""
    return GuideResponse(
        id=result.id,
        categoryId=result.category_id,
        title=result.title,
        description=result.description,
        stepIds=result.step_ids,
        createdByUserId=result.created_by_user_id,
        isPublic=result.is_public,
        isHighlighted=result.is_highlighted,
        createdAt=result.created_at,
        updatedAt=result.updated_at,
    )


@router.post(
    "",
    response_model=GuideResponse,
    status_code=status.HTTP_201_CREATED,
    responses={400: {"model": ErrorResponse}},
)
async def create_guide(
    guide: GuideCreate,
    use_case: CreateGuide = Depends(get_create_guide_use_case),
    current_user: User = Depends(get_current_user),
) -> GuideResponse:
    """Create a new guide."""
    try:
        dto = GuideCreateDTO(
            category_id=guide.category_id,
            title=guide.title,
            description=guide.description,
            is_public=guide.is_public,
        )
        result = await use_case.execute(dto, current_user)  # type: ignore[call-arg]
        return _guide_response_from_dto(result)
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/{guide_id}",
    response_model=GuideResponse,
    responses={403: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def get_guide(
    guide_id: str,
    use_case: GetGuide = Depends(get_get_guide_use_case),
    current_user: User | None = Depends(get_optional_current_user),
) -> GuideResponse:
    """Get a guide by ID (with visibility check)."""
    try:
        result = await use_case.execute(guide_id, current_user)  # type: ignore[call-arg]
    except EntityNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except AuthorizationException as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Guide not found: {guide_id}",
        )
    return _guide_response_from_dto(result)


@router.get("", response_model=list[GuideResponse])
async def list_guides(
    category_id: str | None = None,
    my_guides: bool = False,
    highlighted: bool = False,
    use_case_all: GetAllGuides = Depends(get_get_all_guides_use_case),
    use_case_by_category: GetGuidesByCategory = Depends(
        get_get_guides_by_category_use_case
    ),
    current_user: User | None = Depends(get_optional_current_user),
) -> list[GuideResponse]:
    """List guides (filtered by visibility) with optional category filter."""
    if category_id:
        results = await use_case_by_category.execute(category_id, current_user)  # type: ignore[call-arg]
    else:
        results = await use_case_all.execute(current_user)  # type: ignore[call-arg]

    # Filter by my_guides (requires authenticated user)
    if my_guides:
        if current_user is None:
            results = []
        else:
            results = [
                r for r in results
                if r.created_by_user_id == current_user.id.value
            ]

    # Filter by highlighted
    if highlighted:
        results = [r for r in results if r.is_highlighted]

    return [_guide_response_from_dto(r) for r in results]


@router.patch(
    "/{guide_id}/highlight",
    response_model=GuideResponse,
    responses={
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
async def highlight_guide(
    guide_id: str,
    highlight_data: GuideUpdate,
    use_case: UpdateGuide = Depends(get_update_guide_use_case),
    current_user: User = Depends(get_current_user),
) -> GuideResponse:
    """Highlight/unhighlight a guide (admin only)."""
    try:
        dto = GuideUpdateDTO(
            title=None,
            description=None,
            is_public=None,
            is_highlighted=highlight_data.is_highlighted,
        )
        result = await use_case.execute(guide_id, dto, current_user)
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Guide not found: {guide_id}",
            )
        return _guide_response_from_dto(result)
    except EntityNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except AuthorizationException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch(
    "/{guide_id}",
    response_model=GuideResponse,
    responses={
        400: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
async def update_guide(
    guide_id: str,
    guide: GuideUpdate,
    use_case: UpdateGuide = Depends(get_update_guide_use_case),
    current_user: User = Depends(get_current_user),
) -> GuideResponse:
    """Update a guide (partial update)."""
    try:
        dto = GuideUpdateDTO(
            title=guide.title,
            description=guide.description,
            is_public=guide.is_public,
            is_highlighted=guide.is_highlighted,
        )
        result = await use_case.execute(guide_id, dto, current_user)
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Guide not found: {guide_id}",
            )
        return _guide_response_from_dto(result)
    except EntityNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except AuthorizationException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete(
    "/{guide_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={403: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def delete_guide(
    guide_id: str,
    use_case: DeleteGuide = Depends(get_delete_guide_use_case),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete a guide (owner or admin only)."""
    try:
        await use_case.execute(guide_id, current_user)
    except EntityNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except AuthorizationException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
