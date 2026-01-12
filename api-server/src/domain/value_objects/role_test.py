"""Tests for Role value object."""

import pytest

from .role import Role, RoleType

def test_role_creation_from_enum():
    """Test creating role from RoleType enum."""
    role = Role(RoleType.ADMIN)
    assert role.value == "admin"
    assert role.type == RoleType.ADMIN
    assert role.is_admin()

def test_role_creation_from_string():
    """Test creating role from string."""
    role = Role("user")
    assert role.value == "user"
    assert role.type == RoleType.USER
    assert not role.is_admin()

def test_role_case_insensitive():
    """Test role creation is case-insensitive."""
    role = Role("ADMIN")
    assert role.value == "admin"
    assert role.is_admin()

def test_role_case_insensitive_user():
    """Test case insensitivity for user role."""
    role = Role("USER")
    assert role.value == "user"
    assert not role.is_admin()

def test_invalid_role_raises_error():
    """Test invalid role raises ValueError."""
    with pytest.raises(ValueError, match="Invalid role"):
        Role("superuser")

def test_role_equality():
    """Test role equality comparison."""
    role1 = Role(RoleType.ADMIN)
    role2 = Role("admin")
    assert role1 == role2

def test_role_inequality():
    """Test role inequality comparison."""
    admin_role = Role(RoleType.ADMIN)
    user_role = Role(RoleType.USER)
    assert admin_role != user_role

def test_role_not_equal_to_string():
    """Test role is not equal to string."""
    role = Role("admin")
    assert role != "admin"

def test_role_string_representation():
    """Test string representation of role."""
    role = Role("admin")
    assert str(role) == "admin"

def test_role_repr():
    """Test repr of role."""
    role = Role("user")
    assert repr(role) == "Role(user)"
