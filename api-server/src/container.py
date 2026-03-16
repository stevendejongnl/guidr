"""Dependency injection container."""

from dependency_injector import containers, providers

# Import all use cases
from .application.use_cases.audit_log import GetAuditLogs
from .application.use_cases.guide import (
    CopyGuide,
    CreateGuide,
    CreateGuideWithSteps,
    DeleteGuide,
    GenerateGuide,
    GenerateGuideFromUrl,
    GetAllGuides,
    GetGuide,
    GetGuidesByType,
    GetHighlightedGuides,
    GetMyGuides,
    TranslateGuide,
    UpdateGuide,
)
from .application.use_cases.guide_favorite import (
    FavoriteGuide,
    GetUserFavorites,
    UnfavoriteGuide,
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
from .application.use_cases.step_timer import (
    GetActiveTimers,
    GetStepTimersByGuide,
    PauseStepTimer,
    ResetStepTimer,
    StartStepTimer,
)
from .application.use_cases.user import (
    AdminUpdateUser,
    ChangeEmail,
    ChangePassword,
    DeleteAccount,
    DeleteUser,
    LoginUser,
    RegisterUser,
    UpdateProfile,
)
from .domain.services import EventPersistenceService
from .infrastructure.ai import OpenAILLMService, UrlContentExtractor
from .infrastructure.auth import JWTService, PasswordHasher
from .infrastructure.config.settings import Settings
from .infrastructure.coordination import MongoStartupCoordinator
from .infrastructure.event_bus import InMemoryEventBus
from .infrastructure.notifications import TelegramNotificationService
from .infrastructure.persistence.mongodb.database import Database
from .infrastructure.persistence.mongodb.repositories import (
    MongoAuditLogRepository,
    MongoGuideFavoriteRepository,
    MongoGuideRepository,
    MongoSessionRepository,
    MongoStepRepository,
    MongoStepTimerRepository,
    MongoUserRepository,
)
from .infrastructure.sse import SSEManager
from .infrastructure.websocket import ConnectionManager, EventSerializer


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

    # Infrastructure - AI
    llm_service = providers.Singleton(
        OpenAILLMService,
        settings=config,
    )

    url_content_extractor = providers.Singleton(
        UrlContentExtractor,
    )

    # Infrastructure - Coordination
    startup_coordinator = providers.Singleton(
        MongoStartupCoordinator,
        database=database.provided.db,
    )

    # Repositories (Singletons)
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

    step_timer_repository = providers.Singleton(
        MongoStepTimerRepository,
        database=database.provided.db,
    )

    guide_favorite_repository = providers.Singleton(
        MongoGuideFavoriteRepository,
        database=database.provided.db,
    )

    audit_log_repository = providers.Singleton(
        MongoAuditLogRepository,
        database=database.provided.db,
    )

    # Infrastructure - Event Bus & WebSocket
    event_bus = providers.Singleton(InMemoryEventBus)
    connection_manager = providers.Singleton(ConnectionManager)
    event_serializer = providers.Singleton(EventSerializer)

    # Infrastructure - SSE
    sse_manager = providers.Singleton(SSEManager)

    # Domain Services
    event_persistence_service = providers.Singleton(
        EventPersistenceService,
        audit_log_repository=audit_log_repository,
    )

    # Guide Use Cases (Factories)
    create_guide_use_case = providers.Factory(
        CreateGuide,
        guide_repository=guide_repository,
    )

    get_guide_use_case = providers.Factory(
        GetGuide,
        guide_repository=guide_repository,
        step_repository=step_repository,
    )

    get_all_guides_use_case = providers.Factory(
        GetAllGuides,
        guide_repository=guide_repository,
        step_repository=step_repository,
    )

    get_guides_by_type_use_case = providers.Factory(
        GetGuidesByType,
        guide_repository=guide_repository,
        step_repository=step_repository,
    )

    get_my_guides_use_case = providers.Factory(
        GetMyGuides,
        guide_repository=guide_repository,
        step_repository=step_repository,
    )

    get_highlighted_guides_use_case = providers.Factory(
        GetHighlightedGuides,
        guide_repository=guide_repository,
        step_repository=step_repository,
    )

    update_guide_use_case = providers.Factory(
        UpdateGuide,
        guide_repository=guide_repository,
        event_persistence_service=event_persistence_service,
    )

    delete_guide_use_case = providers.Factory(
        DeleteGuide,
        guide_repository=guide_repository,
        event_persistence_service=event_persistence_service,
    )

    generate_guide_use_case = providers.Factory(
        GenerateGuide,
        llm_service=llm_service,
    )

    generate_guide_from_url_use_case = providers.Factory(
        GenerateGuideFromUrl,
        llm_service=llm_service,
        url_content_extractor=url_content_extractor,
    )

    create_guide_with_steps_use_case = providers.Factory(
        CreateGuideWithSteps,
        guide_repository=guide_repository,
        step_repository=step_repository,
    )

    copy_guide_use_case = providers.Factory(
        CopyGuide,
        guide_repository=guide_repository,
        step_repository=step_repository,
    )

    translate_guide_use_case = providers.Factory(
        TranslateGuide,
        guide_repository=guide_repository,
        step_repository=step_repository,
        llm_service=llm_service,
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
        guide_repository=guide_repository,
    )

    get_all_steps_use_case = providers.Factory(
        GetAllSteps,
        step_repository=step_repository,
    )

    get_steps_by_guide_use_case = providers.Factory(
        GetStepsByGuide,
        step_repository=step_repository,
        guide_repository=guide_repository,
    )

    update_step_use_case = providers.Factory(
        UpdateStep,
        step_repository=step_repository,
        guide_repository=guide_repository,
    )

    delete_step_use_case = providers.Factory(
        DeleteStep,
        step_repository=step_repository,
        guide_repository=guide_repository,
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

    # Guide Favorite Use Cases (Factories)
    favorite_guide_use_case = providers.Factory(
        FavoriteGuide,
        guide_favorite_repository=guide_favorite_repository,
    )

    unfavorite_guide_use_case = providers.Factory(
        UnfavoriteGuide,
        guide_favorite_repository=guide_favorite_repository,
    )

    get_user_favorites_use_case = providers.Factory(
        GetUserFavorites,
        guide_favorite_repository=guide_favorite_repository,
    )

    # Step Timer Use Cases (Factories)
    start_step_timer_use_case = providers.Factory(
        StartStepTimer,
        step_timer_repository=step_timer_repository,
        event_bus=event_bus,
    )

    pause_step_timer_use_case = providers.Factory(
        PauseStepTimer,
        step_timer_repository=step_timer_repository,
        event_bus=event_bus,
    )

    reset_step_timer_use_case = providers.Factory(
        ResetStepTimer,
        step_timer_repository=step_timer_repository,
        event_bus=event_bus,
    )

    get_step_timers_by_guide_use_case = providers.Factory(
        GetStepTimersByGuide,
        step_timer_repository=step_timer_repository,
    )

    get_active_timers_use_case = providers.Factory(
        GetActiveTimers,
        step_timer_repository=step_timer_repository,
        guide_repository=guide_repository,
        step_repository=step_repository,
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

    admin_update_user_use_case = providers.Factory(
        AdminUpdateUser,
        user_repository=user_repository,
    )

    delete_user_use_case = providers.Factory(
        DeleteUser,
        user_repository=user_repository,
    )

    # Audit Log Use Cases (Factories)
    get_audit_logs_use_case = providers.Factory(
        GetAuditLogs,
        audit_log_repository=audit_log_repository,
    )
