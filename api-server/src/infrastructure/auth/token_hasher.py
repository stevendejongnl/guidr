"""Token hashing utility for refresh token storage."""

import hashlib


def hash_token(token: str) -> str:
    """Hash a token using SHA-256.

    Tokens are high-entropy strings, so no salt is needed.

    Args:
        token: The token to hash

    Returns:
        Hex-encoded SHA-256 hash
    """
    return hashlib.sha256(token.encode()).hexdigest()


def verify_token_hash(token: str, token_hash: str) -> bool:
    """Verify a token against its hash.

    Args:
        token: The token to verify
        token_hash: The expected hash

    Returns:
        True if the token matches the hash
    """
    return hash_token(token) == token_hash
