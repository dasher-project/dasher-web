# Changelog

## v0.2.7 (2026-08-31)

- GTK-parity chrome: output-pane Layout picker (right/left/bottom/top)
  replaces the Position button; Play/Pause folded into Game mode
- Footer rebuilt to the GTK layout: speed stepper on the v5 scale
  (range/step from the engine manifest), Learning, Speech
  (speak-on-stop), and the WPM readout packed at the end — always
  visible, default on (RFC 0012)
- Settings dialog tabbed per RFC 0006 (Input / Language / Output /
  Customization / Game Mode + Privacy)

## v0.2.6 (2026-08-31)

- Game mode wired up (RFC 0004): target-phrase overlay, typed-prefix
  highlighting, progress and live WPM; wrapper's enterGameMode()
  return semantics fixed (CAPI returns 0 on success)
- Typing rate (RFC 0012): dasher_get_wpm/cps exported and wrapped;
  opt-in toolbar chip (now the footer readout in v0.2.7)
- Version row in Settings → Privacy from staged BUILD metadata
  (RFC 0016)
- Dark palettes (RFC 0007): the eight DasherCore dark companions plus
  a new Web Demo Dark; theme choices remembered per colour scheme and
  follow the OS

## v0.2.5 (2026-08-31)

- Design-guide chrome: 64px top toolbar (New/Open/Save/Game/Layout/
  Prefs, Lucide icons inlined), 48px status bar, editor pane with
  clipboard actions and Quick Speak, brand tokens light+dark
- Web Demo palette: group containers transparent, sibling colours
  alternate — letter boxes render as complete boxes

## v0.2.4 (2026-08-31)

- Settings dialog generated from the CAPI settings manifest (99
  parameters, grouped, advanced collapsed), pulling through all 14
  input filters
- Locale picker: 33 locales from dasher-shared-resources'
  ui-strings.json

## v0.2.3 (2026-08-31)

- Pure-JS demo retired from main (preserved on the legacy-js-demo tag;
  README documents where to find Jim Hawkins' original work). Root
  package reduced to metadata — the dependency-bump noise is gone
- Enhanced playground at /js-demo/: theme picker, node shapes,
  searchable 475-alphabet picker with lazy loading from a static
  catalogue

## v0.2.2 (2026-08-31)

- Letter boxes render as complete boxes (Web Demo palette fixes the
  legacy group-container white-out)
- Wrapper: get/setLongParameter and get/setStringParameter exposed
- Pure-JS demo sources restored after the WASM-merge deletion

## v0.2.1 (2026-08-30)

- DasherCore submodule bumped 58 stale commits to v0.2.16 (lazy
  alphabet loading, colour normalisation, 56 Tatoeba training corpora,
  UTF-8 crash fix, input-filter persistence fix)
- Data bundle expanded 4 → 10 trained languages
- Release workflow: v* tags build and attach a self-contained
  dasher-wasm-demo zip for consumers to pin (dasher.at uses this)

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
