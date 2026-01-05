"""Password hashing service using Argon2."""

from argon2 import PasswordHasher as Argon2PasswordHasher
from argon2.exceptions import VerifyMismatchError


class PasswordHasher:
    """Service for hashing and verifying passwords using Argon2."""

    def __init__(self):
        """Initialize password hasher with Argon2."""
        self._hasher = Argon2PasswordHasher()

    def hash_password(self, password: str) -> str:
        """Hash a password using Argon2.

        Args:
            password: Plain text password

        Returns:
            Hashed password string
        """
        return str(self._hasher.hash(password))

    def verify_password(self, password: str, password_hash: str) -> bool:
        """Verify a password against a hash.

        Args:
            password: Plain text password to verify
            password_hash: Hashed password

        Returns:
            True if password matches hash, False otherwise
        """
        try:
            self._hasher.verify(password_hash, password)
            return True
        except VerifyMismatchError:
            return False
