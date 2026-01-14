"""Authentication dependencies for protected endpoints."""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from src.container import Container
from src.domain.entities import User
from src.domain.repositories import IUserRepository
from src.domain.value_objects.entity_id import EntityId
from src.infrastructure.auth import JWTService

# Container reference (set by router initialization)
_container: Container | None = None

# OAuth2 scheme for automatic Swagger UI authorization
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def set_container(container):
    """Set the DI container for auth dependencies."""
    global _container
    _container = container


def get_jwt_service() -> JWTService:
    """Get JWT service from container."""
    assert _container is not None, "Container not initialized"
    return _container.jwt_service()


def get_user_repository() -> IUserRepository:
    """Get user repository from container."""
    assert _container is not None, "Container not initialized"
    return _container.user_repository()


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    jwt_service: JWTService = Depends(get_jwt_service),
    user_repository: IUserRepository = Depends(get_user_repository),
) -> User:
    """Extract and validate authenticated user from JWT Bearer token.

    Args:
        token: JWT Bearer token from Authorization header
        jwt_service: Service for JWT token validation
        user_repository: Repository to fetch user entity

    Returns:
        User entity for the authenticated user

    Raises:
        HTTPException(401): If token is missing, invalid, expired, or user not found
    """
    # Verify JWT token
    payload = jwt_service.verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Extract user ID from token payload
    user_id = payload.get("sub")
    if not isinstance(user_id, str) or user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Fetch user from repository
    user_entity_id = EntityId(user_id)
    user = await user_repository.find_by_id(user_entity_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_current_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Extract and validate authenticated admin user from JWT Bearer token.

    Args:
        current_user: User from JWT token (via get_current_user dependency)

    Returns:
        User entity for the authenticated admin user

    Raises:
        HTTPException(403): If user is not an admin
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user
