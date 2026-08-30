# Changelog

## v0.2.0 (2026-08-30)

- Language selector expanded from 27 to 90 languages, matching the languages
  with real training data in DasherCore v0.2.14+ (Tatoeba CC-BY corpora via
  WorldAlphabets); Chinese (Simplified) and Hindi retained from v0.1.0
- Languages without an explicit alphabet definition now get a base letter
  inventory generated from their script (Cyrillic, Arabic, Hebrew,
  Devanagari, Bengali, Gurmukhi, Gujarati, Tamil, Telugu, Kannada,
  Malayalam, Sinhala, Thai, Lao, Georgian, Ethiopic, Cherokee, Myanmar),
  filtered to assigned letters; Korean provides Hangul jamo, Japanese
  provides kana
- Word prediction falls back to English frequencies for languages without a
  bundled word list — the palette shows the correct script either way
- Entries carry script name and RTL metadata; list sorted alphabetically
  with English as the default
- Saved language preferences migrate across list changes (v0.1.0's
  'English (UK)'/'Portuguese (Brazil)' map to 'English'/'Portuguese'
  instead of a stale index)
- Banner linking to the Dasher v6 alphabet catalogue (474 alphabets, 456
  languages) and the app downloads page; dismissible
- Version bumped to 0.2.0 to align with DasherCore v0.2.x

## v0.1.0

- Initial public release of the Dasher Six web demo
- Pure JS implementation (PPM predictor, no WASM required)
- 27 languages in the selector (25 with bundled alphabets and lexicons)
- Mobile-safe stacking
