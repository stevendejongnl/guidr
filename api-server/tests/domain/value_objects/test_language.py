"""Tests for Language value object."""

import pytest

from src.domain.value_objects.language import DEFAULT_LANGUAGE, Language


class TestLanguage:
    """Test suite for Language value object."""

    def test_creates_valid_language(self) -> None:
        """Test creating a language with a valid ISO 639-1 code."""
        lang = Language("en")
        assert lang.value == "en"

    def test_creates_dutch_language(self) -> None:
        """Test creating a Dutch language code."""
        lang = Language("nl")
        assert lang.value == "nl"

    def test_rejects_invalid_code(self) -> None:
        """Test that invalid codes raise ValueError."""
        with pytest.raises(ValueError, match="Invalid language code: xx"):
            Language("xx")

    def test_rejects_empty_code(self) -> None:
        """Test that empty string raises ValueError."""
        with pytest.raises(ValueError, match="Invalid language code: "):
            Language("")

    def test_rejects_three_letter_code(self) -> None:
        """Test that three-letter codes are rejected."""
        with pytest.raises(ValueError, match="Invalid language code"):
            Language("eng")

    def test_equality(self) -> None:
        """Test that two Languages with the same code are equal."""
        assert Language("en") == Language("en")

    def test_inequality(self) -> None:
        """Test that two Languages with different codes are not equal."""
        assert Language("en") != Language("nl")

    def test_equality_with_non_language(self) -> None:
        """Test that Language is not equal to non-Language objects."""
        assert Language("en") != "en"

    def test_hash_same_code(self) -> None:
        """Test that same codes produce same hash."""
        assert hash(Language("en")) == hash(Language("en"))

    def test_hash_different_code(self) -> None:
        """Test that different codes produce different hashes."""
        assert hash(Language("en")) != hash(Language("nl"))

    def test_usable_in_set(self) -> None:
        """Test that Language can be used in sets."""
        langs = {Language("en"), Language("nl"), Language("en")}
        assert len(langs) == 2

    def test_repr(self) -> None:
        """Test repr output."""
        assert repr(Language("en")) == "Language('en')"

    def test_default_language_is_english(self) -> None:
        """Test that DEFAULT_LANGUAGE is English."""
        assert DEFAULT_LANGUAGE.value == "en"

    def test_all_common_languages_valid(self) -> None:
        """Test that common ISO 639-1 codes are accepted."""
        common = ["en", "nl", "de", "fr", "es", "it", "pt", "ja", "ko", "zh"]
        for code in common:
            lang = Language(code)
            assert lang.value == code

    def test_valid_codes_is_nonempty(self) -> None:
        """Test that the valid codes set is populated."""
        assert len(Language.VALID_CODES) > 100
