"""Tests for User use cases."""

from unittest.mock import AsyncMock, Mock
from uuid import uuid4

import pytest

from src.domain.entities import User
from src.domain.value_objects import EntityId, Email
from src.domain.exceptions import ValidationException
from src.application.use_cases.user import RegisterUser, LoginUser
from src.application.dtos import UserCreateDTO, UserLoginDTO


@pytest.fixture
def mock_user_repository():
    """Create mock user repository."""
    return AsyncMock()


@pytest.fixture
def mock_password_hasher():
    """Create mock password hasher."""
    hasher = Mock()
    hasher.hash_password.return_value = "hashed_password"
    return hasher


@pytest.fixture
def mock_password_verifier():
    """Create mock password verifier."""
    verifier = Mock()
    verifier.verify_password.return_value = True
    return verifier


@pytest.fixture
def sample_user():
    """Create a sample user."""
    return User(
        id=EntityId(str(uuid4())),
        email=Email("test@example.com"),
        password_hash="hashed_password",
    )


class TestRegisterUser:
    """Tests for RegisterUser use case."""

    async def test_register_user_success(
        self, mock_user_repository, mock_password_hasher
    ):
        """Test successful user registration."""
        mock_user_repository.find_by_email.return_value = None
        use_case = RegisterUser(mock_user_repository, mock_password_hasher)
        dto = UserCreateDTO(email="newuser@example.com", password="password123")

        result = await use_case.execute(dto)

        assert result.email == "newuser@example.com"
        assert result.id is not None
        mock_password_hasher.hash_password.assert_called_once_with("password123")
        mock_user_repository.save.assert_called_once()

    async def test_register_user_email_exists(
        self, mock_user_repository, mock_password_hasher, sample_user
    ):
        """Test registering with existing email."""
        mock_user_repository.find_by_email.return_value = sample_user
        use_case = RegisterUser(mock_user_repository, mock_password_hasher)
        dto = UserCreateDTO(email="test@example.com", password="password123")

        with pytest.raises(ValidationException, match="Email already exists"):
            await use_case.execute(dto)

    async def test_register_user_invalid_email(
        self, mock_user_repository, mock_password_hasher
    ):
        """Test registering with invalid email."""
        use_case = RegisterUser(mock_user_repository, mock_password_hasher)
        dto = UserCreateDTO(email="invalid-email", password="password123")

        with pytest.raises(ValidationException, match="Invalid email"):
            await use_case.execute(dto)

    async def test_register_user_short_password(
        self, mock_user_repository, mock_password_hasher
    ):
        """Test registering with short password."""
        mock_user_repository.find_by_email.return_value = None
        use_case = RegisterUser(mock_user_repository, mock_password_hasher)
        dto = UserCreateDTO(email="test@example.com", password="short")

        with pytest.raises(ValidationException, match="at least 6 characters"):
            await use_case.execute(dto)


class TestLoginUser:
    """Tests for LoginUser use case."""

    async def test_login_user_success(
        self, mock_user_repository, mock_password_verifier, sample_user
    ):
        """Test successful user login."""
        mock_user_repository.find_by_email.return_value = sample_user
        use_case = LoginUser(mock_user_repository, mock_password_verifier)
        dto = UserLoginDTO(email="test@example.com", password="password123")

        result = await use_case.execute(dto)

        assert result is not None
        assert result.email == "test@example.com"
        mock_password_verifier.verify_password.assert_called_once_with(
            "password123", "hashed_password"
        )

    async def test_login_user_invalid_email(
        self, mock_user_repository, mock_password_verifier
    ):
        """Test login with non-existent email."""
        mock_user_repository.find_by_email.return_value = None
        use_case = LoginUser(mock_user_repository, mock_password_verifier)
        dto = UserLoginDTO(email="nonexistent@example.com", password="password123")

        with pytest.raises(ValidationException, match="Invalid email or password"):
            await use_case.execute(dto)

    async def test_login_user_invalid_password(
        self, mock_user_repository, mock_password_verifier, sample_user
    ):
        """Test login with invalid password."""
        mock_user_repository.find_by_email.return_value = sample_user
        mock_password_verifier.verify_password.return_value = False
        use_case = LoginUser(mock_user_repository, mock_password_verifier)
        dto = UserLoginDTO(email="test@example.com", password="wrongpassword")

        with pytest.raises(ValidationException, match="Invalid email or password"):
            await use_case.execute(dto)
