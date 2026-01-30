"""Tests for authorization helpers."""

from uuid import uuid4

import pytest

from src.application.authorization import can_view_guide, require_owner_or_admin
from src.domain.entities import Guide, User
from src.domain.exceptions import AuthorizationException
from src.domain.value_objects import Email, EntityId, GuideTitle


class TestRequireOwnerOrAdmin:
    """Test suite for require_owner_or_admin function."""

    def test_admin_can_access_any_guide(self) -> None:
        """Test that admins can access any guide."""
        admin_user = User(
            id=EntityId(str(uuid4())),
            email=Email("admin@example.com"),
            password_hash="hashed",
            is_admin=True,
        )
        other_user_id = EntityId(str(uuid4()))

        # Should not raise
        require_owner_or_admin(admin_user, other_user_id)

    def test_owner_can_access_own_guide(self) -> None:
        """Test that owner can access their own guide."""
        user_id = EntityId(str(uuid4()))
        user = User(
            id=user_id,
            email=Email("user@example.com"),
            password_hash="hashed",
            is_admin=False,
        )

        # Should not raise
        require_owner_or_admin(user, user_id)

    def test_non_owner_non_admin_cannot_access_guide(self) -> None:
        """Test that non-owner, non-admin users cannot access guides."""
        user = User(
            id=EntityId(str(uuid4())),
            email=Email("user@example.com"),
            password_hash="hashed",
            is_admin=False,
        )
        other_user_id = EntityId(str(uuid4()))

        with pytest.raises(AuthorizationException) as exc_info:
            require_owner_or_admin(user, other_user_id)

        assert "not authorized" in str(exc_info.value).lower()

    def test_owner_with_none_user_id_cannot_access(self) -> None:
        """Test that can't access guide with None user ID."""
        user = User(
            id=EntityId(str(uuid4())),
            email=Email("user@example.com"),
            password_hash="hashed",
            is_admin=False,
        )

        # Trying to access a guide with no owner (None)
        with pytest.raises(AuthorizationException):
            require_owner_or_admin(user, None)


class TestCanViewGuide:
    """Test suite for can_view_guide function."""

    def test_admin_can_view_any_guide(self) -> None:
        """Test that admins can view any guide regardless of visibility."""
        admin_user = User(
            id=EntityId(str(uuid4())),
            email=Email("admin@example.com"),
            password_hash="hashed",
            is_admin=True,
        )
        guide = Guide(
            id=EntityId(str(uuid4())),
            category_id=EntityId(str(uuid4())),
            title=GuideTitle("Private Guide"),
            is_public=False,
        )

        assert can_view_guide(admin_user, guide) is True

    def test_creator_can_view_own_private_guide(self) -> None:
        """Test that creator can view their own private guide."""
        user_id = EntityId(str(uuid4()))
        user = User(
            id=user_id,
            email=Email("user@example.com"),
            password_hash="hashed",
            is_admin=False,
        )
        guide = Guide(
            id=EntityId(str(uuid4())),
            category_id=EntityId(str(uuid4())),
            title=GuideTitle("My Private Guide"),
            created_by_user_id=user_id,
            is_public=False,
        )

        assert can_view_guide(user, guide) is True

    def test_anyone_can_view_public_guide(self) -> None:
        """Test that anyone can view public guides."""
        user = User(
            id=EntityId(str(uuid4())),
            email=Email("user@example.com"),
            password_hash="hashed",
            is_admin=False,
        )
        other_user_id = EntityId(str(uuid4()))
        guide = Guide(
            id=EntityId(str(uuid4())),
            category_id=EntityId(str(uuid4())),
            title=GuideTitle("Public Guide"),
            created_by_user_id=other_user_id,
            is_public=True,
        )

        assert can_view_guide(user, guide) is True

    def test_non_owner_cannot_view_private_guide(self) -> None:
        """Test that non-owners cannot view private guides."""
        user = User(
            id=EntityId(str(uuid4())),
            email=Email("user@example.com"),
            password_hash="hashed",
            is_admin=False,
        )
        other_user_id = EntityId(str(uuid4()))
        guide = Guide(
            id=EntityId(str(uuid4())),
            category_id=EntityId(str(uuid4())),
            title=GuideTitle("Someone Else's Private Guide"),
            created_by_user_id=other_user_id,
            is_public=False,
        )

        assert can_view_guide(user, guide) is False

    def test_unauthenticated_user_can_view_public_guide(self) -> None:
        """Test that unauthenticated users can view public guides."""
        guide = Guide(
            id=EntityId(str(uuid4())),
            category_id=EntityId(str(uuid4())),
            title=GuideTitle("Public Guide"),
            is_public=True,
        )

        # None user represents unauthenticated
        assert can_view_guide(None, guide) is True

    def test_unauthenticated_user_cannot_view_private_guide(self) -> None:
        """Test that unauthenticated users cannot view private guides."""
        guide = Guide(
            id=EntityId(str(uuid4())),
            category_id=EntityId(str(uuid4())),
            title=GuideTitle("Private Guide"),
            is_public=False,
        )

        # None user represents unauthenticated
        assert can_view_guide(None, guide) is False

    def test_legacy_guide_without_owner_private_only_admin_can_view(self) -> None:
        """Test that legacy guides (no owner) are treated as private."""
        admin_user = User(
            id=EntityId(str(uuid4())),
            email=Email("admin@example.com"),
            password_hash="hashed",
            is_admin=True,
        )
        regular_user = User(
            id=EntityId(str(uuid4())),
            email=Email("user@example.com"),
            password_hash="hashed",
            is_admin=False,
        )
        # Legacy guide with no owner
        guide = Guide(
            id=EntityId(str(uuid4())),
            category_id=EntityId(str(uuid4())),
            title=GuideTitle("Legacy Guide"),
            created_by_user_id=None,
            is_public=False,
        )

        assert can_view_guide(admin_user, guide) is True
        assert can_view_guide(regular_user, guide) is False
