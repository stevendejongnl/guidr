import pytest
from src.domain.value_objects import Email
from src.domain.exceptions import ValidationException


class TestEmail:
    """Test Email value object."""

    @pytest.mark.parametrize("valid_email", [
        "test@example.com",
        "user+tag@domain.co.uk",
        "admin@guidr.com",
        "name.surname@company.org",
        "a@b.co",
    ])
    def test_create_with_valid_email(self, valid_email):
        """Should create Email with valid email format."""
        email = Email(valid_email)

        assert email.value == valid_email
        assert str(email) == valid_email

    @pytest.mark.parametrize("invalid_email", [
        "notanemail",
        "@nodomain.com",
        "user@",
        "user @domain.com",
        "user@domain",
        "",
        " ",
        "@",
        "user@.com",
    ])
    def test_create_with_invalid_email(self, invalid_email):
        """Should raise ValidationException for invalid email."""
        with pytest.raises(ValidationException) as exc_info:
            Email(invalid_email)

        assert "Invalid email format" in str(exc_info.value)

    def test_immutability(self):
        """Should be immutable."""
        email = Email("test@example.com")

        with pytest.raises(AttributeError):
            email.value = "new@example.com"

    def test_equality(self):
        """Should be equal when values match."""
        email1 = Email("test@example.com")
        email2 = Email("test@example.com")

        # Dataclasses with frozen=True are equal by value
        assert email1 == email2

    def test_case_sensitive(self):
        """Should be case-sensitive."""
        email1 = Email("Test@Example.com")
        email2 = Email("test@example.com")

        assert email1 != email2
