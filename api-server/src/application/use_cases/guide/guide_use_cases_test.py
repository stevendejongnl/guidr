"""Tests for Guide use cases."""

from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from src.application.dtos import GuideCreateDTO, GuideUpdateDTO
from src.application.use_cases.guide import (
    CreateGuide,
    DeleteGuide,
    GetAllGuides,
    GetGuide,
    GetGuidesByType,
    GetHighlightedGuides,
    GetMyGuides,
    UpdateGuide,
)
from src.domain.entities import Guide, User
from src.domain.exceptions import (
    AuthorizationException,
    EntityNotFoundException,
)
from src.domain.value_objects import (
    Email,
    EntityId,
    GuideTitle,
    GuideType,
)


@pytest.fixture
def mock_guide_repository():
    """Create mock guide repository."""
    return AsyncMock()


@pytest.fixture
def mock_event_persistence_service():
    """Create mock event persistence service."""
    return AsyncMock()


@pytest.fixture
def sample_guide():
    """Create a sample guide."""
    return Guide(
        id=EntityId(str(uuid4())),
        guide_type=GuideType.COOKING,
        title=GuideTitle("Test Guide"),
        description="Test Description",
        is_public=True,
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


class TestCreateGuide:
    """Tests for CreateGuide use case."""

    async def test_create_guide_success(
        self, mock_guide_repository
    ):
        """Test successful guide creation."""
        use_case = CreateGuide(mock_guide_repository)
        dto = GuideCreateDTO(
            guide_type="cooking",
            title="New Guide",
            description="Description",
        )

        result = await use_case.execute(dto)

        assert result.title == "New Guide"
        assert result.guide_type == "cooking"
        assert result.id is not None
        mock_guide_repository.save.assert_called_once()

    async def test_create_guide_with_metadata(
        self, mock_guide_repository
    ):
        """Test guide creation with metadata."""
        use_case = CreateGuide(mock_guide_repository)
        dto = GuideCreateDTO(
            guide_type="cooking",
            title="Pasta Guide",
            metadata={"ingredients": [
                {"name": "flour", "quantity": "200", "unit": "g"},
                {"name": "eggs", "quantity": "3", "unit": "piece"},
            ]},
        )

        result = await use_case.execute(dto)

        assert result.metadata == {
            "ingredients": [
                {"name": "flour", "quantity": "200", "unit": "g"},
                {"name": "eggs", "quantity": "3", "unit": "piece"},
            ]
        }

    async def test_create_guide_invalid_type(
        self, mock_guide_repository
    ):
        """Test creating guide with invalid type."""
        use_case = CreateGuide(mock_guide_repository)
        dto = GuideCreateDTO(
            guide_type="invalid",
            title="New Guide",
        )

        with pytest.raises(ValueError):
            await use_case.execute(dto)


class TestGetGuide:
    """Tests for GetGuide use case."""

    async def test_get_guide_success(
        self, mock_guide_repository, sample_guide
    ):
        """Test getting existing guide."""
        mock_guide_repository.find_by_id.return_value = (
            sample_guide
        )
        use_case = GetGuide(mock_guide_repository)

        result = await use_case.execute(
            sample_guide.id.value
        )

        assert result is not None
        assert result.id == sample_guide.id.value
        assert result.title == sample_guide.title.value

    async def test_get_guide_not_found(
        self, mock_guide_repository
    ):
        """Test getting non-existent guide."""
        mock_guide_repository.find_by_id.return_value = None
        use_case = GetGuide(mock_guide_repository)

        result = await use_case.execute(str(uuid4()))

        assert result is None


class TestGetAllGuides:
    """Tests for GetAllGuides use case."""

    async def test_get_all_guides(
        self, mock_guide_repository, sample_guide
    ):
        """Test getting all guides."""
        mock_guide_repository.find_all.return_value = [
            sample_guide
        ]
        use_case = GetAllGuides(mock_guide_repository)

        result = await use_case.execute()

        assert len(result) == 1
        assert result[0].id == sample_guide.id.value


class TestGetGuidesByType:
    """Tests for GetGuidesByType use case."""

    async def test_get_guides_by_type(
        self, mock_guide_repository, sample_guide
    ):
        """Test getting guides by type."""
        mock_guide_repository.find_by_type.return_value = [
            sample_guide
        ]
        use_case = GetGuidesByType(mock_guide_repository)

        result = await use_case.execute("cooking")

        assert len(result) == 1
        assert result[0].guide_type == "cooking"


class TestUpdateGuide:
    """Tests for UpdateGuide use case."""

    async def test_update_guide_title(
        self,
        mock_guide_repository,
        mock_event_persistence_service,
        sample_guide,
        admin_user,
    ):
        """Test updating guide title by admin."""
        mock_guide_repository.find_by_id.return_value = (
            sample_guide
        )
        use_case = UpdateGuide(
            mock_guide_repository,
            mock_event_persistence_service,
        )
        dto = GuideUpdateDTO(title="Updated Title")

        result = await use_case.execute(
            sample_guide.id.value, dto, admin_user
        )

        assert result is not None
        assert result.title == "Updated Title"
        mock_guide_repository.save.assert_called_once()

    async def test_update_guide_not_found(
        self,
        mock_guide_repository,
        mock_event_persistence_service,
        admin_user,
    ):
        """Test updating non-existent guide."""
        mock_guide_repository.find_by_id.return_value = None
        use_case = UpdateGuide(
            mock_guide_repository,
            mock_event_persistence_service,
        )
        dto = GuideUpdateDTO(title="Updated Title")

        with pytest.raises(
            EntityNotFoundException, match="Guide not found"
        ):
            await use_case.execute(
                str(uuid4()), dto, admin_user
            )

    async def test_update_guide_non_owner_non_admin_rejected(
        self,
        mock_guide_repository,
        mock_event_persistence_service,
        non_admin_user,
    ):
        """Test update rejected for non-owner, non-admin."""
        other_user = User(
            id=EntityId(str(uuid4())),
            email=Email("other@example.com"),
            password_hash="$argon2id$v=19$m=65536,t=3,p=4$...",
            is_admin=False,
        )
        guide_with_owner = Guide(
            id=EntityId(str(uuid4())),
            guide_type=GuideType.COOKING,
            title=GuideTitle("Test Guide"),
            created_by_user_id=other_user.id,
        )
        mock_guide_repository.find_by_id.return_value = (
            guide_with_owner
        )
        use_case = UpdateGuide(
            mock_guide_repository,
            mock_event_persistence_service,
        )
        dto = GuideUpdateDTO(title="Updated Title")

        with pytest.raises(
            AuthorizationException,
            match="You are not authorized",
        ):
            await use_case.execute(
                guide_with_owner.id.value,
                dto,
                non_admin_user,
            )

    async def test_update_guide_metadata(
        self,
        mock_guide_repository,
        mock_event_persistence_service,
        admin_user,
    ):
        """Test updating guide metadata."""
        guide = Guide(
            id=EntityId(str(uuid4())),
            guide_type=GuideType.COOKING,
            title=GuideTitle("Test Guide"),
        )
        mock_guide_repository.find_by_id.return_value = guide
        use_case = UpdateGuide(
            mock_guide_repository,
            mock_event_persistence_service,
        )
        metadata = {
            "ingredients": [
                {"name": "flour", "quantity": "200", "unit": "g"},
            ]
        }
        dto = GuideUpdateDTO(metadata=metadata)

        result = await use_case.execute(
            guide.id.value, dto, admin_user
        )

        assert result is not None
        assert result.metadata == metadata
        mock_guide_repository.save.assert_called_once()

    async def test_update_guide_owner_can_update(
        self,
        mock_guide_repository,
        mock_event_persistence_service,
        non_admin_user,
    ):
        """Test that guide owner can update their own."""
        guide = Guide(
            id=EntityId(str(uuid4())),
            guide_type=GuideType.COOKING,
            title=GuideTitle("Test Guide"),
            created_by_user_id=non_admin_user.id,
        )
        mock_guide_repository.find_by_id.return_value = (
            guide
        )
        use_case = UpdateGuide(
            mock_guide_repository,
            mock_event_persistence_service,
        )
        dto = GuideUpdateDTO(title="Updated Title")

        result = await use_case.execute(
            guide.id.value, dto, non_admin_user
        )

        assert result is not None
        assert result.title == "Updated Title"
        mock_guide_repository.save.assert_called_once()


class TestDeleteGuide:
    """Tests for DeleteGuide use case."""

    async def test_delete_guide(
        self,
        mock_guide_repository,
        mock_event_persistence_service,
        admin_user,
    ):
        """Test deleting a guide by admin."""
        mock_guide_repository.find_by_id.return_value = (
            Guide(
                id=EntityId(str(uuid4())),
                guide_type=GuideType.COOKING,
                title=GuideTitle("Test Guide"),
            )
        )
        use_case = DeleteGuide(
            mock_guide_repository,
            mock_event_persistence_service,
        )
        guide_id = str(uuid4())

        await use_case.execute(guide_id, admin_user)

        mock_guide_repository.delete.assert_called_once()

    async def test_delete_guide_non_admin_rejected(
        self,
        mock_guide_repository,
        mock_event_persistence_service,
        non_admin_user,
    ):
        """Test deleting rejected for non-admin."""
        use_case = DeleteGuide(
            mock_guide_repository,
            mock_event_persistence_service,
        )
        guide_id = str(uuid4())

        with pytest.raises(
            AuthorizationException,
            match="Admin privileges required",
        ):
            await use_case.execute(guide_id, non_admin_user)


class TestGetMyGuides:
    """Tests for GetMyGuides use case."""

    async def test_returns_only_users_own_guides(
        self, mock_guide_repository, non_admin_user
    ):
        """Test that only the authenticated user's guides are returned."""
        own_guide = Guide(
            id=EntityId(str(uuid4())),
            guide_type=GuideType.COOKING,
            title=GuideTitle("My Guide"),
            created_by_user_id=non_admin_user.id,
            is_public=False,
        )
        mock_guide_repository.find_by_user_id.return_value = [own_guide]
        use_case = GetMyGuides(mock_guide_repository)

        result = await use_case.execute(non_admin_user)

        assert len(result) == 1
        assert result[0].created_by_user_id == non_admin_user.id.value
        mock_guide_repository.find_by_user_id.assert_called_once_with(
            non_admin_user.id
        )

    async def test_returns_empty_list_when_no_guides(
        self, mock_guide_repository, non_admin_user
    ):
        """Test returns empty list when user has no guides."""
        mock_guide_repository.find_by_user_id.return_value = []
        use_case = GetMyGuides(mock_guide_repository)

        result = await use_case.execute(non_admin_user)

        assert result == []

    async def test_does_not_call_find_all(
        self, mock_guide_repository, non_admin_user
    ):
        """Test that DB-level filter is used, not find_all."""
        mock_guide_repository.find_by_user_id.return_value = []
        use_case = GetMyGuides(mock_guide_repository)

        await use_case.execute(non_admin_user)

        mock_guide_repository.find_all.assert_not_called()


class TestGetHighlightedGuides:
    """Tests for GetHighlightedGuides use case."""

    async def test_returns_highlighted_guides(
        self, mock_guide_repository
    ):
        """Test that highlighted guides are returned."""
        highlighted = Guide(
            id=EntityId(str(uuid4())),
            guide_type=GuideType.COOKING,
            title=GuideTitle("Featured Guide"),
            is_public=True,
            is_highlighted=True,
        )
        mock_guide_repository.find_highlighted_guides.return_value = [
            highlighted
        ]
        use_case = GetHighlightedGuides(mock_guide_repository)

        result = await use_case.execute()

        assert len(result) == 1
        assert result[0].is_highlighted is True
        mock_guide_repository.find_highlighted_guides.assert_called_once()

    async def test_returns_empty_list_when_none_highlighted(
        self, mock_guide_repository
    ):
        """Test returns empty list when no guides are highlighted."""
        mock_guide_repository.find_highlighted_guides.return_value = []
        use_case = GetHighlightedGuides(mock_guide_repository)

        result = await use_case.execute()

        assert result == []

    async def test_no_auth_required(self, mock_guide_repository):
        """Test that no user is required (public endpoint)."""
        mock_guide_repository.find_highlighted_guides.return_value = []
        use_case = GetHighlightedGuides(mock_guide_repository)

        # Should not raise even without any user context
        result = await use_case.execute()

        assert result == []
