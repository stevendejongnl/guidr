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
