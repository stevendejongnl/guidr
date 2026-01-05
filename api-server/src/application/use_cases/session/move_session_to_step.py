"""Move session to step use case."""

from src.application.dtos import SessionResponseDTO
from src.application.mappers import SessionMapper
from src.domain.exceptions import EntityNotFoundException, ValidationException
from src.domain.repositories import ISessionRepository, IStepRepository
from src.domain.value_objects import EntityId


class MoveSessionToStep:
    """Use case for moving a session to a specific step."""

    def __init__(
        self,
        session_repository: ISessionRepository,
        step_repository: IStepRepository,
    ):
        """Initialize use case.

        Args:
            session_repository: Repository for session persistence
            step_repository: Repository for step validation
        """
        self._session_repository = session_repository
        self._step_repository = step_repository
        self._mapper = SessionMapper()

    async def execute(self, session_id: str, step_id: str) -> SessionResponseDTO:
        """Move session to a specific step.

        Args:
            session_id: Session ID
            step_id: Step ID to move to

        Returns:
            SessionResponseDTO with updated session data

        Raises:
            EntityNotFoundException: If session or step not found
            ValidationException: If session cannot move to step
        """
        # Find existing session
        session = await self._session_repository.find_by_id(EntityId(session_id))
        if not session:
            raise EntityNotFoundException(f"Session not found: {session_id}")

        # Validate step exists
        step = await self._step_repository.find_by_id(EntityId(step_id))
        if not step:
            raise EntityNotFoundException(f"Step not found: {step_id}")

        # Validate step belongs to session's guide
        if step.guide_id != session.guide_id:
            raise ValidationException(
                f"Step {step_id} does not belong to guide {session.guide_id.value}"
            )

        # Move to step
        session.move_to_step(step.id)

        # Save and return
        await self._session_repository.save(session)
        return self._mapper.to_response_dto(session)
