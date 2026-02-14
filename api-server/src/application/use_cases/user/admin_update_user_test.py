"""Tests for AdminUpdateUser use case."""

from unittest.mock import AsyncMock, Mock

import pytest

from src.application.dtos import AdminUpdateUserDTO
from src.application.use_cases.user.admin_update_user import AdminUpdateUser
from src.domain.entities import User
from src.domain.exceptions import ValidationException
from src.domain.value_objects import Email, EntityId, Role, RoleType

ADMIN_ID = "550e8400-e29b-41d4-a716-446655440001"
USER_ID = "550e8400-e29b-41d4-a716-446655440000"


class TestAdminUpdateUser:
    """Test AdminUpdateUser use case."""

    @pytest.fixture
    def mock_user_repository(self):
        """Create mock user repository."""
        repo = Mock()
        repo.find_by_id = AsyncMock()
        repo.save = AsyncMock()
        return repo

    @pytest.fixture
    def target_user(self):
        """Create a target user entity."""
        return User(
            id=EntityId(USER_ID),
            email=Email("target@example.com"),
            password_hash="$argon2id$v=19$m=65536,t=3,p=4$hash",
        )

    @pytest.mark.asyncio
    async def test_update_role_to_admin(
        self, mock_user_repository, target_user
    ):
        """Should update user role to admin."""
        mock_user_repository.find_by_id.return_value = target_user

        use_case = AdminUpdateUser(mock_user_repository)
        dto = AdminUpdateUserDTO(user_id=USER_ID, role="admin")

        await use_case.execute(dto, admin_user_id=ADMIN_ID)

        saved_user = mock_user_repository.save.call_args[0][0]
        assert saved_user.is_admin is True

    @pytest.mark.asyncio
    async def test_update_role_to_user(
        self, mock_user_repository
    ):
        """Should update user role to regular user."""
        admin_target = User(
            id=EntityId(USER_ID),
            email=Email("target@example.com"),
            password_hash="$argon2id$v=19$m=65536,t=3,p=4$hash",
            role=Role(RoleType.ADMIN),
        )
        mock_user_repository.find_by_id.return_value = admin_target

        use_case = AdminUpdateUser(mock_user_repository)
        dto = AdminUpdateUserDTO(user_id=USER_ID, role="user")

        await use_case.execute(dto, admin_user_id=ADMIN_ID)

        saved_user = mock_user_repository.save.call_args[0][0]
        assert saved_user.is_admin is False

    @pytest.mark.asyncio
    async def test_update_beta_status(
        self, mock_user_repository, target_user
    ):
        """Should toggle beta status."""
        mock_user_repository.find_by_id.return_value = target_user

        use_case = AdminUpdateUser(mock_user_repository)
        dto = AdminUpdateUserDTO(user_id=USER_ID, is_beta=True)

        await use_case.execute(dto, admin_user_id=ADMIN_ID)

        saved_user = mock_user_repository.save.call_args[0][0]
        assert saved_user.is_beta is True

    @pytest.mark.asyncio
    async def test_update_name(
        self, mock_user_repository, target_user
    ):
        """Should update user name."""
        mock_user_repository.find_by_id.return_value = target_user

        use_case = AdminUpdateUser(mock_user_repository)
        dto = AdminUpdateUserDTO(user_id=USER_ID, name="New Name")

        await use_case.execute(dto, admin_user_id=ADMIN_ID)

        saved_user = mock_user_repository.save.call_args[0][0]
        assert saved_user.name == "New Name"

    @pytest.mark.asyncio
    async def test_update_interests(
        self, mock_user_repository, target_user
    ):
        """Should update user interests."""
        mock_user_repository.find_by_id.return_value = target_user

        use_case = AdminUpdateUser(mock_user_repository)
        dto = AdminUpdateUserDTO(
            user_id=USER_ID, interests=["cooking", "sports"]
        )

        await use_case.execute(dto, admin_user_id=ADMIN_ID)

        saved_user = mock_user_repository.save.call_args[0][0]
        assert saved_user.interests == ["cooking", "sports"]

    @pytest.mark.asyncio
    async def test_update_preferred_languages(
        self, mock_user_repository, target_user
    ):
        """Should update preferred languages."""
        mock_user_repository.find_by_id.return_value = target_user

        use_case = AdminUpdateUser(mock_user_repository)
        dto = AdminUpdateUserDTO(
            user_id=USER_ID, preferred_languages=["en", "nl"]
        )

        await use_case.execute(dto, admin_user_id=ADMIN_ID)

        saved_user = mock_user_repository.save.call_args[0][0]
        assert saved_user.preferred_languages == ["en", "nl"]

    @pytest.mark.asyncio
    async def test_update_multiple_fields(
        self, mock_user_repository, target_user
    ):
        """Should update multiple fields at once."""
        mock_user_repository.find_by_id.return_value = target_user

        use_case = AdminUpdateUser(mock_user_repository)
        dto = AdminUpdateUserDTO(
            user_id=USER_ID,
            role="admin",
            is_beta=True,
            name="Admin User",
        )

        await use_case.execute(dto, admin_user_id=ADMIN_ID)

        saved_user = mock_user_repository.save.call_args[0][0]
        assert saved_user.is_admin is True
        assert saved_user.is_beta is True
        assert saved_user.name == "Admin User"

    @pytest.mark.asyncio
    async def test_user_not_found(self, mock_user_repository):
        """Should raise ValidationException when user not found."""
        mock_user_repository.find_by_id.return_value = None

        use_case = AdminUpdateUser(mock_user_repository)
        dto = AdminUpdateUserDTO(user_id=USER_ID, role="admin")

        with pytest.raises(ValidationException) as exc_info:
            await use_case.execute(dto, admin_user_id=ADMIN_ID)

        assert "User not found" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_prevent_self_demotion(
        self, mock_user_repository
    ):
        """Should prevent admin from removing their own admin role."""
        admin_user = User(
            id=EntityId(ADMIN_ID),
            email=Email("admin@example.com"),
            password_hash="$argon2id$v=19$m=65536,t=3,p=4$hash",
            role=Role(RoleType.ADMIN),
        )
        mock_user_repository.find_by_id.return_value = admin_user

        use_case = AdminUpdateUser(mock_user_repository)
        dto = AdminUpdateUserDTO(user_id=ADMIN_ID, role="user")

        with pytest.raises(ValidationException) as exc_info:
            await use_case.execute(dto, admin_user_id=ADMIN_ID)

        assert "Cannot remove your own admin role" in str(exc_info.value)
        mock_user_repository.save.assert_not_called()

    @pytest.mark.asyncio
    async def test_allow_self_update_non_role_fields(
        self, mock_user_repository
    ):
        """Should allow admin to update their own non-role fields."""
        admin_user = User(
            id=EntityId(ADMIN_ID),
            email=Email("admin@example.com"),
            password_hash="$argon2id$v=19$m=65536,t=3,p=4$hash",
            role=Role(RoleType.ADMIN),
        )
        mock_user_repository.find_by_id.return_value = admin_user

        use_case = AdminUpdateUser(mock_user_repository)
        dto = AdminUpdateUserDTO(
            user_id=ADMIN_ID, is_beta=True, name="Admin"
        )

        await use_case.execute(dto, admin_user_id=ADMIN_ID)

        saved_user = mock_user_repository.save.call_args[0][0]
        assert saved_user.is_beta is True
        assert saved_user.name == "Admin"

    @pytest.mark.asyncio
    async def test_skip_none_fields(
        self, mock_user_repository, target_user
    ):
        """Should skip fields that are None (no change)."""
        target_user.update_name("Original Name")
        mock_user_repository.find_by_id.return_value = target_user

        use_case = AdminUpdateUser(mock_user_repository)
        dto = AdminUpdateUserDTO(user_id=USER_ID, is_beta=True)

        await use_case.execute(dto, admin_user_id=ADMIN_ID)

        saved_user = mock_user_repository.save.call_args[0][0]
        assert saved_user.name == "Original Name"
        assert saved_user.is_beta is True
