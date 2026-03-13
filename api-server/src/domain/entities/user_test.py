from datetime import UTC, datetime

import pytest

from src.domain.entities import User
from src.domain.exceptions import ValidationException
from src.domain.value_objects import Email, EntityId, Role, RoleType


class TestUser:
    """Test User entity."""

    def test_create_user(self):
        """Should create user with valid parameters."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        email = Email("test@example.com")
        password_hash = "$argon2id$v=19$m=65536,t=3,p=4$..."

        user = User(id=id, email=email, password_hash=password_hash)

        assert user.id == id
        assert user.email == email
        assert user.password_hash == password_hash
        assert isinstance(user.created_at, datetime)
        assert isinstance(user.updated_at, datetime)

    def test_create_user_with_custom_timestamps(self):
        """Should create user with custom timestamps."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        email = Email("test@example.com")
        password_hash = "$argon2id$v=19$m=65536,t=3,p=4$..."
        created = datetime(2024, 1, 1, 12, 0, 0)
        updated = datetime(2024, 1, 2, 12, 0, 0)

        user = User(
            id=id,
            email=email,
            password_hash=password_hash,
            created_at=created,
            updated_at=updated
        )

        assert user.created_at == created
        assert user.updated_at == updated

    def test_create_user_with_empty_password_hash(self):
        """Should raise ValidationException for empty password hash."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        email = Email("test@example.com")

        with pytest.raises(ValidationException) as exc_info:
            User(id=id, email=email, password_hash="")

        assert "Password hash cannot be empty" in str(exc_info.value)

    def test_create_user_with_blank_password_hash(self):
        """Should raise ValidationException for blank password hash."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        email = Email("test@example.com")

        with pytest.raises(ValidationException) as exc_info:
            User(id=id, email=email, password_hash="   ")

        assert "Password hash cannot be empty" in str(exc_info.value)

    def test_update_password_hash(self):
        """Should update password hash and timestamp."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        email = Email("test@example.com")
        password_hash = "$argon2id$v=19$m=65536,t=3,p=4$old"
        user = User(id=id, email=email, password_hash=password_hash)
        original_updated = user.updated_at

        new_hash = "$argon2id$v=19$m=65536,t=3,p=4$new"
        user.update_password_hash(new_hash)

        assert user.password_hash == new_hash
        assert user.updated_at >= original_updated

    def test_update_password_hash_with_empty_string(self):
        """Should raise ValidationException when updating with empty hash."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        email = Email("test@example.com")
        password_hash = "$argon2id$v=19$m=65536,t=3,p=4$old"
        user = User(id=id, email=email, password_hash=password_hash)

        with pytest.raises(ValidationException) as exc_info:
            user.update_password_hash("")

        assert "Password hash cannot be empty" in str(exc_info.value)
        assert user.password_hash == password_hash

    def test_update_password_hash_with_blank_string(self):
        """Should raise ValidationException when updating with blank hash."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        email = Email("test@example.com")
        password_hash = "$argon2id$v=19$m=65536,t=3,p=4$old"
        user = User(id=id, email=email, password_hash=password_hash)

        with pytest.raises(ValidationException) as exc_info:
            user.update_password_hash("   ")

        assert "Password hash cannot be empty" in str(exc_info.value)

    def test_immutable_properties(self):
        """Should have immutable id, email, created_at."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        email = Email("test@example.com")
        password_hash = "$argon2id$v=19$m=65536,t=3,p=4$..."
        user = User(id=id, email=email, password_hash=password_hash)

        with pytest.raises(AttributeError):
            setattr(user, "id", EntityId("550e8400-e29b-41d4-a716-446655440001"))

        with pytest.raises(AttributeError):
            setattr(user, "email", Email("new@example.com"))

        with pytest.raises(AttributeError):
            setattr(user, "created_at", datetime.now(UTC))

    def test_create_user_with_name(self):
        """Should create user with optional name."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        email = Email("test@example.com")
        password_hash = "$argon2id$v=19$m=65536,t=3,p=4$..."

        user = User(
            id=id,
            email=email,
            password_hash=password_hash,
            name="John Doe"
        )

        assert user.name == "John Doe"

    def test_create_user_without_name(self):
        """Should create user with None name when not provided."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        email = Email("test@example.com")
        password_hash = "$argon2id$v=19$m=65536,t=3,p=4$..."

        user = User(id=id, email=email, password_hash=password_hash)

        assert user.name is None

    def test_create_user_with_interests(self):
        """Should create user with interests list."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        email = Email("test@example.com")
        password_hash = "$argon2id$v=19$m=65536,t=3,p=4$..."

        user = User(
            id=id,
            email=email,
            password_hash=password_hash,
            interests=["baking", "sports"]
        )

        assert user.interests == ["baking", "sports"]

    def test_create_user_without_interests(self):
        """Should create user with empty interests list when not provided."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        email = Email("test@example.com")
        password_hash = "$argon2id$v=19$m=65536,t=3,p=4$..."

        user = User(id=id, email=email, password_hash=password_hash)

        assert user.interests == []

    def test_update_name(self):
        """Should update name and timestamp."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        email = Email("test@example.com")
        password_hash = "$argon2id$v=19$m=65536,t=3,p=4$..."
        user = User(id=id, email=email, password_hash=password_hash, name="John")
        original_updated = user.updated_at

        user.update_name("John Doe")

        assert user.name == "John Doe"
        assert user.updated_at >= original_updated

    def test_update_name_to_none(self):
        """Should allow setting name to None."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        email = Email("test@example.com")
        password_hash = "$argon2id$v=19$m=65536,t=3,p=4$..."
        user = User(id=id, email=email, password_hash=password_hash, name="John")

        user.update_name(None)

        assert user.name is None

    def test_update_email(self):
        """Should update email and timestamp."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        email = Email("test@example.com")
        password_hash = "$argon2id$v=19$m=65536,t=3,p=4$..."
        user = User(id=id, email=email, password_hash=password_hash)
        original_updated = user.updated_at

        new_email = Email("newemail@example.com")
        user.update_email(new_email)

        assert user.email == new_email
        assert user.updated_at >= original_updated

    def test_set_interests(self):
        """Should replace interests list and update timestamp."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        email = Email("test@example.com")
        password_hash = "$argon2id$v=19$m=65536,t=3,p=4$..."
        user = User(
            id=id,
            email=email,
            password_hash=password_hash,
            interests=["baking"]
        )
        original_updated = user.updated_at

        user.set_interests(["sports", "cooking", "diy"])

        assert user.interests == ["sports", "cooking", "diy"]
        assert user.updated_at >= original_updated

    def test_set_interests_to_empty(self):
        """Should allow setting interests to empty list."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        email = Email("test@example.com")
        password_hash = "$argon2id$v=19$m=65536,t=3,p=4$..."
        user = User(
            id=id,
            email=email,
            password_hash=password_hash,
            interests=["baking", "sports"]
        )

        user.set_interests([])

        assert user.interests == []

    def test_interests_returns_copy(self):
        """Should return a copy of interests list (immutable)."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        email = Email("test@example.com")
        password_hash = "$argon2id$v=19$m=65536,t=3,p=4$..."
        user = User(
            id=id,
            email=email,
            password_hash=password_hash,
            interests=["baking"]
        )

        interests = user.interests
        interests.append("sports")

        # Original should not be modified
        assert user.interests == ["baking"]

    def test_create_user_with_admin_status_true(self):
        """Should create user with is_admin=True."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        email = Email("test@example.com")
        password_hash = "$argon2id$v=19$m=65536,t=3,p=4$..."

        user = User(
            id=id,
            email=email,
            password_hash=password_hash,
            is_admin=True
        )

        assert user.is_admin is True

    def test_create_user_with_admin_status_false(self):
        """Should create user with is_admin=False."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        email = Email("test@example.com")
        password_hash = "$argon2id$v=19$m=65536,t=3,p=4$..."

        user = User(
            id=id,
            email=email,
            password_hash=password_hash,
            is_admin=False
        )

        assert user.is_admin is False

    def test_create_user_defaults_admin_status_to_false(self):
        """Should default is_admin to False when not provided."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        email = Email("test@example.com")
        password_hash = "$argon2id$v=19$m=65536,t=3,p=4$..."

        user = User(id=id, email=email, password_hash=password_hash)

        assert user.is_admin is False

    def test_is_admin_property_is_immutable(self):
        """Should have immutable is_admin property (read-only)."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        email = Email("test@example.com")
        password_hash = "$argon2id$v=19$m=65536,t=3,p=4$..."
        user = User(id=id, email=email, password_hash=password_hash, is_admin=False)

        with pytest.raises(AttributeError):
            setattr(user, "is_admin", True)

    def test_create_user_with_refresh_token_hash(self):
        """Should create user with refresh_token_hash."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        email = Email("test@example.com")
        password_hash = "$argon2id$v=19$m=65536,t=3,p=4$..."

        user = User(
            id=id,
            email=email,
            password_hash=password_hash,
            refresh_token_hash="abc123hash",
        )

        assert user.refresh_token_hash == "abc123hash"

    def test_create_user_defaults_refresh_token_hash_to_none(self):
        """Should default refresh_token_hash to None."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        email = Email("test@example.com")
        password_hash = "$argon2id$v=19$m=65536,t=3,p=4$..."

        user = User(id=id, email=email, password_hash=password_hash)

        assert user.refresh_token_hash is None

    def test_update_refresh_token_hash(self):
        """Should update refresh_token_hash and timestamp."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        email = Email("test@example.com")
        password_hash = "$argon2id$v=19$m=65536,t=3,p=4$..."
        user = User(id=id, email=email, password_hash=password_hash)
        original_updated = user.updated_at

        user.update_refresh_token_hash("newhash456")

        assert user.refresh_token_hash == "newhash456"
        assert user.updated_at >= original_updated

    def test_update_refresh_token_hash_to_none(self):
        """Should allow clearing refresh_token_hash."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        email = Email("test@example.com")
        password_hash = "$argon2id$v=19$m=65536,t=3,p=4$..."
        user = User(
            id=id,
            email=email,
            password_hash=password_hash,
            refresh_token_hash="abc123hash",
        )

        user.update_refresh_token_hash(None)

        assert user.refresh_token_hash is None

    def test_set_role_to_admin(self):
        """Should set role to admin and update timestamp."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        email = Email("test@example.com")
        password_hash = "$argon2id$v=19$m=65536,t=3,p=4$..."
        user = User(id=id, email=email, password_hash=password_hash)
        original_updated = user.updated_at

        user.set_role(Role(RoleType.ADMIN))

        assert user.is_admin is True
        assert user.role == Role(RoleType.ADMIN)
        assert user.updated_at >= original_updated

    def test_set_role_to_user(self):
        """Should set role to user and update timestamp."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        email = Email("test@example.com")
        password_hash = "$argon2id$v=19$m=65536,t=3,p=4$..."
        user = User(
            id=id,
            email=email,
            password_hash=password_hash,
            role=Role(RoleType.ADMIN),
        )
        original_updated = user.updated_at

        user.set_role(Role(RoleType.USER))

        assert user.is_admin is False
        assert user.role == Role(RoleType.USER)
        assert user.updated_at >= original_updated

    def test_set_beta_true(self):
        """Should enable beta and update timestamp."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        email = Email("test@example.com")
        password_hash = "$argon2id$v=19$m=65536,t=3,p=4$..."
        user = User(id=id, email=email, password_hash=password_hash)
        original_updated = user.updated_at

        user.set_beta(True)

        assert user.is_beta is True
        assert user.updated_at >= original_updated

    def test_set_beta_false(self):
        """Should disable beta and update timestamp."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        email = Email("test@example.com")
        password_hash = "$argon2id$v=19$m=65536,t=3,p=4$..."
        user = User(
            id=id,
            email=email,
            password_hash=password_hash,
            is_beta=True,
        )
        original_updated = user.updated_at

        user.set_beta(False)

        assert user.is_beta is False
        assert user.updated_at >= original_updated
