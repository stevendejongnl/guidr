"""Tests for URL content extractor."""

from unittest.mock import AsyncMock, patch

import httpx
import pytest

from src.infrastructure.ai.url_content_extractor import (
    UrlContentExtractor,
    UrlExtractionError,
)


def _make_response(
    status_code: int = 200,
    text: str = "",
    content_type: str = "text/html",
) -> httpx.Response:
    """Create a real httpx Response for testing."""
    return httpx.Response(
        status_code=status_code,
        text=text,
        headers={"content-type": content_type},
        request=httpx.Request("GET", "https://example.com"),
    )


class TestUrlContentExtractor:
    """Tests for URL content extraction."""

    @pytest.mark.asyncio
    async def test_extracts_text_from_html(self):
        extractor = UrlContentExtractor()
        html = "<html><body><h1>Title</h1><p>Content</p></body></html>"
        resp = _make_response(text=html)

        with patch.object(
            httpx.AsyncClient, "get", new_callable=AsyncMock, return_value=resp
        ):
            result = await extractor.extract("https://example.com")

        assert "Title" in result
        assert "Content" in result
        assert "<h1>" not in result

    @pytest.mark.asyncio
    async def test_strips_script_and_style_tags(self):
        extractor = UrlContentExtractor()
        html = (
            "<html><head>"
            "<style>body{color:red}</style>"
            "<script>alert('x')</script>"
            "</head><body>Visible</body></html>"
        )
        resp = _make_response(text=html)

        with patch.object(
            httpx.AsyncClient, "get", new_callable=AsyncMock, return_value=resp
        ):
            result = await extractor.extract("https://example.com")

        assert "Visible" in result
        assert "alert" not in result
        assert "color:red" not in result

    @pytest.mark.asyncio
    async def test_truncates_long_content(self):
        extractor = UrlContentExtractor()
        html = "<p>" + "a" * 20_000 + "</p>"
        resp = _make_response(text=html)

        with patch.object(
            httpx.AsyncClient, "get", new_callable=AsyncMock, return_value=resp
        ):
            result = await extractor.extract("https://example.com")

        assert len(result) <= 10_000

    @pytest.mark.asyncio
    async def test_raises_on_non_200(self):
        extractor = UrlContentExtractor()
        resp = _make_response(status_code=404)

        with patch.object(
            httpx.AsyncClient, "get", new_callable=AsyncMock, return_value=resp
        ):
            with pytest.raises(UrlExtractionError, match="status 404"):
                await extractor.extract("https://example.com")

    @pytest.mark.asyncio
    async def test_raises_on_unsupported_content_type(self):
        extractor = UrlContentExtractor()
        resp = _make_response(content_type="application/pdf")

        with patch.object(
            httpx.AsyncClient, "get", new_callable=AsyncMock, return_value=resp
        ):
            with pytest.raises(UrlExtractionError, match="Unsupported"):
                await extractor.extract("https://example.com")

    @pytest.mark.asyncio
    async def test_raises_on_timeout(self):
        extractor = UrlContentExtractor()

        with patch.object(
            httpx.AsyncClient,
            "get",
            new_callable=AsyncMock,
            side_effect=httpx.TimeoutException("timeout"),
        ):
            with pytest.raises(UrlExtractionError, match="timed out"):
                await extractor.extract("https://example.com")

    @pytest.mark.asyncio
    async def test_raises_on_network_error(self):
        extractor = UrlContentExtractor()

        with patch.object(
            httpx.AsyncClient,
            "get",
            new_callable=AsyncMock,
            side_effect=httpx.ConnectError("refused"),
        ):
            with pytest.raises(UrlExtractionError, match="Failed to fetch"):
                await extractor.extract("https://example.com")
