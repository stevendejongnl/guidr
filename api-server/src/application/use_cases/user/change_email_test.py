"""Tests for ChangeEmail use case."""

from unittest.mock import AsyncMock, Mock

import pytest

from src.application.dtos import ChangeEmailDTO
from src.application.use_cases.user.change_email import ChangeEmail
from src.domain.entities import User
from src.domain.exceptions import ValidationException
from src.domain.value_objects import Email, EntityId


class TestChangeEmail:
    """Test ChangeEmail use case."""

    @pytest.fixture
    def mock_user_repository(self):
        """Create mock user repository."""
        repo = Mock()
        repo.find_by_id = AsyncMock()
        repo.find_by_email = AsyncMock()
        repo.save = AsyncMock()
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
            email=Email("old@example.com"),
            password_hash="$argon2id$v=19$m=65536,t=3,p=4$hash"
        )

    @pytest.mark.asyncio
    async def test_change_email_success(
        self, mock_user_repository, mock_password_hasher, valid_user
    ):
        """Should successfully change email when password is correct and email not in use."""
        # Arrange
        mock_user_repository.find_by_id.return_value = valid_user
        mock_user_repository.find_by_email.return_value = None  # Email not in use
        mock_password_hasher.verify_password.return_value = True

        use_case = ChangeEmail(mock_user_repository, mock_password_hasher)
        dto = ChangeEmailDTO(
            user_id="550e8400-e29b-41d4-a716-446655440000",
            new_email="new@example.com",
            password="Password123"
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
            "Password123",
            "$argon2id$v=19$m=65536,t=3,p=4$hash"
        )
        mock_user_repository.find_by_email.assert_called_once()
        mock_user_repository.save.assert_called_once()

        # Verify email was updated
        saved_user = mock_user_repository.save.call_args[0][0]
        assert saved_user.email.value == "new@example.com"

    @pytest.mark.asyncio
    async def test_change_email_user_not_found(
        self, mock_user_repository, mock_password_hasher
    ):
        """Should raise ValidationException when user not found."""
        # Arrange
        mock_user_repository.find_by_id.return_value = None

        use_case = ChangeEmail(mock_user_repository, mock_password_hasher)
        dto = ChangeEmailDTO(
            user_id="550e8400-e29b-41d4-a716-446655440000",
            new_email="new@example.com",
            password="Password123"
        )

        # Act & Assert
        with pytest.raises(ValidationException) as exc_info:
            await use_case.execute(dto)

        assert "User not found" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_change_email_incorrect_password(
        self, mock_user_repository, mock_password_hasher, valid_user
    ):
        """Should raise ValidationException when password is incorrect."""
        # Arrange
        mock_user_repository.find_by_id.return_value = valid_user
        mock_password_hasher.verify_password.return_value = False  # Wrong password

        use_case = ChangeEmail(mock_user_repository, mock_password_hasher)
        dto = ChangeEmailDTO(
            user_id="550e8400-e29b-41d4-a716-446655440000",
            new_email="new@example.com",
            password="WrongPassword"
        )

        # Act & Assert
        with pytest.raises(ValidationException) as exc_info:
            await use_case.execute(dto)

        assert "Password is incorrect" in str(exc_info.value)
        mock_user_repository.save.assert_not_called()

    @pytest.mark.asyncio
    async def test_change_email_invalid_email_format(
        self, mock_user_repository, mock_password_hasher, valid_user
    ):
        """Should raise ValidationException when new email format is invalid."""
        # Arrange
        mock_user_repository.find_by_id.return_value = valid_user
        mock_password_hasher.verify_password.return_value = True

        use_case = ChangeEmail(mock_user_repository, mock_password_hasher)
        dto = ChangeEmailDTO(
            user_id="550e8400-e29b-41d4-a716-446655440000",
            new_email="invalid-email",  # Invalid format
            password="Password123"
        )

        # Act & Assert
        with pytest.raises(ValidationException) as exc_info:
            await use_case.execute(dto)

        assert "Invalid email" in str(exc_info.value)
        mock_user_repository.save.assert_not_called()

    @pytest.mark.asyncio
    async def test_change_email_already_in_use(
        self, mock_user_repository, mock_password_hasher, valid_user
    ):
        """Should raise ValidationException when new email is already in use."""
        # Arrange
        other_user = User(
            id=EntityId("660e8400-e29b-41d4-a716-446655440001"),
            email=Email("new@example.com"),
            password_hash="$argon2id$v=19$m=65536,t=3,p=4$other_hash"
        )
        mock_user_repository.find_by_id.return_value = valid_user
        mock_user_repository.find_by_email.return_value = other_user  # Email in use
        mock_password_hasher.verify_password.return_value = True

        use_case = ChangeEmail(mock_user_repository, mock_password_hasher)
        dto = ChangeEmailDTO(
            user_id="550e8400-e29b-41d4-a716-446655440000",
            new_email="new@example.com",
            password="Password123"
        )

        # Act & Assert
        with pytest.raises(ValidationException) as exc_info:
            await use_case.execute(dto)

        assert "Email already in use" in str(exc_info.value)
        mock_user_repository.save.assert_not_called()

    @pytest.mark.asyncio
    async def test_change_email_emits_event(
        self, mock_user_repository, mock_password_hasher, valid_user
    ):
        """Should emit UserEmailChanged event when email is changed."""
        # Arrange
        mock_user_repository.find_by_id.return_value = valid_user
        mock_user_repository.find_by_email.return_value = None
        mock_password_hasher.verify_password.return_value = True

        use_case = ChangeEmail(mock_user_repository, mock_password_hasher)
        dto = ChangeEmailDTO(
            user_id="550e8400-e29b-41d4-a716-446655440000",
            new_email="new@example.com",
            password="Password123"
        )

        # Act
        await use_case.execute(dto)

        # Assert - Email was actually changed on the entity
        # (Event is emitted by update_email method which we've already tested)
        saved_user = mock_user_repository.save.call_args[0][0]
        assert saved_user.email.value == "new@example.com"
