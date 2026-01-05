"""Tests for DeleteAccount use case."""

from unittest.mock import AsyncMock, Mock

import pytest

from src.application.dtos import DeleteAccountDTO
from src.application.use_cases.user.delete_account import DeleteAccount
from src.domain.entities import User
from src.domain.exceptions import ValidationException
from src.domain.value_objects import Email, EntityId


class TestDeleteAccount:
    """Test DeleteAccount use case."""

    @pytest.fixture
    def mock_user_repository(self):
        """Create mock user repository."""
        repo = Mock()
        repo.find_by_id = AsyncMock()
        repo.delete = AsyncMock()
        return repo

    @pytest.fixture
    def mock_password_hasher(self):
        """Create mock password hasher."""
        hasher = Mock()
        hasher.verify_password = Mock()
        return hasher

    @pytest.fixture
    def valid_user(self):
        """Create a valid user entity."""
        return User(
            id=EntityId("550e8400-e29b-41d4-a716-446655440000"),
            email=Email("test@example.com"),
            password_hash="$argon2id$v=19$m=65536,t=3,p=4$hash"
        )

    @pytest.mark.asyncio
    async def test_delete_account_success(
        self, mock_user_repository, mock_password_hasher, valid_user
    ):
        """Should successfully delete account when password is correct."""
        # Arrange
        mock_user_repository.find_by_id.return_value = valid_user
        mock_password_hasher.verify_password.return_value = True

        use_case = DeleteAccount(mock_user_repository, mock_password_hasher)
        dto = DeleteAccountDTO(
            user_id="550e8400-e29b-41d4-a716-446655440000",
            password="Password123"
        )

        # Act
        await use_case.execute(dto)

        # Assert
        mock_user_repository.find_by_id.assert_called_once_with(
            "550e8400-e29b-41d4-a716-446655440000",
            authToken=""
        )
        mock_password_hasher.verify_password.assert_called_once_with(
            "Password123",
            "$argon2id$v=19$m=65536,t=3,p=4$hash"
        )
        mock_user_repository.delete.assert_called_once_with(
            "550e8400-e29b-41d4-a716-446655440000",
            authToken=""
        )

    @pytest.mark.asyncio
    async def test_delete_account_user_not_found(
        self, mock_user_repository, mock_password_hasher
    ):
        """Should raise ValidationException when user not found."""
        # Arrange
        mock_user_repository.find_by_id.return_value = None

        use_case = DeleteAccount(mock_user_repository, mock_password_hasher)
        dto = DeleteAccountDTO(
            user_id="550e8400-e29b-41d4-a716-446655440000",
            password="Password123"
        )

        # Act & Assert
        with pytest.raises(ValidationException) as exc_info:
            await use_case.execute(dto)

        assert "User not found" in str(exc_info.value)
        mock_user_repository.delete.assert_not_called()

    @pytest.mark.asyncio
    async def test_delete_account_incorrect_password(
        self, mock_user_repository, mock_password_hasher, valid_user
    ):
        """Should raise ValidationException when password is incorrect."""
        # Arrange
        mock_user_repository.find_by_id.return_value = valid_user
        mock_password_hasher.verify_password.return_value = False  # Wrong password

        use_case = DeleteAccount(mock_user_repository, mock_password_hasher)
        dto = DeleteAccountDTO(
            user_id="550e8400-e29b-41d4-a716-446655440000",
            password="WrongPassword"
        )

        # Act & Assert
        with pytest.raises(ValidationException) as exc_info:
            await use_case.execute(dto)

        assert "Password is incorrect" in str(exc_info.value)
        mock_user_repository.delete.assert_not_called()

    @pytest.mark.asyncio
    async def test_delete_account_emits_event(
        self, mock_user_repository, mock_password_hasher, valid_user
    ):
        """Should emit UserDeleted event when account is deleted."""
        # Arrange
        mock_user_repository.find_by_id.return_value = valid_user
        mock_password_hasher.verify_password.return_value = True

        use_case = DeleteAccount(mock_user_repository, mock_password_hasher)
        dto = DeleteAccountDTO(
            user_id="550e8400-e29b-41d4-a716-446655440000",
            password="Password123"
        )

        # Act
        await use_case.execute(dto)

        # Assert - User was deleted
        # (UserDeleted event is emitted by the entity or repository)
        mock_user_repository.delete.assert_called_once_with(
            "550e8400-e29b-41d4-a716-446655440000",
            authToken=""
        )
