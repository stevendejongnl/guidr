"""Telegram notification service."""

import logging
from datetime import UTC, datetime
from html import escape

import httpx

from ..config.settings import Settings


class TelegramNotificationService:
    """Service for sending notifications via Telegram."""

    def __init__(self, settings: Settings):
        """Initialize Telegram notification service.

        Args:
            settings: Application settings containing Telegram configuration
        """
        self._bot_token = settings.telegram_bot_token
        self._chat_id = settings.telegram_chat_id
        self._app_name = settings.app_name
        self._logger = logging.getLogger(__name__)

    def _pod_line(self, pod_name: str | None) -> str:
        """Render the Pod identification line when a pod name is available, else empty."""
        if not pod_name:
            return ""
        return "\n<b>Pod:</b> <code>" + escape(pod_name) + "</code>"

    async def send_startup_notification(
        self,
        version: str,
        pod_name: str | None = None,
    ) -> None:
        """Send startup notification to Telegram.

        Args:
            version: Application version string
            pod_name: Kubernetes pod name (optional)

        Gracefully handles missing credentials or network failures without raising exceptions.
        """
        # Skip if credentials are not configured
        if not self._bot_token or not self._chat_id:
            self._logger.info(
                "Telegram credentials not configured, skipping startup notification"
            )
            return

        try:
            timestamp = datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S UTC")
            message = (
                f"<b>🚀 {escape(self._app_name)} API Server Started</b>\n\n"
                "<b>Status:</b> ✅ Running\n"
                "<b>Version:</b> " + version + "\n"
                "<b>Timestamp:</b> " + timestamp
                + self._pod_line(pod_name)
                + '\n\n<a href="https://guidr.madebysteven.nl/api/docs">API Documentation</a>'
            )

            async with httpx.AsyncClient() as client:
                url = f"https://api.telegram.org/bot{self._bot_token}/sendMessage"
                response = await client.post(
                    url,
                    json={
                        "chat_id": self._chat_id,
                        "text": message,
                        "parse_mode": "HTML",
                        "disable_notification": True,
                    },
                    timeout=10.0,
                )

                if response.status_code == 200:
                    self._logger.info("Startup notification sent successfully")
                else:
                    self._logger.warning(
                        f"Failed to send startup notification: HTTP {response.status_code}"
                    )
        except httpx.TimeoutException:
            self._logger.warning("Telegram notification timeout, continuing startup")
        except httpx.RequestError as e:
            self._logger.warning(f"Failed to send Telegram notification: {e}")
        except Exception as e:
            self._logger.warning(f"Unexpected error sending Telegram notification: {e}")

    async def send_crash_notification(
        self,
        error: Exception,
        version: str,
        pod_name: str | None = None
    ) -> None:
        """Send crash notification for unhandled exceptions.

        Args:
            error: The exception that caused the crash
            version: Application version string
            pod_name: Kubernetes pod name (optional)

        Gracefully handles missing credentials or network failures without raising exceptions.
        """
        if not self._bot_token or not self._chat_id:
            self._logger.info(
                "Telegram credentials not configured, skipping crash notification"
            )
            return

        try:
            timestamp = datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S UTC")
            error_type = type(error).__name__
            error_message = str(error)[:500]  # Limit traceback to 500 chars

            api_docs_url = "https://guidr.madebysteven.nl/api/docs"
            message = (
                f"<b>❌ {escape(self._app_name)} API Server Crashed</b>\n\n"
                "<b>Error Type:</b> " + error_type + "\n"
                "<b>Message:</b> <code>" + escape(error_message) + "</code>\n"
                "<b>Version:</b> " + version + "\n"
                "<b>Timestamp:</b> " + timestamp
                + self._pod_line(pod_name)
                + f'\n\n<a href="{api_docs_url}">API Documentation</a>'
            )

            await self._send_message(message)
        except httpx.TimeoutException:
            self._logger.warning("Telegram crash notification timeout")
        except httpx.RequestError as e:
            self._logger.warning(f"Failed to send crash notification: {e}")
        except Exception as e:
            self._logger.warning(f"Unexpected error sending crash notification: {e}")

    async def send_shutdown_notification(
        self,
        version: str,
        pod_name: str | None = None,
        reason: str = "graceful"
    ) -> None:
        """Send shutdown notification.

        Args:
            version: Application version string
            pod_name: Kubernetes pod name (optional)
            reason: Shutdown reason (graceful/error/etc)

        Gracefully handles missing credentials or network failures without raising exceptions.
        """
        if not self._bot_token or not self._chat_id:
            self._logger.info(
                "Telegram credentials not configured, skipping shutdown notification"
            )
            return

        try:
            timestamp = datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S UTC")

            api_docs_url = "https://guidr.madebysteven.nl/api/docs"
            message = (
                f"<b>🔄 {escape(self._app_name)} API Server Shutdown</b>\n\n"
                "<b>Reason:</b> " + reason + "\n"
                "<b>Version:</b> " + version + "\n"
                "<b>Timestamp:</b> " + timestamp
                + self._pod_line(pod_name)
                + f'\n\n<a href="{api_docs_url}">API Documentation</a>'
            )

            await self._send_message(message, disable_notification=True)
        except httpx.TimeoutException:
            self._logger.warning("Telegram shutdown notification timeout")
        except httpx.RequestError as e:
            self._logger.warning(f"Failed to send shutdown notification: {e}")
        except Exception as e:
            self._logger.warning(f"Unexpected error sending shutdown notification: {e}")

    async def send_health_failure_notification(
        self,
        reason: str,
        version: str,
        pod_name: str | None = None
    ) -> None:
        """Send health check failure notification.

        Args:
            reason: Reason for health failure
            version: Application version string
            pod_name: Kubernetes pod name (optional)

        Gracefully handles missing credentials or network failures without raising exceptions.
        """
        if not self._bot_token or not self._chat_id:
            self._logger.info(
                "Telegram credentials not configured, skipping health failure notification"
            )
            return

        try:
            timestamp = datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S UTC")

            api_docs_url = "https://guidr.madebysteven.nl/api/docs"
            message = (
                f"<b>⚠️ {escape(self._app_name)} API Server Unhealthy</b>\n\n"
                "<b>Reason:</b> " + escape(reason) + "\n"
                "<b>Version:</b> " + version + "\n"
                "<b>Timestamp:</b> " + timestamp
                + self._pod_line(pod_name)
                + f'\n\n<a href="{api_docs_url}">API Documentation</a>'
            )

            await self._send_message(message, disable_notification=True)
        except httpx.TimeoutException:
            self._logger.warning("Telegram health failure notification timeout")
        except httpx.RequestError as e:
            self._logger.warning(f"Failed to send health failure notification: {e}")
        except Exception as e:
            self._logger.warning(f"Unexpected error sending health failure notification: {e}")

    async def _send_message(self, message: str, disable_notification: bool = False) -> None:
        """Send a message to Telegram.

        Args:
            message: Message text with HTML formatting
            disable_notification: If True, send silently without vibration/sound

        Raises:
            httpx.TimeoutException: If request times out
            httpx.RequestError: If request fails
        """
        async with httpx.AsyncClient() as client:
            url = f"https://api.telegram.org/bot{self._bot_token}/sendMessage"
            response = await client.post(
                url,
                json={
                    "chat_id": self._chat_id,
                    "text": message,
                    "parse_mode": "HTML",
                    "disable_notification": disable_notification,
                },
                timeout=10.0,
            )

            if response.status_code == 200:
                self._logger.info("Notification sent successfully")
            else:
                self._logger.warning(
                    f"Failed to send notification: HTTP {response.status_code}"
                )

