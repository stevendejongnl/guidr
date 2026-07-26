"""Telegram notification service."""

import logging
from datetime import UTC, datetime
from html import escape

import httpx

from ..config.settings import Settings


class TelegramNotificationService:
    """Service for sending notifications via Apprise (fans out to Telegram + history log)."""

    def __init__(self, settings: Settings):
        """Initialize notification service.

        Args:
            settings: Application settings containing Apprise configuration
        """
        self._apprise_url = settings.apprise_url
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
        """Send startup notification.

        Args:
            version: Application version string
            pod_name: Kubernetes pod name (optional)

        Gracefully handles missing credentials or network failures without raising exceptions.
        """
        if not self._apprise_url:
            self._logger.info(
                "Apprise URL not configured, skipping startup notification"
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

            await self._send_message(message, disable_notification=True)
        except httpx.TimeoutException:
            self._logger.warning("Apprise notification timeout, continuing startup")
        except httpx.RequestError as e:
            self._logger.warning(f"Failed to send Apprise notification: {e}")
        except Exception as e:
            self._logger.warning(f"Unexpected error sending Apprise notification: {e}")

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
        if not self._apprise_url:
            self._logger.info(
                "Apprise URL not configured, skipping crash notification"
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
            self._logger.warning("Apprise crash notification timeout")
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
        if not self._apprise_url:
            self._logger.info(
                "Apprise URL not configured, skipping shutdown notification"
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
            self._logger.warning("Apprise shutdown notification timeout")
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
        if not self._apprise_url:
            self._logger.info(
                "Apprise URL not configured, skipping health failure notification"
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
            self._logger.warning("Apprise health failure notification timeout")
        except httpx.RequestError as e:
            self._logger.warning(f"Failed to send health failure notification: {e}")
        except Exception as e:
            self._logger.warning(f"Unexpected error sending health failure notification: {e}")

    async def _send_message(self, message: str, disable_notification: bool = False) -> None:
        """Send a message via Apprise.

        Args:
            message: Message text with HTML formatting
            disable_notification: Unused — Apprise's generic /notify API has no
                per-call silent-delivery flag; kept for call-site compatibility.

        Raises:
            httpx.TimeoutException: If request times out
            httpx.RequestError: If request fails
        """
        # callers already guard with `if not self._apprise_url: return`
        assert self._apprise_url is not None
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self._apprise_url,
                json={"title": self._app_name, "body": message, "format": "html"},
                timeout=10.0,
            )

            if response.status_code == 200:
                self._logger.info("Notification sent successfully")
            else:
                self._logger.warning(
                    f"Failed to send notification: HTTP {response.status_code}"
                )
