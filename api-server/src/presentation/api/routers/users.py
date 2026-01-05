"""User/Auth API router."""

from fastapi import APIRouter, Depends, HTTPException, status

from src.application.dtos import UserCreateDTO, UserLoginDTO
from src.application.use_cases.user import LoginUser, RegisterUser
from src.container import Container
from src.domain.exceptions import ValidationException

from ..models import ErrorResponse, TokenResponse, UserLogin, UserRegister, UserResponse

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
