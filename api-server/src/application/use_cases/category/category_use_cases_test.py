"""Tests for Category use cases."""

from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from src.application.dtos import CategoryCreateDTO, CategoryUpdateDTO
from src.application.use_cases.category import (
    CreateCategory,
    DeleteCategory,
    GetAllCategories,
    GetCategoriesByParent,
    GetCategory,
    UpdateCategory,
)
from src.domain.entities import Category, User
from src.domain.exceptions import (
    AuthorizationException,
    EntityNotFoundException,
    ValidationException,
)
from src.domain.value_objects import Email, EntityId


@pytest.fixture
def mock_category_repository():
    """Create mock category repository."""
    return AsyncMock()


@pytest.fixture
def sample_category():
    """Create a sample category."""
    return Category(
        id=EntityId(str(uuid4())),
        name="Test Category",
    )


@pytest.fixture
def admin_user():
    """Create an admin user."""
    return User(
        id=EntityId(str(uuid4())),
        email=Email("admin@example.com"),
        password_hash="$argon2id$v=19$m=65536,t=3,p=4$...",
        is_admin=True,
    )


@pytest.fixture
def non_admin_user():
    """Create a non-admin user."""
    return User(
        id=EntityId(str(uuid4())),
        email=Email("user@example.com"),
        password_hash="$argon2id$v=19$m=65536,t=3,p=4$...",
        is_admin=False,
    )


class TestCreateCategory:
    """Tests for CreateCategory use case."""

    async def test_create_category_success(self, mock_category_repository):
        """Test successful category creation."""
        use_case = CreateCategory(mock_category_repository)
        dto = CategoryCreateDTO(name="New Category")

        result = await use_case.execute(dto)

        assert result.name == "New Category"
        assert result.parent_id is None
        assert result.id is not None
        mock_category_repository.save.assert_called_once()

    async def test_create_category_with_parent(
        self, mock_category_repository, sample_category
    ):
        """Test creating category with valid parent."""
        mock_category_repository.find_by_id.return_value = sample_category
        use_case = CreateCategory(mock_category_repository)
        dto = CategoryCreateDTO(
            name="Child Category",
            parent_id=sample_category.id.value,
        )

        result = await use_case.execute(dto)

        assert result.name == "Child Category"
        assert result.parent_id == sample_category.id.value
        mock_category_repository.find_by_id.assert_called_once()
        mock_category_repository.save.assert_called_once()

    async def test_create_category_with_invalid_parent(self, mock_category_repository):
        """Test creating category with non-existent parent."""
        mock_category_repository.find_by_id.return_value = None
        use_case = CreateCategory(mock_category_repository)
        dto = CategoryCreateDTO(
            name="Child Category",
            parent_id=str(uuid4()),
        )

        with pytest.raises(ValidationException, match="Parent category not found"):
            await use_case.execute(dto)


class TestGetCategory:
    """Tests for GetCategory use case."""

    async def test_get_category_success(
        self, mock_category_repository, sample_category
    ):
        """Test getting existing category."""
        mock_category_repository.find_by_id.return_value = sample_category
        use_case = GetCategory(mock_category_repository)

        result = await use_case.execute(sample_category.id.value)

        assert result is not None
        assert result.id == sample_category.id.value
        assert result.name == sample_category.name
        mock_category_repository.find_by_id.assert_called_once()

    async def test_get_category_not_found(self, mock_category_repository):
        """Test getting non-existent category."""
        mock_category_repository.find_by_id.return_value = None
        use_case = GetCategory(mock_category_repository)

        result = await use_case.execute(str(uuid4()))

        assert result is None
        mock_category_repository.find_by_id.assert_called_once()


class TestGetAllCategories:
    """Tests for GetAllCategories use case."""

    async def test_get_all_categories(
        self, mock_category_repository, sample_category
    ):
        """Test getting all categories."""
        mock_category_repository.find_all.return_value = [sample_category]
        use_case = GetAllCategories(mock_category_repository)

        result = await use_case.execute()

        assert len(result) == 1
        assert result[0].id == sample_category.id.value
        mock_category_repository.find_all.assert_called_once()

    async def test_get_all_categories_empty(self, mock_category_repository):
        """Test getting all categories when none exist."""
        mock_category_repository.find_all.return_value = []
        use_case = GetAllCategories(mock_category_repository)

        result = await use_case.execute()

        assert len(result) == 0
        mock_category_repository.find_all.assert_called_once()


class TestGetCategoriesByParent:
    """Tests for GetCategoriesByParent use case."""

    async def test_get_categories_by_parent(
        self, mock_category_repository, sample_category
    ):
        """Test getting categories by parent ID."""
        parent_id = str(uuid4())
        child = Category(
            id=EntityId(str(uuid4())),
            name="Child",
            parent_id=EntityId(parent_id),
        )
        mock_category_repository.find_by_parent_id.return_value = [child]
        use_case = GetCategoriesByParent(mock_category_repository)

        result = await use_case.execute(parent_id)

        assert len(result) == 1
        assert result[0].parent_id == parent_id
        mock_category_repository.find_by_parent_id.assert_called_once()

    async def test_get_root_categories(self, mock_category_repository, sample_category):
        """Test getting root categories (parent_id=None)."""
        mock_category_repository.find_by_parent_id.return_value = [sample_category]
        use_case = GetCategoriesByParent(mock_category_repository)

        result = await use_case.execute(None)

        assert len(result) == 1
        mock_category_repository.find_by_parent_id.assert_called_once()


class TestUpdateCategory:
    """Tests for UpdateCategory use case."""

    async def test_update_category_name(
        self, mock_category_repository, sample_category, admin_user
    ):
        """Test updating category name by admin."""
        mock_category_repository.find_by_id.return_value = sample_category
        use_case = UpdateCategory(mock_category_repository)
        dto = CategoryUpdateDTO(name="Updated Name")

        result = await use_case.execute(sample_category.id.value, dto, admin_user)

        assert result.name == "Updated Name"
        mock_category_repository.save.assert_called_once()

    async def test_update_category_not_found(self, mock_category_repository, admin_user):
        """Test updating non-existent category."""
        mock_category_repository.find_by_id.return_value = None
        use_case = UpdateCategory(mock_category_repository)
        dto = CategoryUpdateDTO(name="Updated Name")

        with pytest.raises(EntityNotFoundException, match="Category not found"):
            await use_case.execute(str(uuid4()), dto, admin_user)

    async def test_update_category_non_admin_rejected(
        self, mock_category_repository, sample_category, non_admin_user
    ):
        """Test updating category is rejected for non-admin users."""
        mock_category_repository.find_by_id.return_value = sample_category
        use_case = UpdateCategory(mock_category_repository)
        dto = CategoryUpdateDTO(name="Updated Name")

        with pytest.raises(AuthorizationException, match="Admin privileges required"):
            await use_case.execute(sample_category.id.value, dto, non_admin_user)


class TestDeleteCategory:
    """Tests for DeleteCategory use case."""

    async def test_delete_category(self, mock_category_repository, admin_user):
        """Test deleting a category by admin."""
        use_case = DeleteCategory(mock_category_repository)
        category_id = str(uuid4())

        await use_case.execute(category_id, admin_user)

        mock_category_repository.delete.assert_called_once()

    async def test_delete_category_non_admin_rejected(
        self, mock_category_repository, non_admin_user
    ):
        """Test deleting category is rejected for non-admin users."""
        use_case = DeleteCategory(mock_category_repository)
        category_id = str(uuid4())

        with pytest.raises(AuthorizationException, match="Admin privileges required"):
            await use_case.execute(category_id, non_admin_user)
