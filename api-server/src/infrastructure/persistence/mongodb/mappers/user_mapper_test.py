"""Tests for UserMapper."""

from datetime import UTC, datetime

import pytest

from src.domain.entities import User
from src.domain.value_objects import Email, EntityId

from .user_mapper import UserMapper


class TestUserMapper:
    """Test suite for UserMapper."""

    def test_to_document_with_all_fields(self):
        """Test converting User to document with all fields."""
        # Arrange
        user_id = EntityId("123e4567-e89b-12d3-a456-426614174000")
        email = Email("test@example.com")
        password_hash = "hashed_password_123"
        created_at = datetime(2024, 1, 1, 12, 0, 0, tzinfo=UTC)
        updated_at = datetime(2024, 1, 2, 12, 0, 0, tzinfo=UTC)
        name = "John Doe"
        interests = ["baking", "sports"]

        user = User(
            id=user_id,
            email=email,
            password_hash=password_hash,
            created_at=created_at,
            updated_at=updated_at,
            name=name,
            interests=interests,
        )

        # Act
        document = UserMapper.to_document(user)

        # Assert
        assert document["_id"] == "123e4567-e89b-12d3-a456-426614174000"
        assert document["email"] == "test@example.com"
        assert document["passwordHash"] == "hashed_password_123"
        assert document["createdAt"] == created_at
        assert document["updatedAt"] == updated_at
        assert document["name"] == "John Doe"
        assert document["interests"] == ["baking", "sports"]

    def test_to_document_with_none_name(self):
        """Test converting User to document with None name."""
        # Arrange
        user_id = EntityId("123e4567-e89b-12d3-a456-426614174000")
        email = Email("test@example.com")
        password_hash = "hashed_password_123"

        user = User(
            id=user_id,
            email=email,
            password_hash=password_hash,
            name=None,
            interests=["baking"],
        )

        # Act
        document = UserMapper.to_document(user)

        # Assert
        assert document["name"] is None
        assert document["interests"] == ["baking"]

    def test_to_document_with_empty_interests(self):
        """Test converting User to document with empty interests."""
        # Arrange
        user_id = EntityId("123e4567-e89b-12d3-a456-426614174000")
        email = Email("test@example.com")
        password_hash = "hashed_password_123"

        user = User(
            id=user_id,
            email=email,
            password_hash=password_hash,
            name="John Doe",
            interests=[],
        )

        # Act
        document = UserMapper.to_document(user)

        # Assert
        assert document["name"] == "John Doe"
        assert document["interests"] == []

    def test_to_entity_with_all_fields(self):
        """Test converting document to User with all fields."""
        # Arrange
        created_at = datetime(2024, 1, 1, 12, 0, 0, tzinfo=UTC)
        updated_at = datetime(2024, 1, 2, 12, 0, 0, tzinfo=UTC)

        document = {
            "_id": "123e4567-e89b-12d3-a456-426614174000",
            "email": "test@example.com",
            "passwordHash": "hashed_password_123",
            "createdAt": created_at,
            "updatedAt": updated_at,
            "name": "John Doe",
            "interests": ["baking", "sports"],
        }

        # Act
        user = UserMapper.to_entity(document)

        # Assert
        assert user.id.value == "123e4567-e89b-12d3-a456-426614174000"
        assert user.email.value == "test@example.com"
        assert user.password_hash == "hashed_password_123"
        assert user.created_at == created_at
        assert user.updated_at == updated_at
        assert user.name == "John Doe"
        assert user.interests == ["baking", "sports"]

    def test_to_entity_with_none_name(self):
        """Test converting document to User with None name."""
        # Arrange
        created_at = datetime(2024, 1, 1, 12, 0, 0, tzinfo=UTC)
        updated_at = datetime(2024, 1, 2, 12, 0, 0, tzinfo=UTC)

        document = {
            "_id": "123e4567-e89b-12d3-a456-426614174000",
            "email": "test@example.com",
            "passwordHash": "hashed_password_123",
            "createdAt": created_at,
            "updatedAt": updated_at,
            "name": None,
            "interests": ["baking"],
        }

        # Act
        user = UserMapper.to_entity(document)

        # Assert
        assert user.name is None
        assert user.interests == ["baking"]

    def test_to_entity_with_empty_interests(self):
        """Test converting document to User with empty interests."""
        # Arrange
        created_at = datetime(2024, 1, 1, 12, 0, 0, tzinfo=UTC)
        updated_at = datetime(2024, 1, 2, 12, 0, 0, tzinfo=UTC)

        document = {
            "_id": "123e4567-e89b-12d3-a456-426614174000",
            "email": "test@example.com",
            "passwordHash": "hashed_password_123",
            "createdAt": created_at,
            "updatedAt": updated_at,
            "name": "John Doe",
            "interests": [],
        }

        # Act
        user = UserMapper.to_entity(document)

        # Assert
        assert user.name == "John Doe"
        assert user.interests == []

    def test_to_entity_without_optional_fields(self):
        """Test converting document to User without optional fields (backwards compatibility)."""
        # Arrange
        created_at = datetime(2024, 1, 1, 12, 0, 0, tzinfo=UTC)
        updated_at = datetime(2024, 1, 2, 12, 0, 0, tzinfo=UTC)

        document = {
            "_id": "123e4567-e89b-12d3-a456-426614174000",
            "email": "test@example.com",
            "passwordHash": "hashed_password_123",
            "createdAt": created_at,
            "updatedAt": updated_at,
            # name and interests missing (old documents)
        }

        # Act
        user = UserMapper.to_entity(document)

        # Assert
        assert user.id.value == "123e4567-e89b-12d3-a456-426614174000"
        assert user.email.value == "test@example.com"
        assert user.name is None  # Default value
        assert user.interests == []  # Default value

    def test_round_trip_preserves_data(self):
        """Test that converting User → document → User preserves all data."""
        # Arrange
        original_user = User(
            id=EntityId("123e4567-e89b-12d3-a456-426614174000"),
            email=Email("test@example.com"),
            password_hash="hashed_password_123",
            created_at=datetime(2024, 1, 1, 12, 0, 0, tzinfo=UTC),
            updated_at=datetime(2024, 1, 2, 12, 0, 0, tzinfo=UTC),
            name="John Doe",
            interests=["baking", "sports", "cooking"],
        )

        # Act
        document = UserMapper.to_document(original_user)
        recovered_user = UserMapper.to_entity(document)

        # Assert
        assert recovered_user.id.value == original_user.id.value
        assert recovered_user.email.value == original_user.email.value
        assert recovered_user.password_hash == original_user.password_hash
        assert recovered_user.created_at == original_user.created_at
        assert recovered_user.updated_at == original_user.updated_at
        assert recovered_user.name == original_user.name
        assert recovered_user.interests == original_user.interests
