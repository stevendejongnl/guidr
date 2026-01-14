"""Error response models."""


from pydantic import BaseModel, ConfigDict, Field


class ErrorDetail(BaseModel):
    """Detailed error information."""

    field: str | None = None
    message: str
    code: str | None = None


class ErrorResponse(BaseModel):
    """Standardized error response."""

    model_config = ConfigDict(
        json_schema_extra={
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
    )

    error: str
    code: str
    details: list[ErrorDetail] = Field(default_factory=list)
