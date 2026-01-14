"""Tests for authentication dependencies."""

from unittest.mock import AsyncMock, Mock

import pytest
from fastapi import HTTPException

from src.domain.entities import User
from src.domain.value_objects import Email, EntityId
from src.presentation.api.dependencies.auth import get_current_user


class TestGetCurrentUser:
    """Test get_current_user authentication dependency."""

    @pytest.fixture
    def mock_jwt_service(self):
        """Create mock JWT service."""
        return Mock()

    @pytest.fixture
    def mock_user_repository(self):
        """Create mock user repository with async methods."""
        repo = Mock()
        repo.find_by_id = AsyncMock()
        return repo

    @pytest.fixture
    def valid_user(self):
        """Create a valid user entity."""
        return User(
            id=EntityId("550e8400-e29b-41d4-a716-446655440000"),
            email=Email("test@example.com"),
            password_hash="$argon2id$v=19$m=65536,t=3,p=4$..."
        )

    @pytest.mark.asyncio
    async def test_get_current_user_with_valid_token(
        self, mock_jwt_service, mock_user_repository, valid_user
    ):
        """Should return user when token is valid."""
        # Arrange
        token = "valid_token_here"
        mock_jwt_service.verify_token.return_value = {"sub": "550e8400-e29b-41d4-a716-446655440000"}
        mock_user_repository.find_by_id.return_value = valid_user

        # Act
        result = await get_current_user(
            token=token,
            jwt_service=mock_jwt_service,
            user_repository=mock_user_repository,
        )

        # Assert
        assert result == valid_user
        mock_jwt_service.verify_token.assert_called_once_with("valid_token_here")
        mock_user_repository.find_by_id.assert_called_once()
        # Verify EntityId was passed
        call_args = mock_user_repository.find_by_id.call_args[0]
        assert isinstance(call_args[0], EntityId)
        assert call_args[0].value == "550e8400-e29b-41d4-a716-446655440000"

    @pytest.mark.asyncio
    async def test_get_current_user_with_invalid_token(
        self, mock_jwt_service, mock_user_repository
    ):
        """Should raise 401 when token is invalid or expired."""
        # Arrange
        token = "invalid_token"
        mock_jwt_service.verify_token.return_value = None  # Invalid token

        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(
                token=token,
                jwt_service=mock_jwt_service,
                user_repository=mock_user_repository,
            )

        assert exc_info.value.status_code == 401
        assert "Invalid or expired token" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_get_current_user_with_missing_sub_in_payload(
        self, mock_jwt_service, mock_user_repository
    ):
        """Should raise 401 when token payload is missing 'sub' field."""
        # Arrange
        token = "valid_token"
        mock_jwt_service.verify_token.return_value = {}  # Missing 'sub' field

        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(
                token=token,
                jwt_service=mock_jwt_service,
                user_repository=mock_user_repository,
            )

        assert exc_info.value.status_code == 401
        assert "Invalid token payload" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_get_current_user_with_deleted_user(
        self, mock_jwt_service, mock_user_repository
    ):
        """Should raise 401 when user no longer exists (deleted)."""
        # Arrange
        token = "valid_token"
        mock_jwt_service.verify_token.return_value = {"sub": "550e8400-e29b-41d4-a716-446655440000"}
        mock_user_repository.find_by_id.return_value = None  # User not found

        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(
                token=token,
                jwt_service=mock_jwt_service,
                user_repository=mock_user_repository,
            )

        assert exc_info.value.status_code == 401
        assert "User not found" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_get_current_user_extracts_token_correctly(
        self, mock_jwt_service, mock_user_repository, valid_user
    ):
        """Should correctly extract and verify token."""
        # Arrange
        token = "abc123xyz"
        mock_jwt_service.verify_token.return_value = {"sub": "550e8400-e29b-41d4-a716-446655440000"}
        mock_user_repository.find_by_id.return_value = valid_user

        # Act
        await get_current_user(
            token=token,
            jwt_service=mock_jwt_service,
            user_repository=mock_user_repository,
        )

        # Assert - Token verified correctly
        mock_jwt_service.verify_token.assert_called_once_with("abc123xyz")
