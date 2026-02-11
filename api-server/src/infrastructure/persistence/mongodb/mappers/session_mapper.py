"""MongoDB mapper for Session entity."""

from datetime import UTC, datetime
from typing import Any

from src.domain.entities import Session
from src.domain.value_objects import EntityId, SessionStatus


def _ensure_utc(dt: datetime | None) -> datetime | None:
    """Attach UTC timezone to naive datetimes from MongoDB."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt


class SessionMapper:
    """Maps between Session entity and MongoDB document."""

    @staticmethod
    def to_document(session: Session) -> dict[str, Any]:
        """Convert Session entity to MongoDB document.

        Args:
            session: Session entity to convert

        Returns:
            MongoDB document dict
        """
        return {
            "_id": session.id.value,
            "guideId": session.guide_id.value,
            "status": session.status.value,
            "startedAt": session.started_at,
            "completedAt": session.completed_at,
            "currentStepId": session.current_step_id.value if session.current_step_id else None,
            "stepElapsedSeconds": session.step_elapsed_seconds,
            "createdAt": session.created_at,
            "updatedAt": session.updated_at,
        }

    @staticmethod
    def to_entity(document: dict[str, Any]) -> Session:
        """Convert MongoDB document to Session entity.

        Args:
            document: MongoDB document dict

        Returns:
            Session entity
        """
        return Session(
            id=EntityId(str(document["_id"])),
            guide_id=EntityId(str(document["guideId"])),
            status=SessionStatus(document["status"]),
            started_at=_ensure_utc(document.get("startedAt")),
            completed_at=_ensure_utc(document.get("completedAt")),
            current_step_id=(
                EntityId(str(document["currentStepId"])) if document.get("currentStepId") else None
            ),
            step_elapsed_seconds=document.get("stepElapsedSeconds", 0),
            created_at=document["createdAt"],
            updated_at=document["updatedAt"],
        )
