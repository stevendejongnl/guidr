"""Tests for UpdateProfile use case."""

from unittest.mock import AsyncMock, Mock

import pytest

from src.application.dtos import UpdateProfileDTO
from src.application.use_cases.user.update_profile import UpdateProfile
from src.domain.entities import User
from src.domain.exceptions import ValidationException
from src.domain.value_objects import Email, EntityId


class TestUpdateProfile:
    """Test UpdateProfile use case."""

    @pytest.fixture
    def mock_user_repository(self):
        """Create mock user repository."""
        repo = Mock()
        repo.find_by_id = AsyncMock()
        repo.save = AsyncMock()
        return repo

    @pytest.fixture
    def valid_user(self):
        """Create a valid user entity."""
        return User(
            id=EntityId("550e8400-e29b-41d4-a716-446655440000"),
            email=Email("test@example.com"),
            password_hash="$argon2id$v=19$m=65536,t=3,p=4$hash"
        )

    @pytest.mark.asyncio
    async def test_update_name_only(self, mock_user_repository, valid_user):
        """Should successfully update user name only."""
        # Arrange
        mock_user_repository.find_by_id.return_value = valid_user

        use_case = UpdateProfile(mock_user_repository)
        dto = UpdateProfileDTO(
            user_id="550e8400-e29b-41d4-a716-446655440000",
            name="John Doe",
            interests=None
        )

        # Act
        await use_case.execute(dto)

        # Assert
        mock_user_repository.find_by_id.assert_called_once_with(
            "550e8400-e29b-41d4-a716-446655440000",
            authToken=""
        )
        mock_user_repository.save.assert_called_once()

        # Verify name was updated
        saved_user = mock_user_repository.save.call_args[0][0]
        assert saved_user.name == "John Doe"

    @pytest.mark.asyncio
    async def test_update_interests_only(self, mock_user_repository, valid_user):
        """Should successfully update user interests only."""
        # Arrange
        mock_user_repository.find_by_id.return_value = valid_user

        use_case = UpdateProfile(mock_user_repository)
        dto = UpdateProfileDTO(
            user_id="550e8400-e29b-41d4-a716-446655440000",
            name=None,
            interests=["baking", "sports"]
        )

        # Act
        await use_case.execute(dto)

        # Assert
        mock_user_repository.save.assert_called_once()

        # Verify interests were updated
        saved_user = mock_user_repository.save.call_args[0][0]
        assert saved_user.interests == ["baking", "sports"]

    @pytest.mark.asyncio
    async def test_update_both_name_and_interests(
        self, mock_user_repository, valid_user
    ):
        """Should successfully update both name and interests."""
        # Arrange
        mock_user_repository.find_by_id.return_value = valid_user

        use_case = UpdateProfile(mock_user_repository)
        dto = UpdateProfileDTO(
            user_id="550e8400-e29b-41d4-a716-446655440000",
            name="Jane Doe",
            interests=["cooking", "workouts"]
        )

        # Act
        await use_case.execute(dto)

        # Assert
        mock_user_repository.save.assert_called_once()

        # Verify both were updated
        saved_user = mock_user_repository.save.call_args[0][0]
        assert saved_user.name == "Jane Doe"
        assert saved_user.interests == ["cooking", "workouts"]

    @pytest.mark.asyncio
    async def test_update_profile_user_not_found(self, mock_user_repository):
        """Should raise ValidationException when user not found."""
        # Arrange
        mock_user_repository.find_by_id.return_value = None

        use_case = UpdateProfile(mock_user_repository)
        dto = UpdateProfileDTO(
            user_id="550e8400-e29b-41d4-a716-446655440000",
            name="John Doe"
        )

        # Act & Assert
        with pytest.raises(ValidationException) as exc_info:
            await use_case.execute(dto)

        assert "User not found" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_update_profile_no_changes(self, mock_user_repository, valid_user):
        """Should handle case where no fields are provided."""
        # Arrange
        mock_user_repository.find_by_id.return_value = valid_user

        use_case = UpdateProfile(mock_user_repository)
        dto = UpdateProfileDTO(
            user_id="550e8400-e29b-41d4-a716-446655440000",
            name=None,
            interests=None
        )

        # Act
        await use_case.execute(dto)

        # Assert - save is still called even if no changes
        mock_user_repository.save.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_profile_with_empty_name(
        self, mock_user_repository, valid_user
    ):
        """Should allow empty string to clear name."""
        # Arrange
        mock_user_repository.find_by_id.return_value = valid_user

        use_case = UpdateProfile(mock_user_repository)
        dto = UpdateProfileDTO(
            user_id="550e8400-e29b-41d4-a716-446655440000",
            name="",
            interests=None
        )

        # Act
        await use_case.execute(dto)

        # Assert
        mock_user_repository.save.assert_called_once()
        saved_user = mock_user_repository.save.call_args[0][0]
        assert saved_user.name == ""

    @pytest.mark.asyncio
    async def test_update_profile_with_empty_interests(
        self, mock_user_repository, valid_user
    ):
        """Should allow empty list to clear interests."""
        # Arrange
        mock_user_repository.find_by_id.return_value = valid_user

        use_case = UpdateProfile(mock_user_repository)
        dto = UpdateProfileDTO(
            user_id="550e8400-e29b-41d4-a716-446655440000",
            name=None,
            interests=[]
        )

        # Act
        await use_case.execute(dto)

        # Assert
        mock_user_repository.save.assert_called_once()
        saved_user = mock_user_repository.save.call_args[0][0]
        assert saved_user.interests == []
