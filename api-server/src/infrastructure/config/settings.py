"""Application settings."""

import tomllib
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


def _load_toml_config() -> dict:
    """Load configuration from default-configuration.toml."""
    config_path = Path(__file__).parent.parent.parent.parent.parent / "default-configuration.toml"

    if not config_path.exists():
        return {}

    with open(config_path, "rb") as f:
        return tomllib.load(f)


class Settings(BaseSettings):
    """Application settings loaded from environment variables and TOML config."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8"
    )

    # MongoDB
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_database: str = "guidr"

    # JWT
    jwt_secret_key: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 60  # 1 hour
    jwt_refresh_expiration_minutes: int = 60 * 24 * 30  # 30 days

    # CORS
    cors_origins: list[str] = ["*"]

    # App Configuration (loaded from TOML)
    min_app_version: str | None = None
    max_app_version: str | None = None

    # Telegram Notifications (optional)
    telegram_bot_token: str | None = None
    telegram_chat_id: str | None = None

    # OpenAI (optional - AI guide generation)
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o"
    openai_max_tokens: int = 4096

    # Web App Sentry / GlitchTip DSN (served to browser at runtime)
    web_sentry_dsn: str | None = None

    # Deployment Configuration
    app_name: str = "Guidr"
    deployment_id: str | None = None
    pod_name: str | None = None

    def __init__(self, **kwargs):
        """Initialize settings with TOML config overlay."""
        super().__init__(**kwargs)

        # Load TOML config and overlay server settings
        toml_config = _load_toml_config()
        server_config = toml_config.get("server", {})

        if "minAppVersion" in server_config:
            self.min_app_version = server_config["minAppVersion"]
        if "maxAppVersion" in server_config:
            self.max_app_version = server_config["maxAppVersion"]


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
