"""Dependency injection container."""

from dependency_injector import containers, providers

from .infrastructure.config.settings import Settings
from .infrastructure.persistence.mongodb.database import Database
from .infrastructure.persistence.mongodb.repositories import (
    MongoCategoryRepository,
    MongoGuideRepository,
    MongoStepRepository,
    MongoSessionRepository,
    MongoUserRepository,
)
from .infrastructure.auth import PasswordHasher, JWTService

# Import all use cases
from .application.use_cases.category import (
    CreateCategory,
    GetCategory,
    GetAllCategories,
    GetCategoriesByParent,
    UpdateCategory,
    DeleteCategory,
)
from .application.use_cases.guide import (
    CreateGuide,
    GetGuide,
    GetAllGuides,
    GetGuidesByCategory,
    UpdateGuide,
    DeleteGuide,
)
from .application.use_cases.step import (
    CreateStep,
    GetStep,
    GetAllSteps,
    GetStepsByGuide,
    UpdateStep,
    DeleteStep,
)
from .application.use_cases.session import (
    CreateSession,
    GetSession,
    GetAllSessions,
    GetSessionsByGuide,
    GetSessionsByStatus,
    StartSession,
    PauseSession,
    ResumeSession,
    CompleteSession,
    CancelSession,
    MoveSessionToStep,
    DeleteSession,
)
from .application.use_cases.user import RegisterUser, LoginUser


class Container(containers.DeclarativeContainer):
    """Application dependency injection container."""

    # Configuration
    config = providers.Singleton(Settings)

    # Infrastructure - Database
    database = providers.Singleton(
        Database,
        settings=config,
    )

    # Infrastructure - Auth
    password_hasher = providers.Singleton(PasswordHasher)

    jwt_service = providers.Singleton(
        JWTService,
        settings=config,
    )

    # Repositories (Singletons)
    category_repository = providers.Singleton(
        MongoCategoryRepository,
        database=database,
    )

    guide_repository = providers.Singleton(
        MongoGuideRepository,
        database=database,
    )

    step_repository = providers.Singleton(
        MongoStepRepository,
        database=database,
    )

    session_repository = providers.Singleton(
        MongoSessionRepository,
        database=database,
    )

    user_repository = providers.Singleton(
        MongoUserRepository,
        database=database,
    )

    # Category Use Cases (Factories)
    create_category_use_case = providers.Factory(
        CreateCategory,
        category_repository=category_repository,
    )

    get_category_use_case = providers.Factory(
        GetCategory,
        category_repository=category_repository,
    )

    get_all_categories_use_case = providers.Factory(
        GetAllCategories,
        category_repository=category_repository,
    )

    get_categories_by_parent_use_case = providers.Factory(
        GetCategoriesByParent,
        category_repository=category_repository,
    )

    update_category_use_case = providers.Factory(
        UpdateCategory,
        category_repository=category_repository,
    )

    delete_category_use_case = providers.Factory(
        DeleteCategory,
        category_repository=category_repository,
    )

    # Guide Use Cases (Factories)
    create_guide_use_case = providers.Factory(
        CreateGuide,
        guide_repository=guide_repository,
        category_repository=category_repository,
    )

    get_guide_use_case = providers.Factory(
        GetGuide,
        guide_repository=guide_repository,
    )

    get_all_guides_use_case = providers.Factory(
        GetAllGuides,
        guide_repository=guide_repository,
    )

    get_guides_by_category_use_case = providers.Factory(
        GetGuidesByCategory,
        guide_repository=guide_repository,
    )

    update_guide_use_case = providers.Factory(
        UpdateGuide,
        guide_repository=guide_repository,
        category_repository=category_repository,
    )

    delete_guide_use_case = providers.Factory(
        DeleteGuide,
        guide_repository=guide_repository,
    )

    # Step Use Cases (Factories)
    create_step_use_case = providers.Factory(
        CreateStep,
        step_repository=step_repository,
        guide_repository=guide_repository,
    )

    get_step_use_case = providers.Factory(
        GetStep,
        step_repository=step_repository,
    )

    get_all_steps_use_case = providers.Factory(
        GetAllSteps,
        step_repository=step_repository,
    )

    get_steps_by_guide_use_case = providers.Factory(
        GetStepsByGuide,
        step_repository=step_repository,
    )

    update_step_use_case = providers.Factory(
        UpdateStep,
        step_repository=step_repository,
    )

    delete_step_use_case = providers.Factory(
        DeleteStep,
        step_repository=step_repository,
    )

    # Session Use Cases (Factories)
    create_session_use_case = providers.Factory(
        CreateSession,
        session_repository=session_repository,
        guide_repository=guide_repository,
    )

    get_session_use_case = providers.Factory(
        GetSession,
        session_repository=session_repository,
    )

    get_all_sessions_use_case = providers.Factory(
        GetAllSessions,
        session_repository=session_repository,
    )

    get_sessions_by_guide_use_case = providers.Factory(
        GetSessionsByGuide,
        session_repository=session_repository,
    )

    get_sessions_by_status_use_case = providers.Factory(
        GetSessionsByStatus,
        session_repository=session_repository,
    )

    start_session_use_case = providers.Factory(
        StartSession,
        session_repository=session_repository,
    )

    pause_session_use_case = providers.Factory(
        PauseSession,
        session_repository=session_repository,
    )

    resume_session_use_case = providers.Factory(
        ResumeSession,
        session_repository=session_repository,
    )

    complete_session_use_case = providers.Factory(
        CompleteSession,
        session_repository=session_repository,
    )

    cancel_session_use_case = providers.Factory(
        CancelSession,
        session_repository=session_repository,
    )

    move_session_to_step_use_case = providers.Factory(
        MoveSessionToStep,
        session_repository=session_repository,
        step_repository=step_repository,
    )

    delete_session_use_case = providers.Factory(
        DeleteSession,
        session_repository=session_repository,
    )

    # User Use Cases (Factories)
    register_user_use_case = providers.Factory(
        RegisterUser,
        user_repository=user_repository,
        password_hasher=password_hasher,
    )

    login_user_use_case = providers.Factory(
        LoginUser,
        user_repository=user_repository,
        password_hasher=password_hasher,
    )
