"""JWT token service."""

from datetime import UTC, datetime, timedelta

from jose import JWTError, jwt

from ..config.settings import Settings


class JWTService:
    """Service for creating and validating JWT tokens."""

    def __init__(self, settings: Settings):
        """Initialize JWT service.

        Args:
            settings: Application settings containing JWT configuration
        """
        self._secret_key = settings.jwt_secret_key
        self._algorithm = settings.jwt_algorithm
        self._expiration_minutes = settings.jwt_expiration_minutes

    def create_access_token(self, data: dict) -> str:
        """Create a JWT access token.

        Args:
            data: Payload data to encode in the token

        Returns:
            Encoded JWT token string
        """
        to_encode = data.copy()
        expire = datetime.now(UTC) + timedelta(minutes=self._expiration_minutes)
        to_encode.update({"exp": expire})
        encoded_jwt: str = jwt.encode(to_encode, self._secret_key, algorithm=self._algorithm)
        return encoded_jwt

    def verify_token(self, token: str) -> dict[str, object] | None:
        """Verify and decode a JWT token.

        Args:
            token: JWT token string to verify

        Returns:
            Decoded token payload if valid, None otherwise
        """
        try:
            payload: dict[str, object] = jwt.decode(
                token, self._secret_key, algorithms=[self._algorithm]
            )
            return payload
        except JWTError:
            return None
