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
        # Set traces_sample_rate to 1.0 to capture 100% of transactions for performance monitoring
        # Adjust this in production to reduce costs (e.g., 0.1 for 10% sampling)
        traces_sample_rate=0.1,
        # Set profiles_sample_rate to profile 10% of sampled transactions
        profiles_sample_rate=0.1,
        # Enable performance monitoring
        enable_tracing=True,
        # Integrations
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
        "Sentry initialized for environment: %s (sampling: traces=10%%, profiles=10%%)",
        environment,
    )
