import pytest

from src.domain.exceptions import ValidationException
from src.domain.value_objects import StepDuration


class TestStepDuration:
    """Test StepDuration value object."""

    def test_create_with_valid_duration(self):
        """Should create StepDuration with positive integer."""
        duration = StepDuration(60)

        assert duration.value == 60
        assert str(duration) == "60"
        assert int(duration) == 60

    def test_create_with_large_duration(self):
        """Should create StepDuration with large duration."""
        duration = StepDuration(3600)

        assert duration.value == 3600

    def test_create_with_zero_duration(self):
        """Should raise ValidationException for zero."""
        with pytest.raises(ValidationException) as exc_info:
            StepDuration(0)

        assert "must be positive" in str(exc_info.value)

    def test_create_with_negative_duration(self):
        """Should raise ValidationException for negative value."""
        with pytest.raises(ValidationException) as exc_info:
            StepDuration(-10)

        assert "must be positive" in str(exc_info.value)

    def test_create_with_non_integer(self):
        """Should raise ValidationException for non-integer."""
        with pytest.raises(ValidationException) as exc_info:
            StepDuration(30.5)

        assert "must be an integer" in str(exc_info.value)

    def test_immutability(self):
        """Should be immutable."""
        duration = StepDuration(60)

        with pytest.raises(AttributeError):
            duration.value = 120

    def test_equality(self):
        """Should be equal when values match."""
        duration1 = StepDuration(60)
        duration2 = StepDuration(60)

        assert duration1 == duration2

    def test_inequality(self):
        """Should not be equal when values differ."""
        duration1 = StepDuration(60)
        duration2 = StepDuration(120)

        assert duration1 != duration2
