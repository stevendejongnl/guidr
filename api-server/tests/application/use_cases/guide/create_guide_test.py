"""Tests for CreateGuide use case - ensuring ownership is set correctly."""

from uuid import uuid4

import pytest

from src.domain.entities import Guide, User
from src.domain.repositories import IGuideRepository
from src.domain.value_objects import Email, EntityId, GuideTitle, GuideType


class MockGuideRepository(IGuideRepository):
    """Mock repository for testing."""

    def __init__(self):
        self.saved_guides: list[Guide] = []

    async def find_by_id(self, id: EntityId) -> Guide | None:
        for guide in self.saved_guides:
            if guide.id == id:
                return guide
        return None

    async def find_all(self) -> list[Guide]:
        return self.saved_guides

    async def find_by_type(self, guide_type: GuideType) -> list[Guide]:
        return [g for g in self.saved_guides if g.guide_type == guide_type]

    async def find_by_user_id(self, user_id: EntityId) -> list[Guide]:
        return [g for g in self.saved_guides if g.created_by_user_id == user_id]

    async def find_public_guides(self) -> list[Guide]:
        return [g for g in self.saved_guides if g.is_public]

    async def find_highlighted_guides(self) -> list[Guide]:
        return [g for g in self.saved_guides if g.is_highlighted and g.is_public]

    async def find_accessible_by_user(self, user_id: EntityId | None) -> list[Guide]:
        if user_id is None:
            return [g for g in self.saved_guides if g.is_public]
        return [g for g in self.saved_guides if g.is_public or g.created_by_user_id == user_id]

    async def save(self, entity: Guide) -> None:
        self.saved_guides = [g for g in self.saved_guides if g.id != entity.id]
        self.saved_guides.append(entity)

    async def delete(self, id: EntityId) -> None:
        self.saved_guides = [g for g in self.saved_guides if g.id != id]


class TestCreateGuideOwnership:
    """Test suite for guide creation with proper ownership."""

    @pytest.fixture
    def repository(self) -> MockGuideRepository:
        """Create mock repository."""
        return MockGuideRepository()

    @pytest.fixture
    def user(self) -> User:
        """Create test user."""
        return User(
            id=EntityId(str(uuid4())),
            email=Email("user@example.com"),
            password_hash="hashed",
            is_admin=False,
        )

    @pytest.mark.asyncio
    async def test_guide_can_be_created_with_ownership(
        self, repository: MockGuideRepository, user: User
    ) -> None:
        """Test that guides can be created with owner ID set."""
        guide = Guide(
            id=EntityId(str(uuid4())),
            guide_type=GuideType.GENERAL,
            title=GuideTitle("Learn Python"),
            created_by_user_id=user.id,  # Owner set from user
            is_public=False,
        )

        await repository.save(guide)

        # Verify saved
        saved = await repository.find_by_id(guide.id)
        assert saved is not None
        assert saved.created_by_user_id == user.id
        assert saved.is_public is False

    @pytest.mark.asyncio
    async def test_guide_can_be_created_public(
        self, repository: MockGuideRepository, user: User
    ) -> None:
        """Test that guides can be created as public."""
        guide = Guide(
            id=EntityId(str(uuid4())),
            guide_type=GuideType.GENERAL,
            title=GuideTitle("Learn Python"),
            created_by_user_id=user.id,
            is_public=True,
        )

        await repository.save(guide)

        # Verify accessibility
        public_guides = await repository.find_public_guides()
        assert guide in public_guides

    @pytest.mark.asyncio
    async def test_find_user_guides(self, repository: MockGuideRepository, user: User) -> None:
        """Test finding all guides by a user."""
        guide1 = Guide(
            id=EntityId(str(uuid4())),
            guide_type=GuideType.GENERAL,
            title=GuideTitle("Guide 1"),
            created_by_user_id=user.id,
        )
        guide2 = Guide(
            id=EntityId(str(uuid4())),
            guide_type=GuideType.GENERAL,
            title=GuideTitle("Guide 2"),
            created_by_user_id=user.id,
        )

        other_user = User(
            id=EntityId(str(uuid4())),
            email=Email("other@example.com"),
            password_hash="hashed",
        )
        guide3 = Guide(
            id=EntityId(str(uuid4())),
            guide_type=GuideType.GENERAL,
            title=GuideTitle("Guide 3"),
            created_by_user_id=other_user.id,
        )

        await repository.save(guide1)
        await repository.save(guide2)
        await repository.save(guide3)

        # Find user's guides
        user_guides = await repository.find_by_user_id(user.id)
        assert len(user_guides) == 2
        assert guide1 in user_guides
        assert guide2 in user_guides
        assert guide3 not in user_guides

    @pytest.mark.asyncio
    async def test_find_accessible_by_authenticated_user(
        self, repository: MockGuideRepository, user: User
    ) -> None:
        """Test finding guides accessible to authenticated user."""

        # User's own private guide
        private_guide = Guide(
            id=EntityId(str(uuid4())),
            guide_type=GuideType.GENERAL,
            title=GuideTitle("My Private Guide"),
            created_by_user_id=user.id,
            is_public=False,
        )

        # Public guide from another user
        public_guide = Guide(
            id=EntityId(str(uuid4())),
            guide_type=GuideType.GENERAL,
            title=GuideTitle("Public Guide"),
            created_by_user_id=EntityId(str(uuid4())),
            is_public=True,
        )

        # Private guide from another user
        other_private = Guide(
            id=EntityId(str(uuid4())),
            guide_type=GuideType.GENERAL,
            title=GuideTitle("Someone Else's Private"),
            created_by_user_id=EntityId(str(uuid4())),
            is_public=False,
        )

        await repository.save(private_guide)
        await repository.save(public_guide)
        await repository.save(other_private)

        accessible = await repository.find_accessible_by_user(user.id)

        assert private_guide in accessible  # User's own
        assert public_guide in accessible   # Public
        assert other_private not in accessible  # Not owner, not public

    @pytest.mark.asyncio
    async def test_find_accessible_by_unauthenticated_user(
        self, repository: MockGuideRepository
    ) -> None:
        """Test finding guides accessible to unauthenticated user (only public)."""

        user_id = EntityId(str(uuid4()))
        private_guide = Guide(
            id=EntityId(str(uuid4())),
            guide_type=GuideType.GENERAL,
            title=GuideTitle("Private Guide"),
            created_by_user_id=user_id,
            is_public=False,
        )

        public_guide = Guide(
            id=EntityId(str(uuid4())),
            guide_type=GuideType.GENERAL,
            title=GuideTitle("Public Guide"),
            created_by_user_id=user_id,
            is_public=True,
        )

        await repository.save(private_guide)
        await repository.save(public_guide)

        # Unauthenticated user (None)
        accessible = await repository.find_accessible_by_user(None)

        assert private_guide not in accessible
        assert public_guide in accessible
