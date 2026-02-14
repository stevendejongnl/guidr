"""Admin update user use case."""

from src.application.dtos import AdminUpdateUserDTO
from src.domain.exceptions import ValidationException
from src.domain.repositories import IUserRepository
from src.domain.value_objects import EntityId, Role


class AdminUpdateUser:
    """Use case for admin updating any user's properties."""

    def __init__(
        self,
        user_repository: IUserRepository,
    ):
        self._user_repository = user_repository

    async def execute(
        self, dto: AdminUpdateUserDTO, admin_user_id: str
    ) -> None:
        """Execute the admin update user use case.

        Args:
            dto: Admin update user data transfer object
            admin_user_id: ID of the admin performing the update

        Raises:
            ValidationException: If user not found or invalid operation
        """
        user_id = EntityId(dto.user_id)
        user = await self._user_repository.find_by_id(user_id)
        if user is None:
            raise ValidationException("User not found")

        # Prevent admin from demoting themselves
        if dto.role is not None and dto.user_id == admin_user_id:
            new_role = Role(dto.role)
            if not new_role.is_admin():
                raise ValidationException(
                    "Cannot remove your own admin role"
                )

        if dto.role is not None:
            user.set_role(Role(dto.role))

        if dto.is_beta is not None:
            user.set_beta(dto.is_beta)

        if dto.name is not None:
            user.update_name(dto.name)

        if dto.interests is not None:
            user.set_interests(dto.interests)

        if dto.preferred_languages is not None:
            user.set_preferred_languages(dto.preferred_languages)

        await self._user_repository.save(user)
