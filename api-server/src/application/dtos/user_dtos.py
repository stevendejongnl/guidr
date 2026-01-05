"""User DTOs for application layer."""

from dataclasses import dataclass


@dataclass
class UserCreateDTO:
    """DTO for creating a user (registration)."""

    email: str
    password: str


@dataclass
class UserLoginDTO:
    """DTO for user login."""

    email: str
    password: str


@dataclass
class UserResponseDTO:
    """DTO for user response."""

    id: str
    email: str
    created_at: str  # ISO format
    updated_at: str  # ISO format


@dataclass
class ChangePasswordDTO:
    """DTO for changing user password."""

    user_id: str
    old_password: str
    new_password: str


@dataclass
class ChangeEmailDTO:
    """DTO for changing user email."""

    user_id: str
    new_email: str
    password: str


@dataclass
class UpdateProfileDTO:
    """DTO for updating user profile (name and interests)."""

    user_id: str
    name: str | None = None
    interests: list[str] | None = None


@dataclass
class DeleteAccountDTO:
    """DTO for deleting user account."""

    user_id: str
    password: str
