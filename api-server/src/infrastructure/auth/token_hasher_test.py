"""Tests for token hasher utility."""

from src.infrastructure.auth.token_hasher import hash_token, verify_token_hash


class TestTokenHasher:
    """Test token hashing functions."""

    def test_hash_token_returns_hex_string(self):
        """hash_token should return a hex-encoded SHA-256 hash."""
        result = hash_token("test-token")
        assert isinstance(result, str)
        assert len(result) == 64  # SHA-256 hex digest is 64 chars

    def test_hash_token_is_deterministic(self):
        """Same input should produce same hash."""
        hash1 = hash_token("my-token")
        hash2 = hash_token("my-token")
        assert hash1 == hash2

    def test_hash_token_different_inputs_produce_different_hashes(self):
        """Different inputs should produce different hashes."""
        hash1 = hash_token("token-1")
        hash2 = hash_token("token-2")
        assert hash1 != hash2

    def test_verify_token_hash_matches(self):
        """verify_token_hash should return True for matching token."""
        token = "my-refresh-token"
        token_hash = hash_token(token)
        assert verify_token_hash(token, token_hash) is True

    def test_verify_token_hash_does_not_match(self):
        """verify_token_hash should return False for non-matching token."""
        token_hash = hash_token("original-token")
        assert verify_token_hash("different-token", token_hash) is False
