"""Tests for User API models and endpoints."""

from src.presentation.api.models import UserResponse


class TestUserModels:
    """Test suite for User API models."""

    def test_user_response_with_all_fields(self) -> None:
        """Test UserResponse model includes all fields."""
        model = UserResponse(
            id="user-123",
            email="test@example.com",
            createdAt="2024-01-01T00:00:00Z",
            updatedAt="2024-01-01T00:00:00Z",
            name="Test User",
            interests=["cooking", "hiking"],
            isAdmin=True,
        )

        assert model.id == "user-123"
        assert model.email == "test@example.com"
        assert model.name == "Test User"
        assert model.interests == ["cooking", "hiking"]
        assert model.is_admin is True

    def test_user_response_with_defaults(self) -> None:
        """Test UserResponse model with default optional fields."""
        model = UserResponse(
            id="user-456",
            email="user@example.com",
            createdAt="2024-01-01T00:00:00Z",
            updatedAt="2024-01-01T00:00:00Z",
        )

        assert model.name is None
        assert model.interests is None
        assert model.is_admin is False

    def test_user_response_serialization(self) -> None:
        """Test UserResponse serializes with camelCase aliases."""
        model = UserResponse(
            id="user-789",
            email="admin@example.com",
            createdAt="2024-01-01T00:00:00Z",
            updatedAt="2024-01-02T00:00:00Z",
            isAdmin=True,
        )

        data = model.model_dump(by_alias=True)
        assert data["createdAt"] == "2024-01-01T00:00:00Z"
        assert data["updatedAt"] == "2024-01-02T00:00:00Z"
        assert data["isAdmin"] is True
