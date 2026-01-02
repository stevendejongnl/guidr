"""Domain events."""

from .base import BaseDomainEvent
from .user_events import UserRegistered, UserLoggedIn, UserPasswordChanged
from .category_events import CategoryCreated, CategoryUpdated, CategoryDeleted
from .guide_events import (
    GuideCreated,
    GuideUpdated,
    GuideDeleted,
    StepAddedToGuide,
    StepRemovedFromGuide,
)
from .step_events import StepCreated, StepUpdated, StepDeleted
from .session_events import (
    SessionCreated,
    SessionStarted,
    SessionPaused,
    SessionResumed,
    SessionCompleted,
    SessionCancelled,
    SessionStepChanged,
)

__all__ = [
    "BaseDomainEvent",
    # User events
    "UserRegistered",
    "UserLoggedIn",
    "UserPasswordChanged",
    # Category events
    "CategoryCreated",
    "CategoryUpdated",
    "CategoryDeleted",
    # Guide events
    "GuideCreated",
    "GuideUpdated",
    "GuideDeleted",
    "StepAddedToGuide",
    "StepRemovedFromGuide",
    # Step events
    "StepCreated",
    "StepUpdated",
    "StepDeleted",
    # Session events
    "SessionCreated",
    "SessionStarted",
    "SessionPaused",
    "SessionResumed",
    "SessionCompleted",
    "SessionCancelled",
    "SessionStepChanged",
]
