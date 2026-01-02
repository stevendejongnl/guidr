"""Session aggregate root."""

from typing import Optional
from datetime import datetime

from ..entities import Session, Guide, Step
from ..value_objects import EntityId, SessionStatus
from ..exceptions import ValidationException


class SessionAggregate:
    """Session aggregate managing session state and current step tracking.

    Aggregate root: Session
    Related entities: Guide, Steps (read-only references)

    Responsibilities:
    - Session state management
    - Current step tracking within guide
    - Validation of step transitions
    """

    def __init__(
        self,
        session: Session,
        guide: Guide,
        steps: Optional[list[Step]] = None
    ):
        """Initialize Session aggregate.

        Args:
            session: The session entity (aggregate root)
            guide: The guide being executed
            steps: Optional list of steps in the guide

        Raises:
            ValidationException: If session guide_id doesn't match guide
        """
        if session.guide_id != guide.id:
            raise ValidationException(
                f"Session guide_id {session.guide_id.value} doesn't match "
                f"guide id {guide.id.value}"
            )

        self._session = session
        self._guide = guide
        self._steps = {step.id: step for step in (steps or [])}

    @property
    def session(self) -> Session:
        """Get the session (aggregate root)."""
        return self._session

    @property
    def guide(self) -> Guide:
        """Get the guide being executed."""
        return self._guide

    @property
    def current_step(self) -> Optional[Step]:
        """Get the current step if one is set.

        Returns:
            Current step if session has current_step_id, None otherwise
        """
        if self._session.current_step_id:
            return self._steps.get(self._session.current_step_id)
        return None

    @property
    def all_steps(self) -> list[Step]:
        """Get all steps ordered by their order field.

        Returns:
            List of steps sorted by order
        """
        return sorted(self._steps.values(), key=lambda s: s.order)

    def start(self, initial_step_id: Optional[EntityId] = None) -> None:
        """Start the session.

        Args:
            initial_step_id: Optional ID of step to start at

        Raises:
            ValidationException: If session already started or step invalid
        """
        self._session.start()

        if initial_step_id:
            self._validate_step_belongs_to_guide(initial_step_id)
            self._session.move_to_step(initial_step_id)

    def pause(self) -> None:
        """Pause the session.

        Raises:
            ValidationException: If session not in progress
        """
        self._session.pause()

    def resume(self) -> None:
        """Resume the session.

        Raises:
            ValidationException: If session not paused
        """
        self._session.resume()

    def complete(self) -> None:
        """Complete the session.

        Raises:
            ValidationException: If session not active
        """
        self._session.complete()

    def cancel(self) -> None:
        """Cancel the session.

        Raises:
            ValidationException: If session not active
        """
        self._session.cancel()

    def move_to_step(self, step_id: EntityId) -> None:
        """Move to a specific step.

        Args:
            step_id: ID of step to move to

        Raises:
            ValidationException: If session not active or step invalid
        """
        self._validate_step_belongs_to_guide(step_id)
        self._session.move_to_step(step_id)

    def move_to_next_step(self) -> Optional[Step]:
        """Move to the next step in order.

        Returns:
            Next step if available, None if at end

        Raises:
            ValidationException: If session not active or no current step
        """
        if not self._session.is_active():
            raise ValidationException("Cannot move to next step when session is not active")

        current_step = self.current_step
        if not current_step:
            # No current step, move to first step
            ordered_steps = self.all_steps
            if ordered_steps:
                next_step = ordered_steps[0]
                self._session.move_to_step(next_step.id)
                return next_step
            return None

        # Find next step by order
        ordered_steps = self.all_steps
        current_index = next(
            (i for i, s in enumerate(ordered_steps) if s.id == current_step.id),
            None
        )

        if current_index is not None and current_index < len(ordered_steps) - 1:
            next_step = ordered_steps[current_index + 1]
            self._session.move_to_step(next_step.id)
            return next_step

        return None

    def move_to_previous_step(self) -> Optional[Step]:
        """Move to the previous step in order.

        Returns:
            Previous step if available, None if at beginning

        Raises:
            ValidationException: If session not active or no current step
        """
        if not self._session.is_active():
            raise ValidationException("Cannot move to previous step when session is not active")

        current_step = self.current_step
        if not current_step:
            return None

        # Find previous step by order
        ordered_steps = self.all_steps
        current_index = next(
            (i for i, s in enumerate(ordered_steps) if s.id == current_step.id),
            None
        )

        if current_index is not None and current_index > 0:
            previous_step = ordered_steps[current_index - 1]
            self._session.move_to_step(previous_step.id)
            return previous_step

        return None

    def get_progress_percentage(self) -> float:
        """Calculate session progress as percentage.

        Returns:
            Progress percentage (0.0 to 100.0)
        """
        if not self._steps:
            return 0.0

        current_step = self.current_step
        if not current_step:
            return 0.0

        ordered_steps = self.all_steps
        current_index = next(
            (i for i, s in enumerate(ordered_steps) if s.id == current_step.id),
            None
        )

        if current_index is None:
            return 0.0

        # Progress = (completed steps + 1) / total steps * 100
        return ((current_index + 1) / len(ordered_steps)) * 100.0

    def is_at_last_step(self) -> bool:
        """Check if session is at the last step.

        Returns:
            True if at last step, False otherwise
        """
        current_step = self.current_step
        if not current_step or not self._steps:
            return False

        ordered_steps = self.all_steps
        return ordered_steps[-1].id == current_step.id

    def _validate_step_belongs_to_guide(self, step_id: EntityId) -> None:
        """Validate that step belongs to this guide.

        Args:
            step_id: Step ID to validate

        Raises:
            ValidationException: If step not found or doesn't belong to guide
        """
        step = self._steps.get(step_id)
        if not step:
            raise ValidationException(
                f"Step {step_id.value} not found in session's guide"
            )

        if step.guide_id != self._guide.id:
            raise ValidationException(
                f"Step {step_id.value} does not belong to guide {self._guide.id.value}"
            )
