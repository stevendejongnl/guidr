"""URL content extraction for guide generation."""

import logging
import re

import httpx


class UrlContentExtractor:
    """Extracts text content from URLs for AI processing."""

    MAX_CONTENT_LENGTH = 10_000

    def __init__(self):
        self._logger = logging.getLogger(__name__)

    async def extract(self, url: str) -> str:
        """Fetch URL and extract text content.

        Args:
            url: URL to fetch

        Returns:
            Extracted text content (truncated to limit)

        Raises:
            UrlExtractionError: If fetching or parsing fails
        """
        try:
            async with httpx.AsyncClient(
                follow_redirects=True, timeout=15.0
            ) as client:
                response = await client.get(url)

                if response.status_code != 200:
                    raise UrlExtractionError(
                        f"URL returned status {response.status_code}"
                    )

                content_type = response.headers.get(
                    "content-type", ""
                )
                if "text/html" not in content_type and "text/plain" not in content_type:
                    raise UrlExtractionError(
                        f"Unsupported content type: {content_type}"
                    )

                text = self._strip_html(response.text)
                return text[: self.MAX_CONTENT_LENGTH]

        except httpx.TimeoutException as e:
            raise UrlExtractionError(
                "URL request timed out"
            ) from e
        except httpx.RequestError as e:
            raise UrlExtractionError(
                f"Failed to fetch URL: {e}"
            ) from e

    @staticmethod
    def _strip_html(html: str) -> str:
        """Strip HTML tags and normalize whitespace."""
        # Remove script and style blocks
        text = re.sub(
            r"<(script|style)[^>]*>.*?</\1>",
            "",
            html,
            flags=re.DOTALL | re.IGNORECASE,
        )
        # Remove HTML tags
        text = re.sub(r"<[^>]+>", " ", text)
        # Decode common entities
        text = (
            text.replace("&amp;", "&")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
            .replace("&nbsp;", " ")
            .replace("&quot;", '"')
        )
        # Normalize whitespace
        text = re.sub(r"\s+", " ", text).strip()
        return text


class UrlExtractionError(Exception):
    """Raised when URL content extraction fails."""

    pass
