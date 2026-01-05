import pytest

from src.domain.aggregates import SessionAggregate
from src.domain.entities import Guide, Session, Step
from src.domain.exceptions import ValidationException
from src.domain.value_objects import EntityId, GuideTitle, SessionStatus, StepDuration


class TestSessionAggregate:
    """Test SessionAggregate."""

    def test_create_aggregate(self):
        """Should create session aggregate."""
        session_id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440002")

        session = Session(id=session_id, guide_id=guide_id)
        guide = Guide(
            id=guide_id,
            category_id=category_id,
            title=GuideTitle("Perfect Pasta")
        )

        aggregate = SessionAggregate(session=session, guide=guide)

        assert aggregate.session == session
        assert aggregate.guide == guide
        assert aggregate.current_step is None
        assert aggregate.all_steps == []

    def test_create_aggregate_with_mismatched_guide(self):
        """Should raise ValidationException for mismatched guide."""
        session_id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        other_guide_id = EntityId("550e8400-e29b-41d4-a716-446655440099")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440002")

        session = Session(id=session_id, guide_id=guide_id)
        guide = Guide(
            id=other_guide_id,  # Mismatched!
            category_id=category_id,
            title=GuideTitle("Perfect Pasta")
        )

        with pytest.raises(ValidationException) as exc_info:
            SessionAggregate(session=session, guide=guide)

        assert "doesn't match" in str(exc_info.value)

    def test_create_aggregate_with_steps(self):
        """Should create aggregate with steps."""
        session_id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440002")

        session = Session(id=session_id, guide_id=guide_id)
        guide = Guide(
            id=guide_id,
            category_id=category_id,
            title=GuideTitle("Perfect Pasta")
        )

        step1 = Step(
            id=EntityId("550e8400-e29b-41d4-a716-446655440003"),
            guide_id=guide_id,
            order=0,
            title="Boil water",
            duration=StepDuration(60)
        )
        step2 = Step(
            id=EntityId("550e8400-e29b-41d4-a716-446655440004"),
            guide_id=guide_id,
            order=1,
            title="Add pasta",
            duration=StepDuration(120)
        )

        aggregate = SessionAggregate(session=session, guide=guide, steps=[step1, step2])

        assert len(aggregate.all_steps) == 2
        assert aggregate.all_steps == [step1, step2]

    def test_start_session(self):
        """Should start session."""
        session_id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440002")

        session = Session(id=session_id, guide_id=guide_id)
        guide = Guide(
            id=guide_id,
            category_id=category_id,
            title=GuideTitle("Perfect Pasta")
        )
        aggregate = SessionAggregate(session=session, guide=guide)

        aggregate.start()

        assert session.status == SessionStatus.IN_PROGRESS
        assert session.started_at is not None

    def test_start_session_with_initial_step(self):
        """Should start session with initial step."""
        session_id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440002")

        session = Session(id=session_id, guide_id=guide_id)
        guide = Guide(
            id=guide_id,
            category_id=category_id,
            title=GuideTitle("Perfect Pasta")
        )

        step_id = EntityId("550e8400-e29b-41d4-a716-446655440003")
        step = Step(
            id=step_id,
            guide_id=guide_id,
            order=0,
            title="Boil water",
            duration=StepDuration(60)
        )

        aggregate = SessionAggregate(session=session, guide=guide, steps=[step])
        aggregate.start(initial_step_id=step_id)

        assert session.status == SessionStatus.IN_PROGRESS
        assert session.current_step_id == step_id

    def test_pause_session(self):
        """Should pause session."""
        session_id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440002")

        session = Session(id=session_id, guide_id=guide_id)
        guide = Guide(
            id=guide_id,
            category_id=category_id,
            title=GuideTitle("Perfect Pasta")
        )
        aggregate = SessionAggregate(session=session, guide=guide)

        aggregate.start()
        aggregate.pause()

        assert session.status == SessionStatus.PAUSED

    def test_resume_session(self):
        """Should resume session."""
        session_id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440002")

        session = Session(id=session_id, guide_id=guide_id)
        guide = Guide(
            id=guide_id,
            category_id=category_id,
            title=GuideTitle("Perfect Pasta")
        )
        aggregate = SessionAggregate(session=session, guide=guide)

        aggregate.start()
        aggregate.pause()
        aggregate.resume()

        assert session.status == SessionStatus.IN_PROGRESS

    def test_complete_session(self):
        """Should complete session."""
        session_id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440002")

        session = Session(id=session_id, guide_id=guide_id)
        guide = Guide(
            id=guide_id,
            category_id=category_id,
            title=GuideTitle("Perfect Pasta")
        )
        aggregate = SessionAggregate(session=session, guide=guide)

        aggregate.start()
        aggregate.complete()

        assert session.status == SessionStatus.COMPLETED
        assert session.completed_at is not None

    def test_cancel_session(self):
        """Should cancel session."""
        session_id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440002")

        session = Session(id=session_id, guide_id=guide_id)
        guide = Guide(
            id=guide_id,
            category_id=category_id,
            title=GuideTitle("Perfect Pasta")
        )
        aggregate = SessionAggregate(session=session, guide=guide)

        aggregate.start()
        aggregate.cancel()

        assert session.status == SessionStatus.CANCELLED

    def test_move_to_step(self):
        """Should move to specific step."""
        session_id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440002")

        session = Session(id=session_id, guide_id=guide_id)
        guide = Guide(
            id=guide_id,
            category_id=category_id,
            title=GuideTitle("Perfect Pasta")
        )

        step_id = EntityId("550e8400-e29b-41d4-a716-446655440003")
        step = Step(
            id=step_id,
            guide_id=guide_id,
            order=0,
            title="Boil water",
            duration=StepDuration(60)
        )

        aggregate = SessionAggregate(session=session, guide=guide, steps=[step])
        aggregate.start()
        aggregate.move_to_step(step_id)

        assert session.current_step_id == step_id
        assert aggregate.current_step == step

    def test_move_to_invalid_step(self):
        """Should raise ValidationException for invalid step."""
        session_id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440002")

        session = Session(id=session_id, guide_id=guide_id)
        guide = Guide(
            id=guide_id,
            category_id=category_id,
            title=GuideTitle("Perfect Pasta")
        )
        aggregate = SessionAggregate(session=session, guide=guide)

        aggregate.start()

        invalid_step_id = EntityId("550e8400-e29b-41d4-a716-446655440099")

        with pytest.raises(ValidationException) as exc_info:
            aggregate.move_to_step(invalid_step_id)

        assert "not found" in str(exc_info.value)

    def test_move_to_next_step(self):
        """Should move to next step."""
        session_id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440002")

        session = Session(id=session_id, guide_id=guide_id)
        guide = Guide(
            id=guide_id,
            category_id=category_id,
            title=GuideTitle("Perfect Pasta")
        )

        step1_id = EntityId("550e8400-e29b-41d4-a716-446655440003")
        step2_id = EntityId("550e8400-e29b-41d4-a716-446655440004")
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

        aggregate = SessionAggregate(session=session, guide=guide, steps=[step1, step2])
        aggregate.start()
        aggregate.move_to_step(step1_id)

        next_step = aggregate.move_to_next_step()

        assert next_step == step2
        assert session.current_step_id == step2_id

    def test_move_to_next_step_at_end(self):
        """Should return None when at last step."""
        session_id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440002")

        session = Session(id=session_id, guide_id=guide_id)
        guide = Guide(
            id=guide_id,
            category_id=category_id,
            title=GuideTitle("Perfect Pasta")
        )

        step_id = EntityId("550e8400-e29b-41d4-a716-446655440003")
        step = Step(
            id=step_id,
            guide_id=guide_id,
            order=0,
            title="Boil water",
            duration=StepDuration(60)
        )

        aggregate = SessionAggregate(session=session, guide=guide, steps=[step])
        aggregate.start()
        aggregate.move_to_step(step_id)

        next_step = aggregate.move_to_next_step()

        assert next_step is None
        assert session.current_step_id == step_id  # Stays on current

    def test_move_to_previous_step(self):
        """Should move to previous step."""
        session_id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440002")

        session = Session(id=session_id, guide_id=guide_id)
        guide = Guide(
            id=guide_id,
            category_id=category_id,
            title=GuideTitle("Perfect Pasta")
        )

        step1_id = EntityId("550e8400-e29b-41d4-a716-446655440003")
        step2_id = EntityId("550e8400-e29b-41d4-a716-446655440004")
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

        aggregate = SessionAggregate(session=session, guide=guide, steps=[step1, step2])
        aggregate.start()
        aggregate.move_to_step(step2_id)

        previous_step = aggregate.move_to_previous_step()

        assert previous_step == step1
        assert session.current_step_id == step1_id

    def test_move_to_previous_step_at_beginning(self):
        """Should return None when at first step."""
        session_id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440002")

        session = Session(id=session_id, guide_id=guide_id)
        guide = Guide(
            id=guide_id,
            category_id=category_id,
            title=GuideTitle("Perfect Pasta")
        )

        step_id = EntityId("550e8400-e29b-41d4-a716-446655440003")
        step = Step(
            id=step_id,
            guide_id=guide_id,
            order=0,
            title="Boil water",
            duration=StepDuration(60)
        )

        aggregate = SessionAggregate(session=session, guide=guide, steps=[step])
        aggregate.start()
        aggregate.move_to_step(step_id)

        previous_step = aggregate.move_to_previous_step()

        assert previous_step is None
        assert session.current_step_id == step_id

    def test_get_progress_percentage(self):
        """Should calculate progress percentage."""
        session_id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440002")

        session = Session(id=session_id, guide_id=guide_id)
        guide = Guide(
            id=guide_id,
            category_id=category_id,
            title=GuideTitle("Perfect Pasta")
        )

        step1_id = EntityId("550e8400-e29b-41d4-a716-446655440003")
        step2_id = EntityId("550e8400-e29b-41d4-a716-446655440004")
        step3_id = EntityId("550e8400-e29b-41d4-a716-446655440005")
        step1 = Step(
            id=step1_id, guide_id=guide_id, order=0, title="Step 1", duration=StepDuration(60)
        )
        step2 = Step(
            id=step2_id, guide_id=guide_id, order=1, title="Step 2", duration=StepDuration(60)
        )
        step3 = Step(
            id=step3_id, guide_id=guide_id, order=2, title="Step 3", duration=StepDuration(60)
        )

        aggregate = SessionAggregate(session=session, guide=guide, steps=[step1, step2, step3])
        aggregate.start()
        aggregate.move_to_step(step2_id)

        progress = aggregate.get_progress_percentage()

        assert progress == pytest.approx(66.67, rel=0.01)  # 2 of 3 steps

    def test_is_at_last_step(self):
        """Should check if at last step."""
        session_id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440002")

        session = Session(id=session_id, guide_id=guide_id)
        guide = Guide(
            id=guide_id,
            category_id=category_id,
            title=GuideTitle("Perfect Pasta")
        )

        step1_id = EntityId("550e8400-e29b-41d4-a716-446655440003")
        step2_id = EntityId("550e8400-e29b-41d4-a716-446655440004")
        step1 = Step(
            id=step1_id, guide_id=guide_id, order=0, title="Step 1", duration=StepDuration(60)
        )
        step2 = Step(
            id=step2_id, guide_id=guide_id, order=1, title="Step 2", duration=StepDuration(60)
        )

        aggregate = SessionAggregate(session=session, guide=guide, steps=[step1, step2])
        aggregate.start()
        aggregate.move_to_step(step1_id)

        assert aggregate.is_at_last_step() is False

        aggregate.move_to_step(step2_id)

        assert aggregate.is_at_last_step() is True
