"""User/Auth API router."""

from fastapi import APIRouter, HTTPException, status, Depends

from src.domain.exceptions import ValidationException
from src.application.use_cases.user import RegisterUser, LoginUser
from src.application.dtos import UserCreateDTO, UserLoginDTO
from ..models import UserRegister, UserLogin, UserResponse, TokenResponse, ErrorResponse

router = APIRouter(prefix="/auth", tags=["auth"])


# Container (injected at app startup)
_container = None


def set_container(container):
    """Set the DI container for this router."""
    global _container
    _container = container


# Dependency providers
def get_register_user_use_case() -> RegisterUser:
    return _container.register_user_use_case()


def get_login_user_use_case() -> LoginUser:
    return _container.login_user_use_case()


def get_jwt_service():
    """Get JWT service for token generation."""
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
            access_token=token,
            token_type="bearer",
            user=UserResponse(
                id=result.id,
                email=result.email,
                created_at=result.created_at,
                updated_at=result.updated_at,
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
            access_token=token,
            token_type="bearer",
            user=UserResponse(
                id=result.id,
                email=result.email,
                created_at=result.created_at,
                updated_at=result.updated_at,
            ),
        )
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
