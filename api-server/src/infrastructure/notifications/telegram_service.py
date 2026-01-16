"""Telegram notification service."""

import logging
from datetime import UTC, datetime

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
        self._logger = logging.getLogger(__name__)

    async def send_startup_notification(self, version: str) -> None:
        """Send startup notification to Telegram.

        Args:
            version: Application version string

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
                "<b>🚀 API Server Started</b>\n\n"
                "<b>Status:</b> ✅ Running\n"
                "<b>Version:</b> " + version + "\n"
                "<b>Timestamp:</b> " + timestamp + "\n\n"
                '<a href="https://guidr.madebysteven.nl/api/docs">API Documentation</a>'
            )

            async with httpx.AsyncClient() as client:
                url = f"https://api.telegram.org/bot{self._bot_token}/sendMessage"
                response = await client.post(
                    url,
                    json={
                        "chat_id": self._chat_id,
                        "text": message,
                        "parse_mode": "HTML",
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
