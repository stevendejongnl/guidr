import pytest
from datetime import datetime
from src.domain.entities import Step
from src.domain.value_objects import EntityId, StepDuration
from src.domain.exceptions import ValidationException


class TestStep:
    """Test Step entity."""

    def test_create_step(self):
        """Should create step with valid parameters."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        duration = StepDuration(60)

        step = Step(
            id=id,
            guide_id=guide_id,
            order=0,
            title="Boil water",
            duration=duration
        )

        assert step.id == id
        assert step.guide_id == guide_id
        assert step.order == 0
        assert step.title == "Boil water"
        assert step.duration == duration
        assert step.description is None
        assert isinstance(step.created_at, datetime)
        assert isinstance(step.updated_at, datetime)

    def test_create_step_with_description(self):
        """Should create step with optional description."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        duration = StepDuration(60)
        description = "Fill pot with water and bring to boil"

        step = Step(
            id=id,
            guide_id=guide_id,
            order=0,
            title="Boil water",
            duration=duration,
            description=description
        )

        assert step.description == description

    def test_create_step_with_empty_title(self):
        """Should raise ValidationException for empty title."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        duration = StepDuration(60)

        with pytest.raises(ValidationException) as exc_info:
            Step(id=id, guide_id=guide_id, order=0, title="", duration=duration)

        assert "title cannot be empty" in str(exc_info.value)

    def test_create_step_with_blank_title(self):
        """Should raise ValidationException for blank title."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        duration = StepDuration(60)

        with pytest.raises(ValidationException) as exc_info:
            Step(id=id, guide_id=guide_id, order=0, title="   ", duration=duration)

        assert "title cannot be empty" in str(exc_info.value)

    def test_create_step_with_negative_order(self):
        """Should raise ValidationException for negative order."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        duration = StepDuration(60)

        with pytest.raises(ValidationException) as exc_info:
            Step(
                id=id,
                guide_id=guide_id,
                order=-1,
                title="Boil water",
                duration=duration
            )

        assert "order must be non-negative" in str(exc_info.value)

    def test_update_title(self):
        """Should update step title and timestamp."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        duration = StepDuration(60)
        step = Step(
            id=id,
            guide_id=guide_id,
            order=0,
            title="Original Title",
            duration=duration
        )
        original_updated = step.updated_at

        step.update_title("New Title")

        assert step.title == "New Title"
        assert step.updated_at > original_updated

    def test_update_title_with_empty_string(self):
        """Should raise ValidationException when updating with empty title."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        duration = StepDuration(60)
        step = Step(
            id=id,
            guide_id=guide_id,
            order=0,
            title="Original Title",
            duration=duration
        )

        with pytest.raises(ValidationException) as exc_info:
            step.update_title("")

        assert "title cannot be empty" in str(exc_info.value)
        assert step.title == "Original Title"

    def test_update_description(self):
        """Should update step description and timestamp."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        duration = StepDuration(60)
        step = Step(
            id=id,
            guide_id=guide_id,
            order=0,
            title="Boil water",
            duration=duration
        )
        original_updated = step.updated_at

        step.update_description("New description")

        assert step.description == "New description"
        assert step.updated_at > original_updated

    def test_update_duration(self):
        """Should update step duration and timestamp."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        duration = StepDuration(60)
        step = Step(
            id=id,
            guide_id=guide_id,
            order=0,
            title="Boil water",
            duration=duration
        )
        original_updated = step.updated_at

        new_duration = StepDuration(120)
        step.update_duration(new_duration)

        assert step.duration == new_duration
        assert step.updated_at > original_updated

    def test_update_order(self):
        """Should update step order and timestamp."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        duration = StepDuration(60)
        step = Step(
            id=id,
            guide_id=guide_id,
            order=0,
            title="Boil water",
            duration=duration
        )
        original_updated = step.updated_at

        step.update_order(1)

        assert step.order == 1
        assert step.updated_at > original_updated

    def test_update_order_with_negative_value(self):
        """Should raise ValidationException when updating with negative order."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        duration = StepDuration(60)
        step = Step(
            id=id,
            guide_id=guide_id,
            order=0,
            title="Boil water",
            duration=duration
        )

        with pytest.raises(ValidationException) as exc_info:
            step.update_order(-1)

        assert "order must be non-negative" in str(exc_info.value)
        assert step.order == 0

    def test_immutable_properties(self):
        """Should have immutable id, guide_id, created_at."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        duration = StepDuration(60)
        step = Step(
            id=id,
            guide_id=guide_id,
            order=0,
            title="Boil water",
            duration=duration
        )

        with pytest.raises(AttributeError):
            step.id = EntityId("550e8400-e29b-41d4-a716-446655440002")

        with pytest.raises(AttributeError):
            step.guide_id = EntityId("550e8400-e29b-41d4-a716-446655440003")

        with pytest.raises(AttributeError):
            step.created_at = datetime.utcnow()
