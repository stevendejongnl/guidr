"""Tests for authorization helper functions."""

import pytest

from src.application.authorization import require_admin
from src.domain.entities import User
from src.domain.exceptions import AuthorizationException
from src.domain.value_objects import Email, EntityId


class TestRequireAdmin:
    """Test suite for require_admin helper function."""

    def test_require_admin_with_admin_user(self):
        """Should not raise when user is an admin."""
        # Arrange
        admin_user = User(
            id=EntityId("550e8400-e29b-41d4-a716-446655440000"),
            email=Email("admin@example.com"),
            password_hash="$argon2id$v=19$m=65536,t=3,p=4$...",
            is_admin=True,
        )

        # Act & Assert - should not raise
        require_admin(admin_user)

    def test_require_admin_with_non_admin_user(self):
        """Should raise AuthorizationException when user is not an admin."""
        # Arrange
        regular_user = User(
            id=EntityId("550e8400-e29b-41d4-a716-446655440000"),
            email=Email("user@example.com"),
            password_hash="$argon2id$v=19$m=65536,t=3,p=4$...",
            is_admin=False,
        )

        # Act & Assert
        with pytest.raises(AuthorizationException) as exc_info:
            require_admin(regular_user)

        assert "Admin privileges required" in str(exc_info.value)

    def test_require_admin_message_content(self):
        """Should raise with appropriate error message."""
        # Arrange
        regular_user = User(
            id=EntityId("550e8400-e29b-41d4-a716-446655440000"),
            email=Email("user@example.com"),
            password_hash="$argon2id$v=19$m=65536,t=3,p=4$...",
            is_admin=False,
        )

        # Act & Assert
        with pytest.raises(AuthorizationException) as exc_info:
            require_admin(regular_user)

        assert exc_info.value.message == "Admin privileges required"
