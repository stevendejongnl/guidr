from datetime import UTC, datetime

import pytest

from src.domain.events import (
    BaseDomainEvent,
    CategoryCreated,
    CategoryDeleted,
    CategoryUpdated,
    GuideCreated,
    GuideDeleted,
    GuideUpdated,
    SessionCancelled,
    SessionCompleted,
    SessionCreated,
    SessionPaused,
    SessionResumed,
    SessionStarted,
    SessionStepChanged,
    StepAddedToGuide,
    StepCreated,
    StepDeleted,
    StepRemovedFromGuide,
    StepUpdated,
    UserLoggedIn,
    UserPasswordChanged,
    UserRegistered,
)


class TestBaseDomainEvent:
    """Test BaseDomainEvent."""

    def test_create_base_event(self):
        """Should create base event with default values."""
        event = BaseDomainEvent()

        assert event.event_id is not None
        assert isinstance(event.event_id, str)
        assert isinstance(event.occurred_at, datetime)
        assert event.event_type == "BaseDomainEvent"

    def test_event_is_immutable(self):
        """Should be immutable (frozen dataclass)."""
        event = BaseDomainEvent()

        with pytest.raises(AttributeError):
            event.event_id = "new_id"


class TestUserEvents:
    """Test user domain events."""

    def test_user_registered_event(self):
        """Should create UserRegistered event."""
        event = UserRegistered(
            user_id="user123",
            email="test@example.com"
        )

        assert event.user_id == "user123"
        assert event.email == "test@example.com"
        assert event.event_type == "UserRegistered"
        assert event.event_id is not None

    def test_user_logged_in_event(self):
        """Should create UserLoggedIn event."""
        event = UserLoggedIn(
            user_id="user123",
            email="test@example.com"
        )

        assert event.user_id == "user123"
        assert event.email == "test@example.com"
        assert event.event_type == "UserLoggedIn"

    def test_user_password_changed_event(self):
        """Should create UserPasswordChanged event."""
        event = UserPasswordChanged(user_id="user123")

        assert event.user_id == "user123"
        assert event.event_type == "UserPasswordChanged"


class TestCategoryEvents:
    """Test category domain events."""

    def test_category_created_event(self):
        """Should create CategoryCreated event."""
        event = CategoryCreated(
            category_id="cat123",
            name="Cooking",
            parent_id="parent123"
        )

        assert event.category_id == "cat123"
        assert event.name == "Cooking"
        assert event.parent_id == "parent123"
        assert event.event_type == "CategoryCreated"

    def test_category_created_event_without_parent(self):
        """Should create CategoryCreated event without parent."""
        event = CategoryCreated(
            category_id="cat123",
            name="Cooking"
        )

        assert event.parent_id is None

    def test_category_updated_event(self):
        """Should create CategoryUpdated event."""
        event = CategoryUpdated(
            category_id="cat123",
            name="Italian Cooking",
            parent_id="parent123"
        )

        assert event.category_id == "cat123"
        assert event.name == "Italian Cooking"
        assert event.event_type == "CategoryUpdated"

    def test_category_deleted_event(self):
        """Should create CategoryDeleted event."""
        event = CategoryDeleted(category_id="cat123")

        assert event.category_id == "cat123"
        assert event.event_type == "CategoryDeleted"


class TestGuideEvents:
    """Test guide domain events."""

    def test_guide_created_event(self):
        """Should create GuideCreated event."""
        event = GuideCreated(
            guide_id="guide123",
            category_id="cat123",
            title="Perfect Pasta",
            description="Learn to make pasta"
        )

        assert event.guide_id == "guide123"
        assert event.category_id == "cat123"
        assert event.title == "Perfect Pasta"
        assert event.description == "Learn to make pasta"
        assert event.event_type == "GuideCreated"

    def test_guide_created_event_without_description(self):
        """Should create GuideCreated event without description."""
        event = GuideCreated(
            guide_id="guide123",
            category_id="cat123",
            title="Perfect Pasta"
        )

        assert event.description is None

    def test_guide_updated_event(self):
        """Should create GuideUpdated event."""
        event = GuideUpdated(
            guide_id="guide123",
            title="Updated Pasta Recipe",
            description="New description"
        )

        assert event.guide_id == "guide123"
        assert event.title == "Updated Pasta Recipe"
        assert event.event_type == "GuideUpdated"

    def test_guide_deleted_event(self):
        """Should create GuideDeleted event."""
        event = GuideDeleted(guide_id="guide123")

        assert event.guide_id == "guide123"
        assert event.event_type == "GuideDeleted"

    def test_step_added_to_guide_event(self):
        """Should create StepAddedToGuide event."""
        event = StepAddedToGuide(
            guide_id="guide123",
            step_id="step123"
        )

        assert event.guide_id == "guide123"
        assert event.step_id == "step123"
        assert event.event_type == "StepAddedToGuide"

    def test_step_removed_from_guide_event(self):
        """Should create StepRemovedFromGuide event."""
        event = StepRemovedFromGuide(
            guide_id="guide123",
            step_id="step123"
        )

        assert event.guide_id == "guide123"
        assert event.step_id == "step123"
        assert event.event_type == "StepRemovedFromGuide"


class TestStepEvents:
    """Test step domain events."""

    def test_step_created_event(self):
        """Should create StepCreated event."""
        event = StepCreated(
            step_id="step123",
            guide_id="guide123",
            order=0,
            title="Boil water",
            duration=60,
            description="Fill pot and boil"
        )

        assert event.step_id == "step123"
        assert event.guide_id == "guide123"
        assert event.order == 0
        assert event.title == "Boil water"
        assert event.duration == 60
        assert event.description == "Fill pot and boil"
        assert event.event_type == "StepCreated"

    def test_step_created_event_without_description(self):
        """Should create StepCreated event without description."""
        event = StepCreated(
            step_id="step123",
            guide_id="guide123",
            order=0,
            title="Boil water",
            duration=60
        )

        assert event.description is None

    def test_step_updated_event(self):
        """Should create StepUpdated event."""
        event = StepUpdated(
            step_id="step123",
            order=1,
            title="Updated title",
            duration=120,
            description="Updated description"
        )

        assert event.step_id == "step123"
        assert event.order == 1
        assert event.title == "Updated title"
        assert event.event_type == "StepUpdated"

    def test_step_deleted_event(self):
        """Should create StepDeleted event."""
        event = StepDeleted(
            step_id="step123",
            guide_id="guide123"
        )

        assert event.step_id == "step123"
        assert event.guide_id == "guide123"
        assert event.event_type == "StepDeleted"


class TestSessionEvents:
    """Test session domain events."""

    def test_session_created_event(self):
        """Should create SessionCreated event."""
        event = SessionCreated(
            session_id="session123",
            guide_id="guide123"
        )

        assert event.session_id == "session123"
        assert event.guide_id == "guide123"
        assert event.event_type == "SessionCreated"

    def test_session_started_event(self):
        """Should create SessionStarted event."""
        started_at = "2024-01-01T12:00:00Z"
        event = SessionStarted(
            session_id="session123",
            guide_id="guide123",
            started_at=started_at
        )

        assert event.session_id == "session123"
        assert event.guide_id == "guide123"
        assert event.started_at == started_at
        assert event.event_type == "SessionStarted"

    def test_session_paused_event(self):
        """Should create SessionPaused event."""
        event = SessionPaused(session_id="session123")

        assert event.session_id == "session123"
        assert event.event_type == "SessionPaused"

    def test_session_resumed_event(self):
        """Should create SessionResumed event."""
        event = SessionResumed(session_id="session123")

        assert event.session_id == "session123"
        assert event.event_type == "SessionResumed"

    def test_session_completed_event(self):
        """Should create SessionCompleted event."""
        completed_at = "2024-01-01T13:00:00Z"
        event = SessionCompleted(
            session_id="session123",
            completed_at=completed_at
        )

        assert event.session_id == "session123"
        assert event.completed_at == completed_at
        assert event.event_type == "SessionCompleted"

    def test_session_cancelled_event(self):
        """Should create SessionCancelled event."""
        cancelled_at = "2024-01-01T13:00:00Z"
        event = SessionCancelled(
            session_id="session123",
            cancelled_at=cancelled_at
        )

        assert event.session_id == "session123"
        assert event.cancelled_at == cancelled_at
        assert event.event_type == "SessionCancelled"

    def test_session_step_changed_event(self):
        """Should create SessionStepChanged event."""
        event = SessionStepChanged(
            session_id="session123",
            previous_step_id="step1",
            current_step_id="step2"
        )

        assert event.session_id == "session123"
        assert event.previous_step_id == "step1"
        assert event.current_step_id == "step2"
        assert event.event_type == "SessionStepChanged"

    def test_session_step_changed_event_no_previous(self):
        """Should create SessionStepChanged event without previous step."""
        event = SessionStepChanged(
            session_id="session123",
            previous_step_id=None,
            current_step_id="step1"
        )

        assert event.previous_step_id is None
        assert event.current_step_id == "step1"


class TestEventImmutability:
    """Test that all events are immutable."""

    def test_events_are_frozen(self):
        """Should not be able to modify event fields."""
        event = GuideCreated(
            guide_id="guide123",
            category_id="cat123",
            title="Perfect Pasta"
        )

        with pytest.raises(AttributeError):
            event.guide_id = "new_id"

        with pytest.raises(AttributeError):
            event.title = "New Title"


class TestEventIdentity:
    """Test event identity and uniqueness."""

    def test_each_event_has_unique_id(self):
        """Should generate unique event IDs."""
        event1 = GuideCreated(
            guide_id="guide123",
            category_id="cat123",
            title="Perfect Pasta"
        )
        event2 = GuideCreated(
            guide_id="guide123",
            category_id="cat123",
            title="Perfect Pasta"
        )

        assert event1.event_id != event2.event_id

    def test_events_have_occurred_at_timestamp(self):
        """Should have occurred_at timestamp."""
        event = GuideCreated(
            guide_id="guide123",
            category_id="cat123",
            title="Perfect Pasta"
        )

        assert isinstance(event.occurred_at, datetime)
        # Should be close to current time
        time_diff = datetime.now(UTC) - event.occurred_at
        assert time_diff.total_seconds() < 1
