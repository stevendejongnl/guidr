"""Session domain entity."""

from datetime import datetime
from typing import Optional

from ..value_objects import EntityId, SessionStatus
from ..exceptions import ValidationException


class Session:
    """Session entity representing a guide execution session.

    State machine: NotStarted → InProgress ⇄ Paused → Completed/Cancelled
    """

    def __init__(
        self,
        id: EntityId,
        guide_id: EntityId,
        status: Optional[SessionStatus] = None,
        started_at: Optional[datetime] = None,
        completed_at: Optional[datetime] = None,
        current_step_id: Optional[EntityId] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
    ):
        """Initialize a Session.

        Args:
            id: Unique identifier
            guide_id: Parent guide ID
            status: Session status (defaults to NotStarted)
            started_at: Optional start timestamp
            completed_at: Optional completion timestamp
            current_step_id: Optional current step ID
            created_at: Optional creation timestamp (defaults to now)
            updated_at: Optional update timestamp (defaults to now)
        """
        self._id = id
        self._guide_id = guide_id
        self._status = status or SessionStatus.NOT_STARTED
        self._started_at = started_at
        self._completed_at = completed_at
        self._current_step_id = current_step_id
        self._created_at = created_at or datetime.utcnow()
        self._updated_at = updated_at or datetime.utcnow()

    @property
    def id(self) -> EntityId:
        """Get entity ID."""
        return self._id

    @property
    def guide_id(self) -> EntityId:
        """Get guide ID."""
        return self._guide_id

    @property
    def status(self) -> SessionStatus:
        """Get session status."""
        return self._status

    @property
    def started_at(self) -> Optional[datetime]:
        """Get start timestamp."""
        return self._started_at

    @property
    def completed_at(self) -> Optional[datetime]:
        """Get completion timestamp."""
        return self._completed_at

    @property
    def current_step_id(self) -> Optional[EntityId]:
        """Get current step ID."""
        return self._current_step_id

    @property
    def created_at(self) -> datetime:
        """Get creation timestamp."""
        return self._created_at

    @property
    def updated_at(self) -> datetime:
        """Get last update timestamp."""
        return self._updated_at

    def start(self) -> None:
        """Start the session.

        Transitions: NotStarted → InProgress

        Raises:
            ValidationException: If session has already been started
        """
        if self._status != SessionStatus.NOT_STARTED:
            raise ValidationException("Session has already been started")

        self._status = SessionStatus.IN_PROGRESS
        self._started_at = datetime.utcnow()
        self._updated_at = datetime.utcnow()

    def pause(self) -> None:
        """Pause the session.

        Transitions: InProgress → Paused

        Raises:
            ValidationException: If session is not in progress
        """
        if self._status != SessionStatus.IN_PROGRESS:
            raise ValidationException("Cannot pause session that is not in progress")

        self._status = SessionStatus.PAUSED
        self._updated_at = datetime.utcnow()

    def resume(self) -> None:
        """Resume the session.

        Transitions: Paused → InProgress

        Raises:
            ValidationException: If session is not paused
        """
        if self._status != SessionStatus.PAUSED:
            raise ValidationException("Cannot resume session that is not paused")

        self._status = SessionStatus.IN_PROGRESS
        self._updated_at = datetime.utcnow()

    def complete(self) -> None:
        """Complete the session.

        Transitions: InProgress/Paused → Completed

        Raises:
            ValidationException: If session has not been started
        """
        if self._status not in (SessionStatus.IN_PROGRESS, SessionStatus.PAUSED):
            raise ValidationException("Cannot complete session that has not been started")

        self._status = SessionStatus.COMPLETED
        self._completed_at = datetime.utcnow()
        self._updated_at = datetime.utcnow()

    def cancel(self) -> None:
        """Cancel the session.

        Transitions: InProgress/Paused → Cancelled

        Raises:
            ValidationException: If session has not been started
        """
        if self._status not in (SessionStatus.IN_PROGRESS, SessionStatus.PAUSED):
            raise ValidationException("Cannot cancel session that has not been started")

        self._status = SessionStatus.CANCELLED
        self._completed_at = datetime.utcnow()
        self._updated_at = datetime.utcnow()

    def move_to_step(self, step_id: EntityId) -> None:
        """Move to a specific step in the guide.

        Args:
            step_id: ID of step to move to

        Raises:
            ValidationException: If session is not active
        """
        if not self.is_active():
            raise ValidationException("Cannot move to step when session is not active")

        self._current_step_id = step_id
        self._updated_at = datetime.utcnow()

    def is_active(self) -> bool:
        """Check if session is currently active.

        Returns:
            True if status is InProgress or Paused, False otherwise
        """
        return self._status in (SessionStatus.IN_PROGRESS, SessionStatus.PAUSED)
