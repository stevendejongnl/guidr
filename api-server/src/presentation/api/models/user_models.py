"""User API models."""

from pydantic import BaseModel, Field


class UserRegister(BaseModel):
    """Request model for user registration."""

    email: str
    password: str

    class Config:
        """Pydantic config."""

        populate_by_name = True


class UserLogin(BaseModel):
    """Request model for user login."""

    email: str
    password: str

    class Config:
        """Pydantic config."""

        populate_by_name = True


class UserResponse(BaseModel):
    """Response model for a user."""

    id: str
    email: str
    created_at: str = Field(..., alias="createdAt")
    updated_at: str = Field(..., alias="updatedAt")
    name: str | None = None
    interests: list[str] | None = None

    class Config:
        """Pydantic config."""

        populate_by_name = True


class TokenResponse(BaseModel):
    """Response model for authentication token."""

    access_token: str = Field(..., alias="accessToken")
    token_type: str = Field(..., alias="tokenType")
    user: UserResponse

    class Config:
        """Pydantic config."""

        populate_by_name = True


class ChangePasswordRequest(BaseModel):
    """Request model for changing user password."""

    old_password: str = Field(..., alias="oldPassword")
    new_password: str = Field(..., alias="newPassword")

    class Config:
        """Pydantic config."""

        populate_by_name = True


class ChangeEmailRequest(BaseModel):
    """Request model for changing user email."""

    new_email: str = Field(..., alias="newEmail")
    password: str

    class Config:
        """Pydantic config."""

        populate_by_name = True


class UpdateProfileRequest(BaseModel):
    """Request model for updating user profile."""

    name: str | None = None
    interests: list[str] | None = None

    class Config:
        """Pydantic config."""

        populate_by_name = True


class DeleteAccountRequest(BaseModel):
    """Request model for deleting user account."""

    password: str

    class Config:
        """Pydantic config."""

        populate_by_name = True
