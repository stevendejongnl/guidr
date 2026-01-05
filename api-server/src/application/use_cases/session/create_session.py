"""Create session use case."""

from uuid import uuid4

from src.application.dtos import SessionCreateDTO, SessionResponseDTO
from src.application.mappers import SessionMapper
from src.domain.entities import Session
from src.domain.exceptions import ValidationException
from src.domain.repositories import IGuideRepository, ISessionRepository
from src.domain.value_objects import EntityId


class CreateSession:
    """Use case for creating a new session."""

    def __init__(
        self,
        session_repository: ISessionRepository,
        guide_repository: IGuideRepository,
    ):
        """Initialize use case.

        Args:
            session_repository: Repository for session persistence
            guide_repository: Repository for guide validation
        """
        self._session_repository = session_repository
        self._guide_repository = guide_repository
        self._mapper = SessionMapper()

    async def execute(self, dto: SessionCreateDTO) -> SessionResponseDTO:
        """Create a new session.

        Args:
            dto: Session creation data

        Returns:
            SessionResponseDTO with created session data

        Raises:
            ValidationException: If guide doesn't exist
        """
        # Validate guide exists
        guide_id = EntityId(dto.guide_id)
        guide = await self._guide_repository.find_by_id(guide_id)
        if not guide:
            raise ValidationException(f"Guide not found: {dto.guide_id}")

        # Create entity
        session = Session(
            id=EntityId(str(uuid4())),
            guide_id=guide_id,
        )

        # Save and return
        await self._session_repository.save(session)
        return self._mapper.to_response_dto(session)
