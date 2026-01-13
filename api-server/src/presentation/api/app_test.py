"""Tests for FastAPI application factory."""

import os
from importlib.metadata import PackageNotFoundError
from unittest.mock import patch

from src.presentation.api.app import _get_version, create_app


class TestVersionResolution:
    """Test version resolution priority."""

    def test_environment_variable_takes_precedence(self) -> None:
        """Environment variable should be used first."""
        with patch.dict(os.environ, {"GUIDR_VERSION": "1.23.2"}):
            with patch("src.presentation.api.app.version", return_value="2.0.0"):
                assert _get_version() == "1.23.2"

    def test_package_metadata_fallback(self) -> None:
        """Package metadata should be used if env var not set."""
        with patch.dict(os.environ, {}, clear=True):
            with patch("src.presentation.api.app.version", return_value="1.23.2"):
                assert _get_version() == "1.23.2"

    def test_dev_fallback_when_package_not_found(self) -> None:
        """Should return dev version when package not installed."""
        with patch.dict(os.environ, {}, clear=True):
            with patch(
                "src.presentation.api.app.version",
                side_effect=PackageNotFoundError(),
            ):
                assert _get_version() == "0.0.0-dev"

    def test_empty_environment_variable_uses_fallback(self) -> None:
        """Empty environment variable should fall back to package metadata."""
        with patch.dict(os.environ, {"GUIDR_VERSION": ""}):
            with patch("src.presentation.api.app.version", return_value="1.23.2"):
                assert _get_version() == "1.23.2"

    def test_fastapi_app_uses_version(self) -> None:
        """FastAPI app should use resolved version."""
        with patch.dict(os.environ, {"GUIDR_VERSION": "1.23.2"}):
            app = create_app()
            assert app.version == "1.23.2"

    def test_fastapi_app_version_from_package_metadata(self) -> None:
        """FastAPI app should use package metadata when env var not set."""
        with patch.dict(os.environ, {}, clear=True):
            with patch(
                "src.presentation.api.app.version", return_value="1.23.2"
            ):
                app = create_app()
                assert app.version == "1.23.2"
