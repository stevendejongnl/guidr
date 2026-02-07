"""User/Auth API router."""

from fastapi import APIRouter, Depends, Form, HTTPException, status
from fastapi.responses import JSONResponse

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
from src.domain.value_objects import EntityId
from src.infrastructure.auth.token_hasher import hash_token, verify_token_hash

from ..dependencies.auth import get_current_user
from ..models import (
    ChangeEmailRequest,
    ChangePasswordRequest,
    DeleteAccountRequest,
    ErrorResponse,
    RefreshTokenRequest,
    UpdateProfileRequest,
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


def get_user_repository():
    """Get user repository."""
    assert _container is not None, "Container not initialized"
    return _container.user_repository()


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
    status_code=status.HTTP_201_CREATED,
    responses={400: {"model": ErrorResponse}},
)
async def register(
    user: UserRegister,
    use_case: RegisterUser = Depends(get_register_user_use_case),
    jwt_service=Depends(get_jwt_service),
    user_repository=Depends(get_user_repository),
):
    """Register a new user and return access token.

    Returns both OAuth2-compatible format (for Swagger UI) and client format.
    """
    try:
        dto = UserCreateDTO(email=user.email, password=user.password)
        result = await use_case.execute(dto)

        # Generate JWT tokens
        token_data = {"sub": result.id}
        access_token = jwt_service.create_access_token(data=token_data)
        refresh_token = jwt_service.create_refresh_token(data=token_data)

        # Store refresh token hash on user
        user_entity = await user_repository.find_by_id(EntityId(result.id))
        if user_entity:
            user_entity.update_refresh_token_hash(hash_token(refresh_token))
            await user_repository.save(user_entity)

        # Return response with both OAuth2 format and client format
        user_response = UserResponse(
            id=result.id,
            email=result.email,
            createdAt=result.created_at,
            updatedAt=result.updated_at,
            name=result.name,
            interests=result.interests,
            isAdmin=result.is_admin,
        )

        # Build response dict with OAuth2 format (snake_case) and client format (camelCase)
        response_data = {
            "access_token": access_token,  # OAuth2 format for Swagger UI
            "token_type": "bearer",  # OAuth2 format for Swagger UI
            "accessToken": access_token,  # Client format (backward compatibility)
            "refreshToken": refresh_token,
            "tokenType": "bearer",  # Client format (backward compatibility)
            "user": user_response.model_dump(by_alias=True),
        }

        return JSONResponse(status_code=status.HTTP_201_CREATED, content=response_data)
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post(
    "/login",
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}},
)
async def login(
    username: str = Form(...),
    password: str = Form(...),
    use_case: LoginUser = Depends(get_login_user_use_case),
    jwt_service=Depends(get_jwt_service),
    user_repository=Depends(get_user_repository),
):
    """Login and return access token.

    Accepts form data (OAuth2 password grant) for Swagger UI compatibility.
    The 'username' field is treated as email for login purposes.

    Returns both OAuth2-compatible format (for Swagger UI) and client format.
    """
    try:
        # Use username as email for authentication (OAuth2 standard compliance)
        dto = UserLoginDTO(email=username, password=password)
        result = await use_case.execute(dto)

        if not result:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        # Generate JWT tokens
        token_data = {"sub": result.id}
        access_token = jwt_service.create_access_token(data=token_data)
        refresh_token = jwt_service.create_refresh_token(data=token_data)

        # Store refresh token hash on user
        user_entity = await user_repository.find_by_id(EntityId(result.id))
        if user_entity:
            user_entity.update_refresh_token_hash(hash_token(refresh_token))
            await user_repository.save(user_entity)

        # Return response with both OAuth2 format and client format
        user_response = UserResponse(
            id=result.id,
            email=result.email,
            createdAt=result.created_at,
            updatedAt=result.updated_at,
            name=result.name,
            interests=result.interests,
            isAdmin=result.is_admin,
        )

        # Build response dict with OAuth2 format (snake_case) and client format (camelCase)
        response_data = {
            "access_token": access_token,  # OAuth2 format for Swagger UI
            "token_type": "bearer",  # OAuth2 format for Swagger UI
            "accessToken": access_token,  # Client format (backward compatibility)
            "refreshToken": refresh_token,
            "tokenType": "bearer",  # Client format (backward compatibility)
            "user": user_response.model_dump(by_alias=True),
        }

        return JSONResponse(status_code=status.HTTP_200_OK, content=response_data)
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post(
    "/refresh",
    responses={401: {"model": ErrorResponse}},
)
async def refresh(
    request: RefreshTokenRequest,
    jwt_service=Depends(get_jwt_service),
    user_repository=Depends(get_user_repository),
):
    """Refresh access token using a refresh token.

    Implements token rotation: each refresh token can only be used once.
    A new refresh token is issued with each refresh.
    """
    # Verify the refresh token JWT
    payload = jwt_service.verify_refresh_token(request.refresh_token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    # Extract user ID
    user_id = payload.get("sub")
    if not isinstance(user_id, str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token payload",
        )

    # Fetch user
    user = await user_repository.find_by_id(EntityId(user_id))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    # Verify refresh token hash matches (rotation check)
    if user.refresh_token_hash is None or not verify_token_hash(
        request.refresh_token, user.refresh_token_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked",
        )

    # Generate new tokens (rotation)
    token_data = {"sub": user.id.value}
    new_access_token = jwt_service.create_access_token(data=token_data)
    new_refresh_token = jwt_service.create_refresh_token(data=token_data)

    # Store new refresh token hash
    user.update_refresh_token_hash(hash_token(new_refresh_token))
    await user_repository.save(user)

    user_response = UserResponse(
        id=user.id.value,
        email=user.email.value,
        createdAt=user.created_at.isoformat(),
        updatedAt=user.updated_at.isoformat(),
        name=user.name,
        interests=user.interests,
        isAdmin=user.is_admin,
    )

    response_data = {
        "accessToken": new_access_token,
        "refreshToken": new_refresh_token,
        "tokenType": "bearer",
        "user": user_response.model_dump(by_alias=True),
    }

    return JSONResponse(status_code=status.HTTP_200_OK, content=response_data)


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
    status_code=status.HTTP_200_OK,
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}},
)
async def change_email(
    request: ChangeEmailRequest,
    current_user: User = Depends(get_current_user),
    use_case: ChangeEmail = Depends(get_change_email_use_case),
    jwt_service=Depends(get_jwt_service),
    user_repository=Depends(get_user_repository),
):
    """Change user email (requires authentication).

    Args:
        request: Email change request with new email and password
        current_user: Authenticated user from JWT token
        use_case: Email change use case
        jwt_service: JWT service for token generation
        user_repository: User repository

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

        # Generate new JWT tokens with updated email
        token_data = {"sub": current_user.id.value}
        access_token = jwt_service.create_access_token(data=token_data)
        refresh_token = jwt_service.create_refresh_token(data=token_data)

        # Store new refresh token hash
        current_user.update_refresh_token_hash(hash_token(refresh_token))
        await user_repository.save(current_user)

        user_response = UserResponse(
            id=current_user.id.value,
            email=updated_email,
            createdAt=current_user.created_at.isoformat(),
            updatedAt=current_user.updated_at.isoformat(),
            name=current_user.name,
            interests=current_user.interests,
            isAdmin=current_user.is_admin,
        )

        response_data = {
            "accessToken": access_token,
            "refreshToken": refresh_token,
            "tokenType": "bearer",
            "user": user_response.model_dump(by_alias=True),
        }

        return JSONResponse(status_code=status.HTTP_200_OK, content=response_data)
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/profile",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    responses={401: {"model": ErrorResponse}},
)
async def get_profile(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Get current user profile (requires authentication).

    Args:
        current_user: Authenticated user from JWT token

    Returns:
        Current user data including name and interests

    Raises:
        HTTPException 401: If authentication fails
    """
    return UserResponse(
        id=current_user.id.value,
        email=current_user.email.value,
        createdAt=current_user.created_at.isoformat(),
        updatedAt=current_user.updated_at.isoformat(),
        name=current_user.name,
        interests=current_user.interests,
        isAdmin=current_user.is_admin,
    )


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
            isAdmin=current_user.is_admin,
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
