"""Generation API router."""

from fastapi import APIRouter, Depends, HTTPException, status

from src.application.dtos.generation_dtos import (
    GenerateGuideDTO,
    GenerateGuideFromUrlDTO,
)
from src.application.dtos.guide_with_steps_dtos import (
    CreateGuideWithStepsDTO,
    StepInput,
)
from src.application.use_cases.guide import (
    CreateGuideWithSteps,
    GenerateGuide,
    GenerateGuideFromUrl,
)
from src.container import Container
from src.domain.entities import User
from src.infrastructure.ai.llm_service import (
    LLMNotConfiguredError,
    LLMServiceError,
)
from src.infrastructure.ai.url_content_extractor import (
    UrlExtractionError,
)

from ..dependencies.auth import get_current_beta_user
from ..models import ErrorResponse
from ..models.generation_models import (
    CreateGuideWithStepsRequest,
    GeneratedGuideResponse,
    GeneratedStepResponse,
    GenerateGuideFromUrlRequest,
    GenerateGuideRequest,
    GuideResponseRef,
    GuideWithStepsResponse,
    StepResponseRef,
)

router = APIRouter(prefix="/guides", tags=["generation"])

_container: Container | None = None


def set_container(container: Container) -> None:
    """Set the DI container for this router."""
    global _container
    _container = container


def get_generate_guide_use_case() -> GenerateGuide:
    assert _container is not None, "Container not initialized"
    return _container.generate_guide_use_case()


def get_generate_from_url_use_case() -> GenerateGuideFromUrl:
    assert _container is not None, "Container not initialized"
    return _container.generate_guide_from_url_use_case()


def get_create_with_steps_use_case() -> CreateGuideWithSteps:
    assert _container is not None, "Container not initialized"
    return _container.create_guide_with_steps_use_case()


@router.post(
    "/generate",
    response_model=GeneratedGuideResponse,
    responses={
        400: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
        502: {"model": ErrorResponse},
    },
)
async def generate_guide(
    request: GenerateGuideRequest,
    use_case: GenerateGuide = Depends(
        get_generate_guide_use_case
    ),
    current_user: User = Depends(get_current_beta_user),
) -> GeneratedGuideResponse:
    """Generate a guide from a text prompt using AI."""
    try:
        dto = GenerateGuideDTO(
            prompt=request.prompt,
            guide_type=request.guide_type,
        )
        result = await use_case.execute(dto)
        return GeneratedGuideResponse(
            guideType=result.guide_type,
            title=result.title,
            description=result.description,
            metadata=result.metadata,
            steps=[
                GeneratedStepResponse(
                    order=s.order,
                    title=s.title,
                    description=s.description,
                    duration=s.duration,
                )
                for s in result.steps
            ],
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except LLMNotConfiguredError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except LLMServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e),
        )


@router.post(
    "/generate-from-url",
    response_model=GeneratedGuideResponse,
    responses={
        400: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
        502: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
    },
)
async def generate_guide_from_url(
    request: GenerateGuideFromUrlRequest,
    use_case: GenerateGuideFromUrl = Depends(
        get_generate_from_url_use_case
    ),
    current_user: User = Depends(get_current_beta_user),
) -> GeneratedGuideResponse:
    """Generate a guide from URL content using AI."""
    try:
        dto = GenerateGuideFromUrlDTO(
            url=request.url,
            guide_type=request.guide_type,
        )
        result = await use_case.execute(dto)
        return GeneratedGuideResponse(
            guideType=result.guide_type,
            title=result.title,
            description=result.description,
            metadata=result.metadata,
            steps=[
                GeneratedStepResponse(
                    order=s.order,
                    title=s.title,
                    description=s.description,
                    duration=s.duration,
                )
                for s in result.steps
            ],
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except UrlExtractionError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
    except LLMNotConfiguredError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except LLMServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e),
        )


@router.post(
    "/with-steps",
    response_model=GuideWithStepsResponse,
    status_code=status.HTTP_201_CREATED,
    responses={400: {"model": ErrorResponse}},
)
async def create_guide_with_steps(
    request: CreateGuideWithStepsRequest,
    use_case: CreateGuideWithSteps = Depends(
        get_create_with_steps_use_case
    ),
    current_user: User = Depends(get_current_beta_user),
) -> GuideWithStepsResponse:
    """Create a guide with steps atomically."""
    try:
        dto = CreateGuideWithStepsDTO(
            guide_type=request.guide_type,
            title=request.title,
            description=request.description,
            metadata=request.metadata,
            is_public=request.is_public,
            steps=[
                StepInput(
                    order=s.order,
                    title=s.title,
                    description=s.description,
                    duration=s.duration,
                )
                for s in request.steps
            ],
        )
        guide_dto, step_dtos = await use_case.execute(
            dto, current_user
        )

        return GuideWithStepsResponse(
            guide=GuideResponseRef(
                id=guide_dto.id,
                guideType=guide_dto.guide_type,
                title=guide_dto.title,
                description=guide_dto.description,
                metadata=guide_dto.metadata,
                stepIds=guide_dto.step_ids,
                createdByUserId=guide_dto.created_by_user_id,
                isPublic=guide_dto.is_public,
                isHighlighted=guide_dto.is_highlighted,
                createdAt=guide_dto.created_at,
                updatedAt=guide_dto.updated_at,
            ),
            steps=[
                StepResponseRef(
                    id=s.id,
                    guideId=s.guide_id,
                    order=s.order,
                    title=s.title,
                    description=s.description,
                    duration=s.duration,
                    createdAt=s.created_at,
                    updatedAt=s.updated_at,
                )
                for s in step_dtos
            ],
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
