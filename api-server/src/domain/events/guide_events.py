"""Guide domain events."""

from dataclasses import dataclass

from .base import BaseDomainEvent


@dataclass(frozen=True)
class GuideCreated(BaseDomainEvent):
    """Event raised when a guide is created."""

    guide_id: str
    category_id: str
    title: str
    description: str | None = None


@dataclass(frozen=True)
class GuideUpdated(BaseDomainEvent):
    """Event raised when a guide is updated."""

    guide_id: str
    title: str
    description: str | None = None


@dataclass(frozen=True)
class GuideDeleted(BaseDomainEvent):
    """Event raised when a guide is deleted."""

    guide_id: str


@dataclass(frozen=True)
class StepAddedToGuide(BaseDomainEvent):
    """Event raised when a step is added to a guide."""

    guide_id: str
    step_id: str


@dataclass(frozen=True)
class StepRemovedFromGuide(BaseDomainEvent):
    """Event raised when a step is removed from a guide."""

    guide_id: str
    step_id: str
