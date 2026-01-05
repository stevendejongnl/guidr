"""Error response models."""


from pydantic import BaseModel, Field


class ErrorDetail(BaseModel):
    """Detailed error information."""

    field: str | None = None
    message: str
    code: str | None = None


class ErrorResponse(BaseModel):
    """Standardized error response."""

    error: str
    code: str
    details: list[ErrorDetail] = Field(default_factory=list)

    class Config:
        """Pydantic config."""

        json_schema_extra = {
            "example": {
                "error": "Validation failed",
                "code": "VALIDATION_ERROR",
                "details": [
                    {
                        "field": "email",
                        "message": "Invalid email format",
                        "code": "INVALID_EMAIL",
                    }
                ],
            }
        }
