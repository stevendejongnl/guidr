"""Category domain events."""

from dataclasses import dataclass
from typing import Optional
from .base import BaseDomainEvent


@dataclass(frozen=True)
class CategoryCreated(BaseDomainEvent):
    """Event raised when a category is created."""

    category_id: str
    name: str
    parent_id: Optional[str] = None


@dataclass(frozen=True)
class CategoryUpdated(BaseDomainEvent):
    """Event raised when a category is updated."""

    category_id: str
    name: str
    parent_id: Optional[str] = None


@dataclass(frozen=True)
class CategoryDeleted(BaseDomainEvent):
    """Event raised when a category is deleted."""

    category_id: str
