"""Language value object for ISO 639-1 language codes."""

from typing import ClassVar


class Language:
    """Value object representing a validated ISO 639-1 language code."""

    VALID_CODES: ClassVar[set[str]] = {
        "aa", "ab", "af", "ak", "am", "an", "ar", "as", "av", "ay",
        "az", "ba", "be", "bg", "bh", "bi", "bm", "bn", "bo", "br",
        "bs", "ca", "ce", "ch", "co", "cr", "cs", "cu", "cv", "cy",
        "da", "de", "dv", "dz", "ee", "el", "en", "eo", "es", "et",
        "eu", "fa", "ff", "fi", "fj", "fo", "fr", "fy", "ga", "gd",
        "gl", "gn", "gu", "gv", "ha", "he", "hi", "ho", "hr", "ht",
        "hu", "hy", "hz", "ia", "id", "ie", "ig", "ii", "ik", "io",
        "is", "it", "iu", "ja", "jv", "ka", "kg", "ki", "kj", "kk",
        "kl", "km", "kn", "ko", "kr", "ks", "ku", "kv", "kw", "ky",
        "la", "lb", "lg", "li", "ln", "lo", "lt", "lu", "lv", "mg",
        "mh", "mi", "mk", "ml", "mn", "mr", "ms", "mt", "my", "na",
        "nb", "nd", "ne", "ng", "nl", "nn", "no", "nr", "nv", "ny",
        "oc", "oj", "om", "or", "os", "pa", "pi", "pl", "ps", "pt",
        "qu", "rm", "rn", "ro", "ru", "rw", "sa", "sc", "sd", "se",
        "sg", "si", "sk", "sl", "sm", "sn", "so", "sq", "sr", "ss",
        "st", "su", "sv", "sw", "ta", "te", "tg", "th", "ti", "tk",
        "tl", "tn", "to", "tr", "ts", "tt", "tw", "ty", "ug", "uk",
        "ur", "uz", "ve", "vi", "vo", "wa", "wo", "xh", "yi", "yo",
        "za", "zh", "zu",
    }

    def __init__(self, code: str) -> None:
        if code not in self.VALID_CODES:
            raise ValueError(f"Invalid language code: {code}")
        self._code = code

    @property
    def value(self) -> str:
        return self._code

    def __eq__(self, other: object) -> bool:
        if isinstance(other, Language):
            return self._code == other._code
        return NotImplemented

    def __hash__(self) -> int:
        return hash(self._code)

    def __repr__(self) -> str:
        return f"Language('{self._code}')"


DEFAULT_LANGUAGE = Language("en")
