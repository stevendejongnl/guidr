"""Category DTOs for application layer."""

from dataclasses import dataclass


@dataclass
class CategoryCreateDTO:
    """DTO for creating a category."""

    name: str
    parent_id: str | None = None


@dataclass
class CategoryUpdateDTO:
    """DTO for updating a category."""

    name: str | None = None


@dataclass
class CategoryResponseDTO:
    """DTO for category response."""

    id: str
    name: str
    parent_id: str | None
    created_at: str  # ISO format
    updated_at: str  # ISO format
