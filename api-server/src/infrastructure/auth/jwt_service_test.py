"""Tests for JWT service."""

from unittest.mock import Mock

import pytest

from src.infrastructure.auth.jwt_service import JWTService


class TestJWTServiceTokenTypes:
    """Test JWT service token type claims."""

    @pytest.fixture
    def settings(self):
        """Create mock settings."""
        s = Mock()
        s.jwt_secret_key = "test-secret-key"
        s.jwt_algorithm = "HS256"
        s.jwt_expiration_minutes = 60
        s.jwt_refresh_expiration_minutes = 43200
        return s

    @pytest.fixture
    def jwt_service(self, settings):
        """Create JWT service instance."""
        return JWTService(settings)

    def test_access_token_has_type_claim(self, jwt_service):
        """Access token should have type=access claim."""
        token = jwt_service.create_access_token(data={"sub": "user-123"})
        payload = jwt_service.verify_token(token)
        assert payload is not None
        assert payload["type"] == "access"

    def test_refresh_token_has_type_claim(self, jwt_service):
        """Refresh token should have type=refresh claim."""
        token = jwt_service.create_refresh_token(data={"sub": "user-123"})
        payload = jwt_service.verify_token(token)
        assert payload is not None
        assert payload["type"] == "refresh"

    def test_verify_access_token_accepts_access_token(self, jwt_service):
        """verify_access_token should accept access tokens."""
        token = jwt_service.create_access_token(data={"sub": "user-123"})
        payload = jwt_service.verify_access_token(token)
        assert payload is not None
        assert payload["sub"] == "user-123"

    def test_verify_access_token_rejects_refresh_token(self, jwt_service):
        """verify_access_token should reject refresh tokens."""
        token = jwt_service.create_refresh_token(data={"sub": "user-123"})
        payload = jwt_service.verify_access_token(token)
        assert payload is None

    def test_verify_refresh_token_accepts_refresh_token(self, jwt_service):
        """verify_refresh_token should accept refresh tokens."""
        token = jwt_service.create_refresh_token(data={"sub": "user-123"})
        payload = jwt_service.verify_refresh_token(token)
        assert payload is not None
        assert payload["sub"] == "user-123"

    def test_verify_refresh_token_rejects_access_token(self, jwt_service):
        """verify_refresh_token should reject access tokens."""
        token = jwt_service.create_access_token(data={"sub": "user-123"})
        payload = jwt_service.verify_refresh_token(token)
        assert payload is None

    def test_verify_access_token_rejects_invalid_token(self, jwt_service):
        """verify_access_token should reject invalid tokens."""
        payload = jwt_service.verify_access_token("invalid-token")
        assert payload is None

    def test_verify_refresh_token_rejects_invalid_token(self, jwt_service):
        """verify_refresh_token should reject invalid tokens."""
        payload = jwt_service.verify_refresh_token("invalid-token")
        assert payload is None

    def test_access_token_preserves_sub_claim(self, jwt_service):
        """Access token should preserve the sub claim."""
        token = jwt_service.create_access_token(data={"sub": "user-456"})
        payload = jwt_service.verify_access_token(token)
        assert payload is not None
        assert payload["sub"] == "user-456"

    def test_refresh_token_preserves_sub_claim(self, jwt_service):
        """Refresh token should preserve the sub claim."""
        token = jwt_service.create_refresh_token(data={"sub": "user-789"})
        payload = jwt_service.verify_refresh_token(token)
        assert payload is not None
        assert payload["sub"] == "user-789"
