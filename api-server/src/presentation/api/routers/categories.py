"""Category API router."""


from fastapi import APIRouter, Depends, HTTPException, status

from src.application.dtos import CategoryCreateDTO, CategoryUpdateDTO
from src.application.use_cases.category import (
    CreateCategory,
    DeleteCategory,
    GetAllCategories,
    GetCategoriesByParent,
    GetCategory,
    UpdateCategory,
)
from src.container import Container
from src.domain.exceptions import EntityNotFoundException, ValidationException

from ..models import CategoryCreate, CategoryResponse, CategoryUpdate, ErrorResponse

router = APIRouter(prefix="/categories", tags=["categories"])


# Container (injected at app startup)
_container: Container | None = None


def set_container(container: Container) -> None:
    """Set the DI container for this router."""
    global _container
    _container = container


# Dependency providers
def get_create_category_use_case() -> CreateCategory:
    """Get CreateCategory use case."""
    assert _container is not None, "Container not initialized"
    return _container.create_category_use_case()


def get_get_category_use_case() -> GetCategory:
    """Get GetCategory use case."""
    assert _container is not None, "Container not initialized"
    return _container.get_category_use_case()


def get_get_all_categories_use_case() -> GetAllCategories:
    """Get GetAllCategories use case."""
    assert _container is not None, "Container not initialized"
    return _container.get_all_categories_use_case()


def get_get_categories_by_parent_use_case() -> GetCategoriesByParent:
    """Get GetCategoriesByParent use case."""
    assert _container is not None, "Container not initialized"
    return _container.get_categories_by_parent_use_case()


def get_update_category_use_case() -> UpdateCategory:
    """Get UpdateCategory use case."""
    assert _container is not None, "Container not initialized"
    return _container.update_category_use_case()


def get_delete_category_use_case() -> DeleteCategory:
    """Get DeleteCategory use case."""
    assert _container is not None, "Container not initialized"
    return _container.delete_category_use_case()


@router.post(
    "",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    responses={400: {"model": ErrorResponse}},
)
async def create_category(
    category: CategoryCreate,
    use_case: CreateCategory = Depends(get_create_category_use_case),
) -> CategoryResponse:
    """Create a new category."""
    try:
        dto = CategoryCreateDTO(name=category.name, parent_id=category.parent_id)
        result = await use_case.execute(dto)
        return CategoryResponse(
            id=result.id,
            name=result.name,
            parentId=result.parent_id,
            createdAt=result.created_at,
            updatedAt=result.updated_at,
        )
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/{category_id}",
    response_model=CategoryResponse,
    responses={404: {"model": ErrorResponse}},
)
async def get_category(
    category_id: str,
    use_case: GetCategory = Depends(get_get_category_use_case),
) -> CategoryResponse:
    """Get a category by ID."""
    result = await use_case.execute(category_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category not found: {category_id}",
        )
    return CategoryResponse(
        id=result.id,
        name=result.name,
        parentId=result.parent_id,
        createdAt=result.created_at,
        updatedAt=result.updated_at,
    )


@router.get("", response_model=list[CategoryResponse])
async def list_categories(
    parent_id: str | None = None,
    use_case_all: GetAllCategories = Depends(get_get_all_categories_use_case),
    use_case_by_parent: GetCategoriesByParent = Depends(
        get_get_categories_by_parent_use_case
    ),
) -> list[CategoryResponse]:
    """List categories with optional parent filter."""
    if parent_id is not None:
        results = await use_case_by_parent.execute(parent_id)
    else:
        results = await use_case_all.execute()

    return [
        CategoryResponse(
            id=r.id,
            name=r.name,
            parentId=r.parent_id,
            createdAt=r.created_at,
            updatedAt=r.updated_at,
        )
        for r in results
    ]


@router.patch(
    "/{category_id}",
    response_model=CategoryResponse,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def update_category(
    category_id: str,
    category: CategoryUpdate,
    use_case: UpdateCategory = Depends(get_update_category_use_case),
) -> CategoryResponse:
    """Update a category (partial update)."""
    try:
        dto = CategoryUpdateDTO(name=category.name)
        result = await use_case.execute(category_id, dto)
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Category not found: {category_id}",
            )
        return CategoryResponse(
            id=result.id,
            name=result.name,
            parentId=result.parent_id,
            createdAt=result.created_at,
            updatedAt=result.updated_at,
        )
    except EntityNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: str,
    use_case: DeleteCategory = Depends(get_delete_category_use_case),
) -> None:
    """Delete a category."""
    await use_case.execute(category_id)
