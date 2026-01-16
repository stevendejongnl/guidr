"""Dependency injection container."""

from dependency_injector import containers, providers

# Import all use cases
from .application.use_cases.audit_log import GetAuditLogs
from .application.use_cases.category import (
    CreateCategory,
    DeleteCategory,
    GetAllCategories,
    GetCategoriesByParent,
    GetCategory,
    UpdateCategory,
)
from .application.use_cases.guide import (
    CreateGuide,
    DeleteGuide,
    GetAllGuides,
    GetGuide,
    GetGuidesByCategory,
    UpdateGuide,
)
from .application.use_cases.session import (
    CancelSession,
    CompleteSession,
    CreateSession,
    DeleteSession,
    GetAllSessions,
    GetSession,
    GetSessionsByGuide,
    GetSessionsByStatus,
    MoveSessionToStep,
    PauseSession,
    ResumeSession,
    StartSession,
)
from .application.use_cases.step import (
    CreateStep,
    DeleteStep,
    GetAllSteps,
    GetStep,
    GetStepsByGuide,
    UpdateStep,
)
from .application.use_cases.user import (
    ChangeEmail,
    ChangePassword,
    DeleteAccount,
    LoginUser,
    RegisterUser,
    UpdateProfile,
)
from .domain.services import EventPersistenceService
from .infrastructure.auth import JWTService, PasswordHasher
from .infrastructure.config.settings import Settings
from .infrastructure.notifications import TelegramNotificationService
from .infrastructure.persistence.mongodb.database import Database
from .infrastructure.persistence.mongodb.repositories import (
    MongoAuditLogRepository,
    MongoCategoryRepository,
    MongoGuideRepository,
    MongoSessionRepository,
    MongoStepRepository,
    MongoUserRepository,
)


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

    # Infrastructure - Notifications
    telegram_notification_service = providers.Singleton(
        TelegramNotificationService,
        settings=config,
    )

    # Repositories (Singletons)
    category_repository = providers.Singleton(
        MongoCategoryRepository,
        database=database.provided.db,
    )

    guide_repository = providers.Singleton(
        MongoGuideRepository,
        database=database.provided.db,
    )

    step_repository = providers.Singleton(
        MongoStepRepository,
        database=database.provided.db,
    )

    session_repository = providers.Singleton(
        MongoSessionRepository,
        database=database.provided.db,
    )

    user_repository = providers.Singleton(
        MongoUserRepository,
        database=database.provided.db,
    )

    audit_log_repository = providers.Singleton(
        MongoAuditLogRepository,
        database=database.provided.db,
    )

    # Domain Services
    event_persistence_service = providers.Singleton(
        EventPersistenceService,
        audit_log_repository=audit_log_repository,
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
        event_persistence_service=event_persistence_service,
    )

    delete_category_use_case = providers.Factory(
        DeleteCategory,
        category_repository=category_repository,
        event_persistence_service=event_persistence_service,
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
        event_persistence_service=event_persistence_service,
    )

    delete_guide_use_case = providers.Factory(
        DeleteGuide,
        guide_repository=guide_repository,
        event_persistence_service=event_persistence_service,
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
        event_persistence_service=event_persistence_service,
    )

    login_user_use_case = providers.Factory(
        LoginUser,
        user_repository=user_repository,
        password_verifier=password_hasher,
        event_persistence_service=event_persistence_service,
    )

    change_password_use_case = providers.Factory(
        ChangePassword,
        user_repository=user_repository,
        password_hasher=password_hasher,
    )

    change_email_use_case = providers.Factory(
        ChangeEmail,
        user_repository=user_repository,
        password_hasher=password_hasher,
    )

    update_profile_use_case = providers.Factory(
        UpdateProfile,
        user_repository=user_repository,
    )

    delete_account_use_case = providers.Factory(
        DeleteAccount,
        user_repository=user_repository,
        password_hasher=password_hasher,
    )

    # Audit Log Use Cases (Factories)
    get_audit_logs_use_case = providers.Factory(
        GetAuditLogs,
        audit_log_repository=audit_log_repository,
    )
