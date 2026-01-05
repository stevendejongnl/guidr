"""Domain events."""

from .base import BaseDomainEvent
from .category_events import CategoryCreated, CategoryDeleted, CategoryUpdated
from .guide_events import (
    GuideCreated,
    GuideDeleted,
    GuideUpdated,
    StepAddedToGuide,
    StepRemovedFromGuide,
)
from .session_events import (
    SessionCancelled,
    SessionCompleted,
    SessionCreated,
    SessionPaused,
    SessionResumed,
    SessionStarted,
    SessionStepChanged,
)
from .step_events import StepCreated, StepDeleted, StepUpdated
from .user_events import UserLoggedIn, UserPasswordChanged, UserRegistered

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
