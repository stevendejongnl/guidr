"""StepTimer domain entity."""

from datetime import UTC, datetime

from ..exceptions import ValidationException
from ..value_objects import EntityId, StepTimerStatus


class StepTimer:
    """StepTimer entity representing a per-step timer for a guide.

    State machine: idle → running ⇄ paused → idle (via reset)

    The server stores started_at and accumulated_seconds.
    Clients calculate elapsed time locally:
    - Running: elapsed = accumulated_seconds + (now - started_at)
    - Paused: elapsed = accumulated_seconds
    - Countdown: remaining = duration_seconds - elapsed
    """

    def __init__(
        self,
        id: EntityId,
        step_id: EntityId,
        guide_id: EntityId,
        user_id: EntityId,
        status: StepTimerStatus | None = None,
        started_at: datetime | None = None,
        accumulated_seconds: int = 0,
        duration_seconds: int = 0,
        created_at: datetime | None = None,
        updated_at: datetime | None = None,
    ):
        """Initialize a StepTimer.

        Args:
            id: Unique identifier
            step_id: Associated step ID
            guide_id: Associated guide ID
            user_id: Owner user ID
            status: Timer status (defaults to idle)
            started_at: When timer was last started/resumed
            accumulated_seconds: Total elapsed from previous runs
            duration_seconds: Step duration in seconds (0 = stopwatch)
            created_at: Optional creation timestamp (defaults to now)
            updated_at: Optional update timestamp (defaults to now)

        Raises:
            ValidationException: If accumulated_seconds or
                duration_seconds is negative
        """
        if accumulated_seconds < 0:
            raise ValidationException(
                "Accumulated seconds must be non-negative"
            )
        if duration_seconds < 0:
            raise ValidationException(
                "Duration seconds must be non-negative"
            )

        self._id = id
        self._step_id = step_id
        self._guide_id = guide_id
        self._user_id = user_id
        self._status = status or StepTimerStatus.IDLE
        self._started_at = started_at
        self._accumulated_seconds = accumulated_seconds
        self._duration_seconds = duration_seconds
        self._created_at = created_at or datetime.now(UTC)
        self._updated_at = updated_at or datetime.now(UTC)

    @property
    def id(self) -> EntityId:
        """Get entity ID."""
        return self._id

    @property
    def step_id(self) -> EntityId:
        """Get step ID."""
        return self._step_id

    @property
    def guide_id(self) -> EntityId:
        """Get guide ID."""
        return self._guide_id

    @property
    def user_id(self) -> EntityId:
        """Get user ID."""
        return self._user_id

    @property
    def status(self) -> StepTimerStatus:
        """Get timer status."""
        return self._status

    @property
    def started_at(self) -> datetime | None:
        """Get start timestamp."""
        return self._started_at

    @property
    def accumulated_seconds(self) -> int:
        """Get accumulated seconds."""
        return self._accumulated_seconds

    @property
    def duration_seconds(self) -> int:
        """Get duration seconds (0 = stopwatch mode)."""
        return self._duration_seconds

    @property
    def created_at(self) -> datetime:
        """Get creation timestamp."""
        return self._created_at

    @property
    def updated_at(self) -> datetime:
        """Get last update timestamp."""
        return self._updated_at

    @property
    def is_complete(self) -> bool:
        """Check if countdown timer is complete.

        Only meaningful for countdown mode (duration_seconds > 0).
        Returns False for stopwatch mode.
        """
        if self._duration_seconds == 0:
            return False
        return self._accumulated_seconds >= self._duration_seconds

    def start(self) -> None:
        """Start or resume the timer.

        Transitions: idle/paused → running. Sets started_at to now.

        Raises:
            ValidationException: If timer is already running
        """
        if self._status == StepTimerStatus.RUNNING:
            raise ValidationException("Timer is already running")

        self._status = StepTimerStatus.RUNNING
        self._started_at = datetime.now(UTC)
        self._updated_at = datetime.now(UTC)

    def pause(self) -> None:
        """Pause the timer.

        Transitions: running → paused.
        Accumulates elapsed time since started_at.

        Raises:
            ValidationException: If timer is not running
        """
        if self._status != StepTimerStatus.RUNNING:
            raise ValidationException("Cannot pause timer that is not running")

        if self._started_at:
            elapsed = (datetime.now(UTC) - self._started_at).total_seconds()
            self._accumulated_seconds += int(elapsed)

        self._started_at = None
        self._status = StepTimerStatus.PAUSED
        self._updated_at = datetime.now(UTC)

    def reset(self) -> None:
        """Reset the timer to idle state.

        Transitions: any → idle. Clears all timing data.
        """
        self._status = StepTimerStatus.IDLE
        self._started_at = None
        self._accumulated_seconds = 0
        self._updated_at = datetime.now(UTC)
