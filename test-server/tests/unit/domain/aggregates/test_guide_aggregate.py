import pytest
from src.domain.aggregates import GuideAggregate
from src.domain.entities import Guide, Step
from src.domain.value_objects import EntityId, GuideTitle, StepDuration
from src.domain.exceptions import ValidationException


class TestGuideAggregate:
    """Test GuideAggregate."""

    def test_create_aggregate_with_guide_only(self):
        """Should create aggregate with guide and no steps."""
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        title = GuideTitle("Perfect Pasta")
        guide = Guide(id=guide_id, category_id=category_id, title=title)

        aggregate = GuideAggregate(guide=guide)

        assert aggregate.guide == guide
        assert aggregate.steps == []
        assert aggregate.step_count == 0

    def test_create_aggregate_with_steps(self):
        """Should create aggregate with guide and steps."""
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        title = GuideTitle("Perfect Pasta")
        guide = Guide(id=guide_id, category_id=category_id, title=title)

        step1_id = EntityId("550e8400-e29b-41d4-a716-446655440002")
        step2_id = EntityId("550e8400-e29b-41d4-a716-446655440003")
        step1 = Step(
            id=step1_id,
            guide_id=guide_id,
            order=0,
            title="Boil water",
            duration=StepDuration(60)
        )
        step2 = Step(
            id=step2_id,
            guide_id=guide_id,
            order=1,
            title="Add pasta",
            duration=StepDuration(120)
        )

        aggregate = GuideAggregate(guide=guide, steps=[step1, step2])

        assert aggregate.step_count == 2
        assert aggregate.steps == [step1, step2]  # Ordered by order field

    def test_create_aggregate_with_mismatched_step(self):
        """Should raise ValidationException for step from different guide."""
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        other_guide_id = EntityId("550e8400-e29b-41d4-a716-446655440099")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        title = GuideTitle("Perfect Pasta")
        guide = Guide(id=guide_id, category_id=category_id, title=title)

        step_id = EntityId("550e8400-e29b-41d4-a716-446655440002")
        step = Step(
            id=step_id,
            guide_id=other_guide_id,  # Different guide!
            order=0,
            title="Boil water",
            duration=StepDuration(60)
        )

        with pytest.raises(ValidationException) as exc_info:
            GuideAggregate(guide=guide, steps=[step])

        assert "does not belong to guide" in str(exc_info.value)

    def test_get_ordered_steps(self):
        """Should return steps ordered by order field."""
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        title = GuideTitle("Perfect Pasta")
        guide = Guide(id=guide_id, category_id=category_id, title=title)

        # Create steps out of order
        step1 = Step(
            id=EntityId("550e8400-e29b-41d4-a716-446655440002"),
            guide_id=guide_id,
            order=2,
            title="Step 3",
            duration=StepDuration(60)
        )
        step2 = Step(
            id=EntityId("550e8400-e29b-41d4-a716-446655440003"),
            guide_id=guide_id,
            order=0,
            title="Step 1",
            duration=StepDuration(60)
        )
        step3 = Step(
            id=EntityId("550e8400-e29b-41d4-a716-446655440004"),
            guide_id=guide_id,
            order=1,
            title="Step 2",
            duration=StepDuration(60)
        )

        aggregate = GuideAggregate(guide=guide, steps=[step1, step2, step3])
        ordered = aggregate.get_ordered_steps()

        assert ordered == [step2, step3, step1]
        assert [s.order for s in ordered] == [0, 1, 2]

    def test_get_step(self):
        """Should get specific step by ID."""
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        title = GuideTitle("Perfect Pasta")
        guide = Guide(id=guide_id, category_id=category_id, title=title)

        step_id = EntityId("550e8400-e29b-41d4-a716-446655440002")
        step = Step(
            id=step_id,
            guide_id=guide_id,
            order=0,
            title="Boil water",
            duration=StepDuration(60)
        )

        aggregate = GuideAggregate(guide=guide, steps=[step])
        retrieved = aggregate.get_step(step_id)

        assert retrieved == step

    def test_get_nonexistent_step(self):
        """Should return None for nonexistent step."""
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        title = GuideTitle("Perfect Pasta")
        guide = Guide(id=guide_id, category_id=category_id, title=title)

        aggregate = GuideAggregate(guide=guide)

        nonexistent_id = EntityId("550e8400-e29b-41d4-a716-446655440099")
        retrieved = aggregate.get_step(nonexistent_id)

        assert retrieved is None

    def test_add_step(self):
        """Should add step to aggregate."""
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        title = GuideTitle("Perfect Pasta")
        guide = Guide(id=guide_id, category_id=category_id, title=title)
        aggregate = GuideAggregate(guide=guide)

        step_id = EntityId("550e8400-e29b-41d4-a716-446655440002")
        step = Step(
            id=step_id,
            guide_id=guide_id,
            order=0,
            title="Boil water",
            duration=StepDuration(60)
        )

        aggregate.add_step(step)

        assert aggregate.step_count == 1
        assert aggregate.get_step(step_id) == step
        assert step_id in guide.step_ids

    def test_add_step_from_different_guide(self):
        """Should raise ValidationException when adding step from different guide."""
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        other_guide_id = EntityId("550e8400-e29b-41d4-a716-446655440099")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        title = GuideTitle("Perfect Pasta")
        guide = Guide(id=guide_id, category_id=category_id, title=title)
        aggregate = GuideAggregate(guide=guide)

        step = Step(
            id=EntityId("550e8400-e29b-41d4-a716-446655440002"),
            guide_id=other_guide_id,
            order=0,
            title="Boil water",
            duration=StepDuration(60)
        )

        with pytest.raises(ValidationException) as exc_info:
            aggregate.add_step(step)

        assert "does not belong to guide" in str(exc_info.value)

    def test_add_duplicate_step(self):
        """Should raise ValidationException when adding duplicate step ID."""
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        title = GuideTitle("Perfect Pasta")
        guide = Guide(id=guide_id, category_id=category_id, title=title)

        step_id = EntityId("550e8400-e29b-41d4-a716-446655440002")
        step = Step(
            id=step_id,
            guide_id=guide_id,
            order=0,
            title="Boil water",
            duration=StepDuration(60)
        )

        aggregate = GuideAggregate(guide=guide, steps=[step])

        with pytest.raises(ValidationException) as exc_info:
            aggregate.add_step(step)

        assert "already exists" in str(exc_info.value)

    def test_remove_step(self):
        """Should remove step from aggregate."""
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        title = GuideTitle("Perfect Pasta")
        guide = Guide(id=guide_id, category_id=category_id, title=title)

        step_id = EntityId("550e8400-e29b-41d4-a716-446655440002")
        step = Step(
            id=step_id,
            guide_id=guide_id,
            order=0,
            title="Boil water",
            duration=StepDuration(60)
        )

        aggregate = GuideAggregate(guide=guide, steps=[step])
        aggregate.remove_step(step_id)

        assert aggregate.step_count == 0
        assert aggregate.get_step(step_id) is None
        assert step_id not in guide.step_ids

    def test_remove_nonexistent_step(self):
        """Should not raise error when removing nonexistent step."""
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        title = GuideTitle("Perfect Pasta")
        guide = Guide(id=guide_id, category_id=category_id, title=title)
        aggregate = GuideAggregate(guide=guide)

        nonexistent_id = EntityId("550e8400-e29b-41d4-a716-446655440099")
        aggregate.remove_step(nonexistent_id)  # Should not raise

        assert aggregate.step_count == 0

    def test_reorder_steps(self):
        """Should reorder step."""
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        title = GuideTitle("Perfect Pasta")
        guide = Guide(id=guide_id, category_id=category_id, title=title)

        step_id = EntityId("550e8400-e29b-41d4-a716-446655440002")
        step = Step(
            id=step_id,
            guide_id=guide_id,
            order=0,
            title="Boil water",
            duration=StepDuration(60)
        )

        aggregate = GuideAggregate(guide=guide, steps=[step])
        aggregate.reorder_steps(step_id, 5)

        assert step.order == 5

    def test_reorder_nonexistent_step(self):
        """Should raise ValidationException when reordering nonexistent step."""
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        title = GuideTitle("Perfect Pasta")
        guide = Guide(id=guide_id, category_id=category_id, title=title)
        aggregate = GuideAggregate(guide=guide)

        nonexistent_id = EntityId("550e8400-e29b-41d4-a716-446655440099")

        with pytest.raises(ValidationException) as exc_info:
            aggregate.reorder_steps(nonexistent_id, 5)

        assert "not found" in str(exc_info.value)

    def test_update_title(self):
        """Should update guide title."""
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        title = GuideTitle("Original Title")
        guide = Guide(id=guide_id, category_id=category_id, title=title)
        aggregate = GuideAggregate(guide=guide)

        new_title = GuideTitle("New Title")
        aggregate.update_title(new_title)

        assert guide.title == new_title

    def test_update_description(self):
        """Should update guide description."""
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        title = GuideTitle("Perfect Pasta")
        guide = Guide(id=guide_id, category_id=category_id, title=title)
        aggregate = GuideAggregate(guide=guide)

        aggregate.update_description("New description")

        assert guide.description == "New description"

    def test_validate_consistency(self):
        """Should validate aggregate consistency."""
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        title = GuideTitle("Perfect Pasta")
        guide = Guide(id=guide_id, category_id=category_id, title=title)

        step_id = EntityId("550e8400-e29b-41d4-a716-446655440002")
        step = Step(
            id=step_id,
            guide_id=guide_id,
            order=0,
            title="Boil water",
            duration=StepDuration(60)
        )

        aggregate = GuideAggregate(guide=guide, steps=[step])

        assert aggregate.validate_consistency() is True

    def test_validate_consistency_with_duplicate_orders(self):
        """Should raise ValidationException for duplicate step orders."""
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        title = GuideTitle("Perfect Pasta")
        guide = Guide(id=guide_id, category_id=category_id, title=title)

        step1 = Step(
            id=EntityId("550e8400-e29b-41d4-a716-446655440002"),
            guide_id=guide_id,
            order=0,
            title="Step 1",
            duration=StepDuration(60)
        )
        step2 = Step(
            id=EntityId("550e8400-e29b-41d4-a716-446655440003"),
            guide_id=guide_id,
            order=0,  # Duplicate order!
            title="Step 2",
            duration=StepDuration(60)
        )

        aggregate = GuideAggregate(guide=guide, steps=[step1, step2])

        with pytest.raises(ValidationException) as exc_info:
            aggregate.validate_consistency()

        assert "Duplicate step orders" in str(exc_info.value)
