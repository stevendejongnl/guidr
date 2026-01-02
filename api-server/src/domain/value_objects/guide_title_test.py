import pytest
from src.domain.value_objects import GuideTitle
from src.domain.exceptions import ValidationException


class TestGuideTitle:
    """Test GuideTitle value object."""

    def test_create_with_valid_title(self):
        """Should create GuideTitle with valid title."""
        title = GuideTitle("Perfect Pasta Recipe")

        assert title.value == "Perfect Pasta Recipe"
        assert str(title) == "Perfect Pasta Recipe"

    def test_create_with_empty_string(self):
        """Should raise ValidationException for empty string."""
        with pytest.raises(ValidationException) as exc_info:
            GuideTitle("")

        assert "cannot be empty" in str(exc_info.value)

    def test_create_with_whitespace_only(self):
        """Should raise ValidationException for whitespace-only string."""
        with pytest.raises(ValidationException) as exc_info:
            GuideTitle("   ")

        assert "cannot be blank" in str(exc_info.value)

    def test_immutability(self):
        """Should be immutable."""
        title = GuideTitle("Original Title")

        with pytest.raises(AttributeError):
            title.value = "New Title"

    def test_equality(self):
        """Should be equal when values match."""
        title1 = GuideTitle("Same Title")
        title2 = GuideTitle("Same Title")

        assert title1 == title2

    def test_preserves_whitespace(self):
        """Should preserve leading/trailing whitespace in valid titles."""
        title = GuideTitle(" Title with spaces ")

        assert title.value == " Title with spaces "
