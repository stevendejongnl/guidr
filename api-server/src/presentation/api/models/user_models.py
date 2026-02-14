"""User API models."""

from pydantic import BaseModel, ConfigDict, Field


class UserRegister(BaseModel):
    """Request model for user registration."""

    email: str
    password: str

    model_config = ConfigDict(populate_by_name=True)


class UserLogin(BaseModel):
    """Request model for user login."""

    email: str
    password: str

    model_config = ConfigDict(populate_by_name=True)


class UserResponse(BaseModel):
    """Response model for a user."""

    id: str
    email: str
    created_at: str = Field(..., alias="createdAt")
    updated_at: str = Field(..., alias="updatedAt")
    name: str | None = None
    interests: list[str] | None = None
    is_admin: bool = Field(default=False, alias="isAdmin")
    is_beta: bool = Field(default=False, alias="isBeta")

    model_config = ConfigDict(populate_by_name=True)


class Token(BaseModel):
    """OAuth2 token response model (for Swagger UI authorization)."""

    access_token: str
    token_type: str


class TokenResponse(BaseModel):
    """Response model for authentication token."""

    access_token: str = Field(..., alias="accessToken")
    refresh_token: str = Field(..., alias="refreshToken")
    token_type: str = Field(..., alias="tokenType")
    user: UserResponse

    model_config = ConfigDict(populate_by_name=True)


class RefreshTokenRequest(BaseModel):
    """Request model for refreshing an access token."""

    refresh_token: str = Field(..., alias="refreshToken")

    model_config = ConfigDict(populate_by_name=True)


class ChangePasswordRequest(BaseModel):
    """Request model for changing user password."""

    old_password: str = Field(..., alias="oldPassword")
    new_password: str = Field(..., alias="newPassword")

    model_config = ConfigDict(populate_by_name=True)


class ChangeEmailRequest(BaseModel):
    """Request model for changing user email."""

    new_email: str = Field(..., alias="newEmail")
    password: str

    model_config = ConfigDict(populate_by_name=True)


class UpdateProfileRequest(BaseModel):
    """Request model for updating user profile."""

    name: str | None = None
    interests: list[str] | None = None

    model_config = ConfigDict(populate_by_name=True)


class DeleteAccountRequest(BaseModel):
    """Request model for deleting user account."""

    password: str

    model_config = ConfigDict(populate_by_name=True)
