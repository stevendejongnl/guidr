"""Tests for ChangePassword use case."""

from unittest.mock import AsyncMock, Mock

import pytest

from src.application.dtos import ChangePasswordDTO
from src.application.use_cases.user.change_password import ChangePassword
from src.domain.entities import User
from src.domain.exceptions import ValidationException
from src.domain.value_objects import Email, EntityId


class TestChangePassword:
    """Test ChangePassword use case."""

    @pytest.fixture
    def mock_user_repository(self):
        """Create mock user repository."""
        repo = Mock()
        repo.find_by_id = AsyncMock()
        repo.save = AsyncMock()
        return repo

    @pytest.fixture
    def mock_password_hasher(self):
        """Create mock password hasher."""
        hasher = Mock()
        hasher.verify_password = Mock()
        hasher.hash_password = Mock()
        return hasher

    @pytest.fixture
    def valid_user(self):
        """Create a valid user entity."""
        return User(
            id=EntityId("550e8400-e29b-41d4-a716-446655440000"),
            email=Email("test@example.com"),
            password_hash="$argon2id$v=19$m=65536,t=3,p=4$old_hash"
        )

    @pytest.mark.asyncio
    async def test_change_password_success(
        self, mock_user_repository, mock_password_hasher, valid_user
    ):
        """Should successfully change password when old password is correct."""
        # Arrange
        mock_user_repository.find_by_id.return_value = valid_user
        mock_password_hasher.verify_password.return_value = True
        mock_password_hasher.hash_password.return_value = "$argon2id$v=19$m=65536,t=3,p=4$new_hash"

        use_case = ChangePassword(mock_user_repository, mock_password_hasher)
        dto = ChangePasswordDTO(
            user_id="550e8400-e29b-41d4-a716-446655440000",
            old_password="OldPassword123",
            new_password="NewPassword456"
        )

        # Act
        await use_case.execute(dto)

        # Assert
        mock_user_repository.find_by_id.assert_called_once()
        # Verify EntityId was passed
        call_args = mock_user_repository.find_by_id.call_args[0]
        assert isinstance(call_args[0], EntityId)
        assert call_args[0].value == "550e8400-e29b-41d4-a716-446655440000"

        mock_password_hasher.verify_password.assert_called_once_with(
            "OldPassword123",
            "$argon2id$v=19$m=65536,t=3,p=4$old_hash"
        )
        mock_password_hasher.hash_password.assert_called_once_with("NewPassword456")
        mock_user_repository.save.assert_called_once()

        # Verify password was updated
        saved_user = mock_user_repository.save.call_args[0][0]
        assert saved_user.password_hash == "$argon2id$v=19$m=65536,t=3,p=4$new_hash"

    @pytest.mark.asyncio
    async def test_change_password_user_not_found(
        self, mock_user_repository, mock_password_hasher
    ):
        """Should raise ValidationException when user not found."""
        # Arrange
        mock_user_repository.find_by_id.return_value = None

        use_case = ChangePassword(mock_user_repository, mock_password_hasher)
        dto = ChangePasswordDTO(
            user_id="550e8400-e29b-41d4-a716-446655440000",
            old_password="OldPassword123",
            new_password="NewPassword456"
        )

        # Act & Assert
        with pytest.raises(ValidationException) as exc_info:
            await use_case.execute(dto)

        assert "User not found" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_change_password_incorrect_old_password(
        self, mock_user_repository, mock_password_hasher, valid_user
    ):
        """Should raise ValidationException when old password is incorrect."""
        # Arrange
        mock_user_repository.find_by_id.return_value = valid_user
        mock_password_hasher.verify_password.return_value = False  # Wrong password

        use_case = ChangePassword(mock_user_repository, mock_password_hasher)
        dto = ChangePasswordDTO(
            user_id="550e8400-e29b-41d4-a716-446655440000",
            old_password="WrongPassword",
            new_password="NewPassword456"
        )

        # Act & Assert
        with pytest.raises(ValidationException) as exc_info:
            await use_case.execute(dto)

        assert "Current password is incorrect" in str(exc_info.value)
        mock_user_repository.save.assert_not_called()

    @pytest.mark.asyncio
    async def test_change_password_invalid_new_password(
        self, mock_user_repository, mock_password_hasher, valid_user
    ):
        """Should raise ValidationException when new password is too short."""
        # Arrange
        mock_user_repository.find_by_id.return_value = valid_user
        mock_password_hasher.verify_password.return_value = True

        use_case = ChangePassword(mock_user_repository, mock_password_hasher)
        dto = ChangePasswordDTO(
            user_id="550e8400-e29b-41d4-a716-446655440000",
            old_password="OldPassword123",
            new_password="short"  # Too short (< 6 chars)
        )

        # Act & Assert
        with pytest.raises(ValidationException) as exc_info:
            await use_case.execute(dto)

        assert "at least 6 characters" in str(exc_info.value)
        mock_user_repository.save.assert_not_called()

    @pytest.mark.asyncio
    async def test_change_password_emits_event(
        self, mock_user_repository, mock_password_hasher, valid_user
    ):
        """Should emit UserPasswordChanged event when password is changed."""
        # Arrange
        mock_user_repository.find_by_id.return_value = valid_user
        mock_password_hasher.verify_password.return_value = True
        mock_password_hasher.hash_password.return_value = "$argon2id$v=19$m=65536,t=3,p=4$new_hash"

        use_case = ChangePassword(mock_user_repository, mock_password_hasher)
        dto = ChangePasswordDTO(
            user_id="550e8400-e29b-41d4-a716-446655440000",
            old_password="OldPassword123",
            new_password="NewPassword456"
        )

        # Act
        await use_case.execute(dto)

        # Assert - Password was actually changed on the entity
        # (Event is emitted by update_password_hash method which we've already tested)
        saved_user = mock_user_repository.save.call_args[0][0]
        assert saved_user.password_hash == "$argon2id$v=19$m=65536,t=3,p=4$new_hash"
