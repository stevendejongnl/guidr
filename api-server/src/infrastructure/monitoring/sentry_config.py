"""Sentry configuration for error tracking and performance monitoring."""

import logging
import os

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.logging import LoggingIntegration

logger = logging.getLogger(__name__)


def init_sentry() -> None:
    """
    Initialize Sentry for error tracking.

    Only initializes if SENTRY_DSN environment variable is set.
    This should only be enabled in production environments (Kubernetes).
    """
    sentry_dsn = os.getenv("SENTRY_DSN")

    if not sentry_dsn:
        logger.info("Sentry disabled: SENTRY_DSN not configured")
        return

    environment = os.getenv("SENTRY_ENVIRONMENT", "production")

    sentry_sdk.init(
        dsn=sentry_dsn,
        environment=environment,
        integrations=[
            FastApiIntegration(transaction_style="endpoint"),
            LoggingIntegration(
                level=logging.INFO,  # Capture info and above as breadcrumbs
                event_level=logging.ERROR,  # Send errors as events
            ),
        ],
        # Send default PII (IP address, user info, etc.)
        send_default_pii=True,
    )

    logger.info(
        "Sentry initialized for environment: %s",
        environment,
    )
