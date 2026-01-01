"""Guide aggregate root."""

from typing import Optional
from datetime import datetime

from ..entities import Guide, Step
from ..value_objects import EntityId, GuideTitle
from ..exceptions import ValidationException


class GuideAggregate:
    """Guide aggregate ensuring consistency between guide and its steps.

    Aggregate root: Guide
    Aggregate members: Steps

    Invariants:
    - All steps belong to this guide
    - Steps maintain consistent ordering
    - Guide tracks all step IDs
    """

    def __init__(self, guide: Guide, steps: Optional[list[Step]] = None):
        """Initialize Guide aggregate.

        Args:
            guide: The guide entity (aggregate root)
            steps: Optional list of step entities belonging to this guide

        Raises:
            ValidationException: If any step doesn't belong to this guide
        """
        self._guide = guide
        self._steps: dict[EntityId, Step] = {}

        if steps:
            for step in steps:
                if step.guide_id != guide.id:
                    raise ValidationException(
                        f"Step {step.id.value} does not belong to guide {guide.id.value}"
                    )
                self._steps[step.id] = step
                # Ensure guide tracks this step
                if step.id not in guide.step_ids:
                    guide.add_step(step.id)

    @property
    def guide(self) -> Guide:
        """Get the guide (aggregate root)."""
        return self._guide

    @property
    def steps(self) -> list[Step]:
        """Get all steps ordered by their order field."""
        return sorted(self._steps.values(), key=lambda s: s.order)

    @property
    def step_count(self) -> int:
        """Get total number of steps."""
        return len(self._steps)

    def get_step(self, step_id: EntityId) -> Optional[Step]:
        """Get a specific step by ID.

        Args:
            step_id: ID of step to retrieve

        Returns:
            Step if found, None otherwise
        """
        return self._steps.get(step_id)

    def get_ordered_steps(self) -> list[Step]:
        """Get steps ordered by their order field.

        Returns:
            List of steps sorted by order
        """
        return self.steps

    def add_step(self, step: Step) -> None:
        """Add a step to this guide aggregate.

        Args:
            step: Step to add

        Raises:
            ValidationException: If step doesn't belong to this guide or step ID already exists
        """
        if step.guide_id != self._guide.id:
            raise ValidationException(
                f"Step {step.id.value} does not belong to guide {self._guide.id.value}"
            )

        if step.id in self._steps:
            raise ValidationException(
                f"Step {step.id.value} already exists in guide"
            )

        # Add to steps collection
        self._steps[step.id] = step

        # Update guide's step_ids
        self._guide.add_step(step.id)

    def remove_step(self, step_id: EntityId) -> None:
        """Remove a step from this guide aggregate.

        Args:
            step_id: ID of step to remove

        Note:
            No error if step doesn't exist
        """
        if step_id in self._steps:
            del self._steps[step_id]
            self._guide.remove_step(step_id)

    def reorder_steps(self, step_id: EntityId, new_order: int) -> None:
        """Reorder a step within the guide.

        Args:
            step_id: ID of step to reorder
            new_order: New order position

        Raises:
            ValidationException: If step not found or invalid order
        """
        step = self._steps.get(step_id)
        if not step:
            raise ValidationException(f"Step {step_id.value} not found in guide")

        step.update_order(new_order)

    def update_title(self, new_title: GuideTitle) -> None:
        """Update guide title.

        Args:
            new_title: New guide title
        """
        self._guide.update_title(new_title)

    def update_description(self, new_description: str) -> None:
        """Update guide description.

        Args:
            new_description: New description
        """
        self._guide.update_description(new_description)

    def validate_consistency(self) -> bool:
        """Validate aggregate consistency.

        Checks:
        - All steps in _steps belong to this guide
        - All step IDs in guide match _steps keys
        - No duplicate step orders

        Returns:
            True if consistent

        Raises:
            ValidationException: If inconsistencies found
        """
        # Check all steps belong to guide
        for step_id, step in self._steps.items():
            if step.guide_id != self._guide.id:
                raise ValidationException(
                    f"Step {step_id.value} has guide_id {step.guide_id.value} "
                    f"but belongs to guide {self._guide.id.value}"
                )

        # Check guide's step_ids match our steps
        guide_step_ids = set(self._guide.step_ids)
        aggregate_step_ids = set(self._steps.keys())

        if guide_step_ids != aggregate_step_ids:
            raise ValidationException(
                f"Guide step_ids {guide_step_ids} don't match aggregate steps {aggregate_step_ids}"
            )

        # Check for duplicate orders
        orders = [step.order for step in self._steps.values()]
        if len(orders) != len(set(orders)):
            raise ValidationException("Duplicate step orders found")

        return True
