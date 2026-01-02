"""Step domain events."""

from dataclasses import dataclass
from typing import Optional
from .base import BaseDomainEvent


@dataclass(frozen=True)
class StepCreated(BaseDomainEvent):
    """Event raised when a step is created."""

    step_id: str
    guide_id: str
    order: int
    title: str
    duration: int
    description: Optional[str] = None


@dataclass(frozen=True)
class StepUpdated(BaseDomainEvent):
    """Event raised when a step is updated."""

    step_id: str
    order: int
    title: str
    duration: int
    description: Optional[str] = None


@dataclass(frozen=True)
class StepDeleted(BaseDomainEvent):
    """Event raised when a step is deleted."""

    step_id: str
    guide_id: str
