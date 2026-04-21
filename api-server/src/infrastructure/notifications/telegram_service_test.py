"""Tests for Telegram notification service."""

import logging
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from ..config.settings import Settings
from .telegram_service import TelegramNotificationService


@pytest.fixture
def settings_with_telegram() -> Settings:
    """Create settings with Telegram credentials."""
    settings = MagicMock(spec=Settings)
    settings.telegram_bot_token = "test_bot_token"
    settings.telegram_chat_id = "test_chat_id"
    return settings


@pytest.fixture
def settings_without_telegram() -> Settings:
    """Create settings without Telegram credentials."""
    settings = MagicMock(spec=Settings)
    settings.telegram_bot_token = None
    settings.telegram_chat_id = None
    return settings


@pytest.fixture
def service_with_credentials(settings_with_telegram: Settings) -> TelegramNotificationService:
    """Create service with Telegram credentials."""
    return TelegramNotificationService(settings_with_telegram)


@pytest.fixture
def service_without_credentials(settings_without_telegram: Settings) -> TelegramNotificationService:
    """Create service without Telegram credentials."""
    return TelegramNotificationService(settings_without_telegram)


@pytest.mark.asyncio
async def test_send_startup_notification_success(
    service_with_credentials: TelegramNotificationService, caplog: pytest.LogCaptureFixture
) -> None:
    """Test successful startup notification."""
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        with caplog.at_level(logging.INFO):
            await service_with_credentials.send_startup_notification("1.0.0")

        assert "Startup notification sent successfully" in caplog.text


@pytest.mark.asyncio
async def test_send_startup_notification_missing_credentials(
    service_without_credentials: TelegramNotificationService, caplog: pytest.LogCaptureFixture
) -> None:
    """Test notification skipped when credentials are missing."""
    with caplog.at_level(logging.INFO):
        await service_without_credentials.send_startup_notification("1.0.0")

    assert "Telegram credentials not configured" in caplog.text


@pytest.mark.asyncio
async def test_send_startup_notification_http_error(
    service_with_credentials: TelegramNotificationService, caplog: pytest.LogCaptureFixture
) -> None:
    """Test handling of HTTP errors."""
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_post.return_value = mock_response

        with caplog.at_level(logging.WARNING):
            await service_with_credentials.send_startup_notification("1.0.0")

        assert "Failed to send startup notification: HTTP 401" in caplog.text


@pytest.mark.asyncio
async def test_send_startup_notification_timeout(
    service_with_credentials: TelegramNotificationService, caplog: pytest.LogCaptureFixture
) -> None:
    """Test handling of timeout errors."""
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_post.side_effect = httpx.TimeoutException("Timeout")

        with caplog.at_level(logging.WARNING):
            await service_with_credentials.send_startup_notification("1.0.0")

        assert "Telegram notification timeout" in caplog.text


@pytest.mark.asyncio
async def test_send_startup_notification_network_error(
    service_with_credentials: TelegramNotificationService, caplog: pytest.LogCaptureFixture
) -> None:
    """Test handling of network errors."""
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_post.side_effect = httpx.RequestError("Network error")

        with caplog.at_level(logging.WARNING):
            await service_with_credentials.send_startup_notification("1.0.0")

        assert "Failed to send Telegram notification" in caplog.text


@pytest.mark.asyncio
async def test_send_startup_notification_message_format(
    service_with_credentials: TelegramNotificationService,
) -> None:
    """Test that message is formatted correctly with HTML."""
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        await service_with_credentials.send_startup_notification("1.23.2")

        # Verify the API was called
        mock_post.assert_called_once()

        # Get the call arguments
        call_args = mock_post.call_args
        json_payload = call_args.kwargs.get("json")

        # Verify message contains required elements
        assert json_payload is not None
        assert json_payload["chat_id"] == "test_chat_id"
        assert "1.23.2" in json_payload["text"]
        assert "API Documentation" in json_payload["text"]
        assert json_payload["parse_mode"] == "HTML"
        assert "<b>" in json_payload["text"]
        assert "🚀" in json_payload["text"]


@pytest.mark.asyncio
async def test_send_startup_notification_generic_exception(
    service_with_credentials: TelegramNotificationService, caplog: pytest.LogCaptureFixture
) -> None:
    """Test handling of unexpected exceptions."""
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_post.side_effect = ValueError("Unexpected error")

        with caplog.at_level(logging.WARNING):
            await service_with_credentials.send_startup_notification("1.0.0")

        assert "Unexpected error sending Telegram notification" in caplog.text


@pytest.mark.asyncio
async def test_send_crash_notification_success(
    service_with_credentials: TelegramNotificationService, caplog: pytest.LogCaptureFixture
) -> None:
    """Test successful crash notification."""
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        error = ValueError("Database connection failed")
        with caplog.at_level(logging.INFO):
            await service_with_credentials.send_crash_notification(
                error=error, version="1.0.0", pod_name="guidr-api-server-abc123"
            )

        assert "Notification sent successfully" in caplog.text

        # Verify the API was called
        mock_post.assert_called_once()

        # Get the call arguments
        call_args = mock_post.call_args
        json_payload = call_args.kwargs.get("json")

        # Verify message contains required elements
        assert json_payload is not None
        assert "1.0.0" in json_payload["text"]
        assert "ValueError" in json_payload["text"]
        assert "Database connection failed" in json_payload["text"]
        assert "guidr-api-server-abc123" in json_payload["text"]
        assert "❌" in json_payload["text"]
        assert json_payload["parse_mode"] == "HTML"


@pytest.mark.asyncio
async def test_send_crash_notification_missing_credentials(
    service_without_credentials: TelegramNotificationService, caplog: pytest.LogCaptureFixture
) -> None:
    """Test crash notification skipped when credentials are missing."""
    with caplog.at_level(logging.INFO):
        error = ValueError("Test error")
        await service_without_credentials.send_crash_notification(
            error=error, version="1.0.0"
        )

    assert "Telegram credentials not configured" in caplog.text


@pytest.mark.asyncio
async def test_send_crash_notification_timeout(
    service_with_credentials: TelegramNotificationService, caplog: pytest.LogCaptureFixture
) -> None:
    """Test handling of timeout errors during crash notification."""
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_post.side_effect = httpx.TimeoutException("Timeout")

        with caplog.at_level(logging.WARNING):
            error = RuntimeError("Test crash")
            await service_with_credentials.send_crash_notification(
                error=error, version="1.0.0"
            )

        assert "Telegram crash notification timeout" in caplog.text


@pytest.mark.asyncio
async def test_send_shutdown_notification_success(
    service_with_credentials: TelegramNotificationService, caplog: pytest.LogCaptureFixture
) -> None:
    """Test successful shutdown notification."""
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        with caplog.at_level(logging.INFO):
            await service_with_credentials.send_shutdown_notification(
                version="1.0.0", pod_name="guidr-api-server-xyz789", reason="graceful"
            )

        assert "Notification sent successfully" in caplog.text

        # Verify the API was called
        mock_post.assert_called_once()

        # Get the call arguments
        call_args = mock_post.call_args
        json_payload = call_args.kwargs.get("json")

        # Verify message contains required elements
        assert json_payload is not None
        assert "1.0.0" in json_payload["text"]
        assert "graceful" in json_payload["text"]
        assert "guidr-api-server-xyz789" in json_payload["text"]
        assert "🔄" in json_payload["text"]
        assert json_payload["parse_mode"] == "HTML"


@pytest.mark.asyncio
async def test_send_shutdown_notification_with_error_reason(
    service_with_credentials: TelegramNotificationService,
) -> None:
    """Test shutdown notification with error reason."""
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        await service_with_credentials.send_shutdown_notification(
            version="1.0.0", reason="error: KeyboardInterrupt"
        )

        # Verify the API was called
        mock_post.assert_called_once()

        # Get the call arguments
        call_args = mock_post.call_args
        json_payload = call_args.kwargs.get("json")

        # Verify error reason is in message
        assert json_payload is not None
        assert "error: KeyboardInterrupt" in json_payload["text"]


@pytest.mark.asyncio
async def test_send_health_failure_notification_success(
    service_with_credentials: TelegramNotificationService, caplog: pytest.LogCaptureFixture
) -> None:
    """Test successful health failure notification."""
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        with caplog.at_level(logging.INFO):
            await service_with_credentials.send_health_failure_notification(
                reason="Database connection failed: ConnectionError",
                version="1.0.0",
                pod_name="guidr-api-server-def456"
            )

        assert "Notification sent successfully" in caplog.text

        # Verify the API was called
        mock_post.assert_called_once()

        # Get the call arguments
        call_args = mock_post.call_args
        json_payload = call_args.kwargs.get("json")

        # Verify message contains required elements
        assert json_payload is not None
        assert "1.0.0" in json_payload["text"]
        assert "Database connection failed: ConnectionError" in json_payload["text"]
        assert "guidr-api-server-def456" in json_payload["text"]
        assert "⚠️" in json_payload["text"]
        assert json_payload["parse_mode"] == "HTML"


@pytest.mark.asyncio
async def test_send_health_failure_notification_missing_credentials(
    service_without_credentials: TelegramNotificationService, caplog: pytest.LogCaptureFixture
) -> None:
    """Test health failure notification skipped when credentials are missing."""
    with caplog.at_level(logging.INFO):
        await service_without_credentials.send_health_failure_notification(
            reason="Database error", version="1.0.0"
        )

    assert "Telegram credentials not configured" in caplog.text


@pytest.mark.asyncio
async def test_send_crash_notification_html_escaping(
    service_with_credentials: TelegramNotificationService,
) -> None:
    """Test that crash notification properly escapes HTML characters."""
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        error = ValueError("Error with <tag> & \"quote\"")
        await service_with_credentials.send_crash_notification(
            error=error, version="1.0.0", pod_name="pod<name>"
        )

        # Get the call arguments
        call_args = mock_post.call_args
        json_payload = call_args.kwargs.get("json")

        # Verify HTML is escaped
        assert json_payload is not None
        assert "&lt;tag&gt;" in json_payload["text"]
        assert "&amp;" in json_payload["text"]
        assert "&quot;" in json_payload["text"]
        assert "pod&lt;name&gt;" in json_payload["text"]


@pytest.mark.asyncio
async def test_send_health_failure_notification_html_escaping(
    service_with_credentials: TelegramNotificationService,
) -> None:
    """Test that health failure notification properly escapes HTML characters."""
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        await service_with_credentials.send_health_failure_notification(
            reason="Error <message> & more",
            version="1.0.0",
            pod_name="pod<name>"
        )

        # Get the call arguments
        call_args = mock_post.call_args
        json_payload = call_args.kwargs.get("json")

        # Verify HTML is escaped
        assert json_payload is not None
        assert "&lt;message&gt;" in json_payload["text"]
        assert "&amp;" in json_payload["text"]
        assert "pod&lt;name&gt;" in json_payload["text"]


@pytest.mark.asyncio
async def test_send_startup_notification_includes_pod_name(
    service_with_credentials: TelegramNotificationService,
) -> None:
    """Test that startup notification includes pod name when provided."""
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        await service_with_credentials.send_startup_notification(
            "1.0.0", pod_name="guidr-api-server-ghi789"
        )

        mock_post.assert_called_once()
        call_args = mock_post.call_args
        json_payload = call_args.kwargs.get("json")

        assert json_payload is not None
        assert "1.0.0" in json_payload["text"]
        assert "🚀" in json_payload["text"]
        assert "<b>Pod:</b>" in json_payload["text"]
        assert "guidr-api-server-ghi789" in json_payload["text"]
        assert json_payload["parse_mode"] == "HTML"


@pytest.mark.asyncio
async def test_send_startup_notification_without_pod_name(
    service_with_credentials: TelegramNotificationService,
) -> None:
    """Test that startup notification omits pod name when not provided."""
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        await service_with_credentials.send_startup_notification("1.0.0")

        call_args = mock_post.call_args
        json_payload = call_args.kwargs.get("json")

        assert json_payload is not None
        assert "<b>Pod:</b>" not in json_payload["text"]


@pytest.mark.asyncio
async def test_send_startup_notification_html_escaping(
    service_with_credentials: TelegramNotificationService,
) -> None:
    """Test that startup notification properly escapes HTML in pod name."""
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        await service_with_credentials.send_startup_notification(
            "1.0.0", pod_name="pod<name>"
        )

        call_args = mock_post.call_args
        json_payload = call_args.kwargs.get("json")

        assert json_payload is not None
        assert "pod&lt;name&gt;" in json_payload["text"]
