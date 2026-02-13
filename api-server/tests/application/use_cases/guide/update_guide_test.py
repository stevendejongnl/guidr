"""Tests for UpdateGuide use case — admin guide_type and user reassignment."""

from datetime import datetime
from uuid import uuid4

import pytest

from src.application.dtos import GuideUpdateDTO
from src.application.use_cases.guide import UpdateGuide
from src.domain.entities import AuditLog, Guide, User
from src.domain.exceptions import AuthorizationException
from src.domain.repositories import IAuditLogRepository, IGuideRepository
from src.domain.services import EventPersistenceService
from src.domain.value_objects import Email, EntityId, GuideTitle, GuideType


class MockGuideRepository(IGuideRepository):
    """Mock repository for testing."""

    def __init__(self) -> None:
        self.saved_guides: list[Guide] = []

    async def find_by_id(self, id: EntityId) -> Guide | None:
        for guide in self.saved_guides:
            if guide.id == id:
                return guide
        return None

    async def find_all(self) -> list[Guide]:
        return self.saved_guides

    async def find_by_type(self, guide_type: GuideType) -> list[Guide]:
        return [g for g in self.saved_guides if g.guide_type == guide_type]

    async def find_by_user_id(self, user_id: EntityId) -> list[Guide]:
        return [
            g for g in self.saved_guides
            if g.created_by_user_id == user_id
        ]

    async def find_public_guides(self) -> list[Guide]:
        return [g for g in self.saved_guides if g.is_public]

    async def find_highlighted_guides(self) -> list[Guide]:
        return [
            g for g in self.saved_guides
            if g.is_highlighted and g.is_public
        ]

    async def find_accessible_by_user(
        self, user_id: EntityId | None
    ) -> list[Guide]:
        if user_id is None:
            return [g for g in self.saved_guides if g.is_public]
        return [
            g for g in self.saved_guides
            if g.is_public or g.created_by_user_id == user_id
        ]

    async def save(self, entity: Guide) -> None:
        self.saved_guides = [
            g for g in self.saved_guides if g.id != entity.id
        ]
        self.saved_guides.append(entity)

    async def delete(self, id: EntityId) -> None:
        self.saved_guides = [
            g for g in self.saved_guides if g.id != id
        ]


class MockAuditLogRepository(IAuditLogRepository):
    """Mock audit log repository."""

    def __init__(self) -> None:
        self.saved_logs: list[AuditLog] = []

    async def save(self, entity: AuditLog) -> None:
        self.saved_logs.append(entity)

    async def find_by_id(self, id: EntityId) -> AuditLog | None:
        return None

    async def find_all(self) -> list[AuditLog]:
        return self.saved_logs

    async def delete(self, id: EntityId) -> None:
        pass

    async def find_by_user(
        self, user_id: str, limit: int = 100, offset: int = 0
    ) -> list[AuditLog]:
        return []

    async def find_by_resource(
        self, resource_type: str, resource_id: str
    ) -> list[AuditLog]:
        return []

    async def find_by_date_range(
        self,
        start_date: datetime,
        end_date: datetime,
        limit: int = 1000,
    ) -> list[AuditLog]:
        return []

    async def find_admin_actions(
        self, limit: int = 100, offset: int = 0
    ) -> list[AuditLog]:
        return []


class TestUpdateGuideAdminFields:
    """Test admin-only fields: guide_type and created_by_user_id."""

    @pytest.fixture
    def repository(self) -> MockGuideRepository:
        return MockGuideRepository()

    @pytest.fixture
    def event_service(self) -> EventPersistenceService:
        return EventPersistenceService(MockAuditLogRepository())

    @pytest.fixture
    def admin_user(self) -> User:
        return User(
            id=EntityId(str(uuid4())),
            email=Email("admin@example.com"),
            password_hash="hashed",
            is_admin=True,
        )

    @pytest.fixture
    def regular_user(self) -> User:
        return User(
            id=EntityId(str(uuid4())),
            email=Email("user@example.com"),
            password_hash="hashed",
            is_admin=False,
        )

    @pytest.fixture
    def guide(self, regular_user: User) -> Guide:
        return Guide(
            id=EntityId(str(uuid4())),
            guide_type=GuideType.COOKING,
            title=GuideTitle("My Recipe"),
            created_by_user_id=regular_user.id,
        )

    @pytest.mark.asyncio
    async def test_admin_can_update_guide_type(
        self,
        repository: MockGuideRepository,
        event_service: EventPersistenceService,
        admin_user: User,
        guide: Guide,
    ) -> None:
        """Admin can change guide type."""
        await repository.save(guide)
        use_case = UpdateGuide(repository, event_service)

        dto = GuideUpdateDTO(guide_type="workout")
        result = await use_case.execute(
            guide.id.value, dto, admin_user
        )

        assert result is not None
        assert result.guide_type == "workout"

    @pytest.mark.asyncio
    async def test_admin_can_reassign_user(
        self,
        repository: MockGuideRepository,
        event_service: EventPersistenceService,
        admin_user: User,
        guide: Guide,
    ) -> None:
        """Admin can reassign guide to a different user."""
        await repository.save(guide)
        use_case = UpdateGuide(repository, event_service)

        new_user_id = str(uuid4())
        dto = GuideUpdateDTO(created_by_user_id=new_user_id)
        result = await use_case.execute(
            guide.id.value, dto, admin_user
        )

        assert result is not None
        assert result.created_by_user_id == new_user_id

    @pytest.mark.asyncio
    async def test_non_admin_cannot_update_guide_type(
        self,
        repository: MockGuideRepository,
        event_service: EventPersistenceService,
        regular_user: User,
        guide: Guide,
    ) -> None:
        """Non-admin user cannot change guide type."""
        await repository.save(guide)
        use_case = UpdateGuide(repository, event_service)

        dto = GuideUpdateDTO(guide_type="workout")
        with pytest.raises(AuthorizationException):
            await use_case.execute(
                guide.id.value, dto, regular_user
            )

    @pytest.mark.asyncio
    async def test_non_admin_cannot_reassign_user(
        self,
        repository: MockGuideRepository,
        event_service: EventPersistenceService,
        regular_user: User,
        guide: Guide,
    ) -> None:
        """Non-admin user cannot reassign guide."""
        await repository.save(guide)
        use_case = UpdateGuide(repository, event_service)

        dto = GuideUpdateDTO(created_by_user_id=str(uuid4()))
        with pytest.raises(AuthorizationException):
            await use_case.execute(
                guide.id.value, dto, regular_user
            )

    @pytest.mark.asyncio
    async def test_admin_can_update_type_and_reassign_together(
        self,
        repository: MockGuideRepository,
        event_service: EventPersistenceService,
        admin_user: User,
        guide: Guide,
    ) -> None:
        """Admin can update both type and user in one request."""
        await repository.save(guide)
        use_case = UpdateGuide(repository, event_service)

        new_user_id = str(uuid4())
        dto = GuideUpdateDTO(
            guide_type="general",
            created_by_user_id=new_user_id,
        )
        result = await use_case.execute(
            guide.id.value, dto, admin_user
        )

        assert result is not None
        assert result.guide_type == "general"
        assert result.created_by_user_id == new_user_id
