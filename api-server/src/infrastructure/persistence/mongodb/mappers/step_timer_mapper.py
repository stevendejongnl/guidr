"""MongoDB mapper for StepTimer entity."""

from datetime import UTC, datetime
from typing import Any

from src.domain.entities import StepTimer
from src.domain.value_objects import EntityId, StepTimerStatus


def _ensure_utc(dt: datetime | None) -> datetime | None:
    """Attach UTC timezone to naive datetimes from MongoDB."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt


class StepTimerMapper:
    """Maps between StepTimer entity and MongoDB document."""

    @staticmethod
    def to_document(timer: StepTimer) -> dict[str, Any]:
        """Convert StepTimer entity to MongoDB document.

        Args:
            timer: StepTimer entity to convert

        Returns:
            MongoDB document dict
        """
        return {
            "_id": timer.id.value,
            "stepId": timer.step_id.value,
            "guideId": timer.guide_id.value,
            "userId": timer.user_id.value,
            "status": timer.status.value,
            "startedAt": timer.started_at,
            "accumulatedSeconds": timer.accumulated_seconds,
            "durationSeconds": timer.duration_seconds,
            "createdAt": timer.created_at,
            "updatedAt": timer.updated_at,
        }

    @staticmethod
    def to_entity(document: dict[str, Any]) -> StepTimer:
        """Convert MongoDB document to StepTimer entity.

        Args:
            document: MongoDB document dict

        Returns:
            StepTimer entity
        """
        return StepTimer(
            id=EntityId(str(document["_id"])),
            step_id=EntityId(str(document["stepId"])),
            guide_id=EntityId(str(document["guideId"])),
            user_id=EntityId(str(document["userId"])),
            status=StepTimerStatus(document["status"]),
            started_at=_ensure_utc(document.get("startedAt")),
            accumulated_seconds=document.get(
                "accumulatedSeconds", 0
            ),
            duration_seconds=document.get("durationSeconds", 0),
            created_at=document["createdAt"],
            updated_at=document["updatedAt"],
        )
