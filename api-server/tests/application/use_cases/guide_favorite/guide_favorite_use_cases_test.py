"""Tests for guide favorite use cases."""

from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from src.application.use_cases.guide_favorite import (
    FavoriteGuide,
    GetUserFavorites,
    UnfavoriteGuide,
)
from src.domain.entities import GuideFavorite
from src.domain.repositories import IGuideFavoriteRepository
from src.domain.value_objects import EntityId


class TestFavoriteGuide:
    """Test suite for FavoriteGuide use case."""

    @pytest.fixture
    def repository(self) -> AsyncMock:
        """Create mock repository."""
        return AsyncMock(spec=IGuideFavoriteRepository)

    @pytest.fixture
    def use_case(self, repository: AsyncMock) -> FavoriteGuide:
        """Create use case with mock repository."""
        return FavoriteGuide(repository)

    @pytest.mark.asyncio
    async def test_creates_new_favorite(
        self, use_case: FavoriteGuide, repository: AsyncMock
    ) -> None:
        """Test creating a new favorite."""
        user_id = str(uuid4())
        guide_id = str(uuid4())

        repository.find_by_user_and_guide.return_value = None

        await use_case.execute(
            user_id=user_id, guide_id=guide_id
        )

        repository.find_by_user_and_guide.assert_called_once()
        repository.save.assert_called_once()
        saved = repository.save.call_args[0][0]
        assert saved.user_id.value == user_id
        assert saved.guide_id.value == guide_id

    @pytest.mark.asyncio
    async def test_idempotent_when_already_favorited(
        self, use_case: FavoriteGuide, repository: AsyncMock
    ) -> None:
        """Test favoriting an already favorited guide is a no-op."""
        user_id = str(uuid4())
        guide_id = str(uuid4())

        existing = GuideFavorite(
            id=EntityId(str(uuid4())),
            user_id=EntityId(user_id),
            guide_id=EntityId(guide_id),
        )
        repository.find_by_user_and_guide.return_value = existing

        await use_case.execute(
            user_id=user_id, guide_id=guide_id
        )

        repository.save.assert_not_called()


class TestUnfavoriteGuide:
    """Test suite for UnfavoriteGuide use case."""

    @pytest.fixture
    def repository(self) -> AsyncMock:
        """Create mock repository."""
        return AsyncMock(spec=IGuideFavoriteRepository)

    @pytest.fixture
    def use_case(self, repository: AsyncMock) -> UnfavoriteGuide:
        """Create use case with mock repository."""
        return UnfavoriteGuide(repository)

    @pytest.mark.asyncio
    async def test_deletes_favorite(
        self,
        use_case: UnfavoriteGuide,
        repository: AsyncMock,
    ) -> None:
        """Test unfavoriting removes the favorite."""
        user_id = str(uuid4())
        guide_id = str(uuid4())

        await use_case.execute(
            user_id=user_id, guide_id=guide_id
        )

        repository.delete_by_user_and_guide.assert_called_once()


class TestGetUserFavorites:
    """Test suite for GetUserFavorites use case."""

    @pytest.fixture
    def repository(self) -> AsyncMock:
        """Create mock repository."""
        return AsyncMock(spec=IGuideFavoriteRepository)

    @pytest.fixture
    def use_case(
        self, repository: AsyncMock
    ) -> GetUserFavorites:
        """Create use case with mock repository."""
        return GetUserFavorites(repository)

    @pytest.mark.asyncio
    async def test_returns_guide_ids(
        self,
        use_case: GetUserFavorites,
        repository: AsyncMock,
    ) -> None:
        """Test returning favorited guide IDs."""
        user_id = str(uuid4())
        guide_id_1 = str(uuid4())
        guide_id_2 = str(uuid4())

        favorites = [
            GuideFavorite(
                id=EntityId(str(uuid4())),
                user_id=EntityId(user_id),
                guide_id=EntityId(guide_id_1),
            ),
            GuideFavorite(
                id=EntityId(str(uuid4())),
                user_id=EntityId(user_id),
                guide_id=EntityId(guide_id_2),
            ),
        ]
        repository.find_by_user_id.return_value = favorites

        result = await use_case.execute(user_id=user_id)

        assert result == [guide_id_1, guide_id_2]
        repository.find_by_user_id.assert_called_once()

    @pytest.mark.asyncio
    async def test_returns_empty_list_when_no_favorites(
        self,
        use_case: GetUserFavorites,
        repository: AsyncMock,
    ) -> None:
        """Test returning empty list when no favorites."""
        user_id = str(uuid4())

        repository.find_by_user_id.return_value = []

        result = await use_case.execute(user_id=user_id)

        assert result == []
