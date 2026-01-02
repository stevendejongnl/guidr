"""Base domain exception."""


class BaseDomainException(Exception):
    """Base class for all domain exceptions."""

    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)
