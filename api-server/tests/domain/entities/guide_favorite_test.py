"""Tests for GuideFavorite entity."""

from datetime import UTC, datetime
from uuid import uuid4

from src.domain.entities import GuideFavorite
from src.domain.value_objects import EntityId


class TestGuideFavorite:
    """Test suite for GuideFavorite entity."""

    def test_create_with_default_created_at(self) -> None:
        """Test creating a favorite with default created_at."""
        fav_id = EntityId(str(uuid4()))
        user_id = EntityId(str(uuid4()))
        guide_id = EntityId(str(uuid4()))

        favorite = GuideFavorite(
            id=fav_id,
            user_id=user_id,
            guide_id=guide_id,
        )

        assert favorite.id == fav_id
        assert favorite.user_id == user_id
        assert favorite.guide_id == guide_id
        assert favorite.created_at is not None

    def test_create_with_explicit_created_at(self) -> None:
        """Test creating a favorite with explicit created_at."""
        now = datetime.now(UTC)

        favorite = GuideFavorite(
            id=EntityId(str(uuid4())),
            user_id=EntityId(str(uuid4())),
            guide_id=EntityId(str(uuid4())),
            created_at=now,
        )

        assert favorite.created_at == now
