"""User/Auth API router."""

from fastapi import APIRouter, Depends, HTTPException, status

from src.application.dtos import (
    ChangeEmailDTO,
    ChangePasswordDTO,
    DeleteAccountDTO,
    UpdateProfileDTO,
    UserCreateDTO,
    UserLoginDTO,
)
from src.application.use_cases.user import (
    ChangeEmail,
    ChangePassword,
    DeleteAccount,
    LoginUser,
    RegisterUser,
    UpdateProfile,
)
from src.container import Container
from src.domain.entities import User
from src.domain.exceptions import ValidationException

from ..dependencies.auth import get_current_user
from ..models import (
    ChangeEmailRequest,
    ChangePasswordRequest,
    DeleteAccountRequest,
    ErrorResponse,
    TokenResponse,
    UpdateProfileRequest,
    UserLogin,
    UserRegister,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


# Container (injected at app startup)
_container: Container | None = None


def set_container(container: Container) -> None:
    """Set the DI container for this router."""
    global _container
    _container = container


# Dependency providers
def get_register_user_use_case() -> RegisterUser:
    assert _container is not None, "Container not initialized"
    return _container.register_user_use_case()


def get_login_user_use_case() -> LoginUser:
    assert _container is not None, "Container not initialized"
    return _container.login_user_use_case()


def get_jwt_service():
    """Get JWT service for token generation."""
    assert _container is not None, "Container not initialized"
    return _container.jwt_service()


def get_change_password_use_case() -> ChangePassword:
    """Get ChangePassword use case."""
    assert _container is not None, "Container not initialized"
    return _container.change_password_use_case()


def get_change_email_use_case() -> ChangeEmail:
    """Get ChangeEmail use case."""
    assert _container is not None, "Container not initialized"
    return _container.change_email_use_case()


def get_update_profile_use_case() -> UpdateProfile:
    """Get UpdateProfile use case."""
    assert _container is not None, "Container not initialized"
    return _container.update_profile_use_case()


def get_delete_account_use_case() -> DeleteAccount:
    """Get DeleteAccount use case."""
    assert _container is not None, "Container not initialized"
    return _container.delete_account_use_case()


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    responses={400: {"model": ErrorResponse}},
)
async def register(
    user: UserRegister,
    use_case: RegisterUser = Depends(get_register_user_use_case),
    jwt_service=Depends(get_jwt_service),
) -> TokenResponse:
    """Register a new user and return access token."""
    try:
        dto = UserCreateDTO(email=user.email, password=user.password)
        result = await use_case.execute(dto)

        # Generate JWT token
        token = jwt_service.create_access_token(data={"sub": result.id})

        return TokenResponse(
            accessToken=token,
            tokenType="bearer",
            user=UserResponse(
                id=result.id,
                email=result.email,
                createdAt=result.created_at,
                updatedAt=result.updated_at,
            ),
        )
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post(
    "/login",
    response_model=TokenResponse,
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}},
)
async def login(
    user: UserLogin,
    use_case: LoginUser = Depends(get_login_user_use_case),
    jwt_service=Depends(get_jwt_service),
) -> TokenResponse:
    """Login and return access token."""
    try:
        dto = UserLoginDTO(email=user.email, password=user.password)
        result = await use_case.execute(dto)

        if not result:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        # Generate JWT token
        token = jwt_service.create_access_token(data={"sub": result.id})

        return TokenResponse(
            accessToken=token,
            tokenType="bearer",
            user=UserResponse(
                id=result.id,
                email=result.email,
                createdAt=result.created_at,
                updatedAt=result.updated_at,
            ),
        )
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post(
    "/change-password",
    status_code=status.HTTP_200_OK,
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}},
)
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    use_case: ChangePassword = Depends(get_change_password_use_case),
) -> dict:
    """Change user password (requires authentication).

    Args:
        request: Password change request with old and new passwords
        current_user: Authenticated user from JWT token
        use_case: Password change use case

    Returns:
        Success message

    Raises:
        HTTPException 400: If old password incorrect or new password invalid
        HTTPException 401: If authentication fails
    """
    try:
        dto = ChangePasswordDTO(
            user_id=current_user.id.value,
            old_password=request.old_password,
            new_password=request.new_password,
        )
        await use_case.execute(dto)

        return {"message": "Password changed successfully"}
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post(
    "/change-email",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}},
)
async def change_email(
    request: ChangeEmailRequest,
    current_user: User = Depends(get_current_user),
    use_case: ChangeEmail = Depends(get_change_email_use_case),
    jwt_service=Depends(get_jwt_service),
) -> TokenResponse:
    """Change user email (requires authentication).

    Args:
        request: Email change request with new email and password
        current_user: Authenticated user from JWT token
        use_case: Email change use case
        jwt_service: JWT service for token generation

    Returns:
        New access token with updated email and user data

    Raises:
        HTTPException 400: If password incorrect, email invalid, or email in use
        HTTPException 401: If authentication fails
    """
    try:
        dto = ChangeEmailDTO(
            user_id=current_user.id.value,
            new_email=request.new_email,
            password=request.password,
        )
        await use_case.execute(dto)

        # Fetch updated user to get new email
        # (User entity was updated in use case)
        updated_email = current_user.email.value

        # Generate new JWT token with updated email
        token = jwt_service.create_access_token(data={"sub": current_user.id.value})

        return TokenResponse(
            accessToken=token,
            tokenType="bearer",
            user=UserResponse(
                id=current_user.id.value,
                email=updated_email,
                createdAt=current_user.created_at.isoformat(),
                updatedAt=current_user.updated_at.isoformat(),
            ),
        )
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch(
    "/profile",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}},
)
async def update_profile(
    request: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    use_case: UpdateProfile = Depends(get_update_profile_use_case),
) -> UserResponse:
    """Update user profile (name and interests, requires authentication).

    Args:
        request: Profile update request with optional name and interests
        current_user: Authenticated user from JWT token
        use_case: Profile update use case

    Returns:
        Updated user data

    Raises:
        HTTPException 400: If validation fails
        HTTPException 401: If authentication fails
    """
    try:
        dto = UpdateProfileDTO(
            user_id=current_user.id.value,
            name=request.name,
            interests=request.interests,
        )
        await use_case.execute(dto)

        # Return updated user data
        return UserResponse(
            id=current_user.id.value,
            email=current_user.email.value,
            createdAt=current_user.created_at.isoformat(),
            updatedAt=current_user.updated_at.isoformat(),
            name=current_user.name,
            interests=current_user.interests,
        )
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete(
    "/account",
    status_code=status.HTTP_200_OK,
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}},
)
async def delete_account(
    request: DeleteAccountRequest,
    current_user: User = Depends(get_current_user),
    use_case: DeleteAccount = Depends(get_delete_account_use_case),
) -> dict:
    """Delete user account (requires authentication and password verification).

    Args:
        request: Account deletion request with password verification
        current_user: Authenticated user from JWT token
        use_case: Account deletion use case

    Returns:
        Success message

    Raises:
        HTTPException 400: If password incorrect
        HTTPException 401: If authentication fails
    """
    try:
        dto = DeleteAccountDTO(
            user_id=current_user.id.value,
            password=request.password,
        )
        await use_case.execute(dto)

        return {"message": "Account deleted successfully"}
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
