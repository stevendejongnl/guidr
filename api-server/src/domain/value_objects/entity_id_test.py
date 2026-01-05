import uuid

import pytest

from src.domain.exceptions import ValidationException
from src.domain.value_objects import EntityId


class TestEntityId:
    """Test EntityId value object."""

    def test_create_with_valid_uuid(self):
        """Should create EntityId with valid UUID string."""
        uuid_str = str(uuid.uuid4())
        entity_id = EntityId(uuid_str)

        assert entity_id.value == uuid_str
        assert str(entity_id) == uuid_str

    def test_create_with_invalid_uuid(self):
        """Should raise ValidationException for invalid UUID."""
        with pytest.raises(ValidationException) as exc_info:
            EntityId("not-a-uuid")

        assert "Invalid entity ID format" in str(exc_info.value)

    def test_create_with_empty_string(self):
        """Should raise ValidationException for empty string."""
        with pytest.raises(ValidationException):
            EntityId("")

    def test_immutability(self):
        """Should be immutable."""
        entity_id = EntityId(str(uuid.uuid4()))

        with pytest.raises(AttributeError):
            entity_id.value = str(uuid.uuid4())

    def test_equality(self):
        """Should be equal when values match."""
        uuid_str = str(uuid.uuid4())
        entity_id1 = EntityId(uuid_str)
        entity_id2 = EntityId(uuid_str)

        assert entity_id1 == entity_id2

    def test_inequality(self):
        """Should not be equal when values differ."""
        entity_id1 = EntityId(str(uuid.uuid4()))
        entity_id2 = EntityId(str(uuid.uuid4()))

        assert entity_id1 != entity_id2

    def test_hash(self):
        """Should be hashable."""
        uuid_str = str(uuid.uuid4())
        entity_id1 = EntityId(uuid_str)
        entity_id2 = EntityId(uuid_str)

        assert hash(entity_id1) == hash(entity_id2)

    def test_use_in_set(self):
        """Should be usable in sets."""
        uuid_str = str(uuid.uuid4())
        entity_id1 = EntityId(uuid_str)
        entity_id2 = EntityId(uuid_str)
        entity_id3 = EntityId(str(uuid.uuid4()))

        ids_set = {entity_id1, entity_id2, entity_id3}
        assert len(ids_set) == 2  # id1 and id2 are the same
