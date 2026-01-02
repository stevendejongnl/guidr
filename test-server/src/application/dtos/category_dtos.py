"""Category DTOs for application layer."""

from dataclasses import dataclass
from typing import Optional


@dataclass
class CategoryCreateDTO:
    """DTO for creating a category."""

    name: str
    parent_id: Optional[str] = None


@dataclass
class CategoryUpdateDTO:
    """DTO for updating a category."""

    name: Optional[str] = None


@dataclass
class CategoryResponseDTO:
    """DTO for category response."""

    id: str
    name: str
    parent_id: Optional[str]
    created_at: str  # ISO format
    updated_at: str  # ISO format
