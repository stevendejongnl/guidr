import pytest
from src.domain.value_objects import Password
from src.domain.exceptions import ValidationException


class TestPassword:
    """Test Password value object."""

    def test_create_with_valid_password(self):
        """Should create Password with valid password."""
        password = Password("securepass123")

        assert password.value == "securepass123"

    def test_create_with_minimum_length(self):
        """Should create Password with minimum length."""
        min_password = "123456"  # Exactly 6 characters
        password = Password(min_password)

        assert password.value == min_password

    def test_create_with_short_password(self):
        """Should raise ValidationException for short password."""
        with pytest.raises(ValidationException) as exc_info:
            Password("12345")  # Only 5 characters

        assert "at least 6 characters" in str(exc_info.value)

    def test_create_with_empty_password(self):
        """Should raise ValidationException for empty password."""
        with pytest.raises(ValidationException) as exc_info:
            Password("")

        assert "cannot be empty" in str(exc_info.value)

    def test_immutability(self):
        """Should be immutable."""
        password = Password("securepass123")

        with pytest.raises(AttributeError):
            password.value = "newpassword"

    def test_str_returns_masked(self):
        """Should return masked representation for security."""
        password = Password("securepass123")

        assert str(password) == "********"
        assert "securepass123" not in str(password)

    def test_repr_returns_masked(self):
        """Should return masked representation in repr."""
        password = Password("securepass123")

        assert "********" in repr(password)
        assert "securepass123" not in repr(password)

    def test_equality(self):
        """Should be equal when values match."""
        password1 = Password("securepass123")
        password2 = Password("securepass123")

        assert password1 == password2

    def test_value_accessible(self):
        """Should allow access to actual value for hashing."""
        password = Password("securepass123")

        # Value is accessible for hashing purposes
        assert password.value == "securepass123"
