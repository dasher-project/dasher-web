// (c) 2025 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

/*
Language Manager for Dasher

Manages language selection and provides alphabet and lexicon data for each language.
*/

// Supported languages with their metadata
const supportedLanguages = [
{code: 'en', name: 'English', speechCode: 'en-US', script: 'Latin', rtl: false},
{code: 'af', name: 'Afrikaans', speechCode: 'af-ZA', script: 'Latin', rtl: false},
{code: 'sq', name: 'Albanian', speechCode: 'sq-AL', script: 'Latin', rtl: false},
{code: 'am', name: 'Amharic', speechCode: 'am-ET', script: 'Ethiopic', rtl: false},
{code: 'ar', name: 'Arabic', speechCode: 'ar-SA', script: 'Arabic', rtl: true},
{code: 'as', name: 'Assamese', speechCode: 'as-IN', script: 'Bengali', rtl: false},
{code: 'eu', name: 'Basque', speechCode: 'eu-ES', script: 'Latin', rtl: false},
{code: 'bn', name: 'Bengali', speechCode: 'bn-BD', script: 'Bengali', rtl: false},
{code: 'bs', name: 'Bosnian', speechCode: 'bs-BA', script: 'Latin', rtl: false},
{code: 'br', name: 'Breton', speechCode: 'br-FR', script: 'Latin', rtl: false},
{code: 'bg', name: 'Bulgarian', speechCode: 'bg-BG', script: 'Cyrillic', rtl: false},
{code: 'my', name: 'Burmese', speechCode: 'my-MM', script: 'Myanmar', rtl: false},
{code: 'ca', name: 'Catalan', speechCode: 'ca-ES', script: 'Latin', rtl: false},
{code: 'chr', name: 'Cherokee', speechCode: 'chr-US', script: 'Cherokee', rtl: false},
{code: 'zh', name: 'Chinese (Simplified)', speechCode: 'zh-CN', script: 'Han', rtl: false},
{code: 'co', name: 'Corsican', speechCode: 'co-FR', script: 'Latin', rtl: false},
{code: 'hr', name: 'Croatian', speechCode: 'hr-HR', script: 'Latin', rtl: false},
{code: 'cs', name: 'Czech', speechCode: 'cs-CZ', script: 'Latin', rtl: false},
{code: 'da', name: 'Danish', speechCode: 'da-DK', script: 'Latin', rtl: false},
{code: 'nl', name: 'Dutch', speechCode: 'nl-NL', script: 'Latin', rtl: false},
{code: 'eo', name: 'Esperanto', speechCode: 'eo', script: 'Latin', rtl: false},
{code: 'et', name: 'Estonian', speechCode: 'et-EE', script: 'Latin', rtl: false},
{code: 'ee', name: 'Ewe', speechCode: 'ee-GH', script: 'Latin', rtl: false},
{code: 'fo', name: 'Faroese', speechCode: 'fo-FO', script: 'Latin', rtl: false},
{code: 'fi', name: 'Finnish', speechCode: 'fi-FI', script: 'Latin', rtl: false},
{code: 'fr', name: 'French', speechCode: 'fr-FR', script: 'Latin', rtl: false},
{code: 'gl', name: 'Galician', speechCode: 'gl-ES', script: 'Latin', rtl: false},
{code: 'ka', name: 'Georgian', speechCode: 'ka-GE', script: 'Georgian', rtl: false},
{code: 'de', name: 'German', speechCode: 'de-DE', script: 'Latin', rtl: false},
{code: 'el', name: 'Greek', speechCode: 'el-GR', script: 'Greek', rtl: false},
{code: 'gu', name: 'Gujarati', speechCode: 'gu-IN', script: 'Gujarati', rtl: false},
{code: 'ha', name: 'Hausa', speechCode: 'ha-NG', script: 'Latin', rtl: false},
{code: 'haw', name: 'Hawaiian', speechCode: 'haw-US', script: 'Latin', rtl: false},
{code: 'he', name: 'Hebrew', speechCode: 'he-IL', script: 'Hebrew', rtl: true},
{code: 'hi', name: 'Hindi', speechCode: 'hi-IN', script: 'Devanagari', rtl: false},
{code: 'hu', name: 'Hungarian', speechCode: 'hu-HU', script: 'Latin', rtl: false},
{code: 'is', name: 'Icelandic', speechCode: 'is-IS', script: 'Latin', rtl: false},
{code: 'ig', name: 'Igbo', speechCode: 'ig-NG', script: 'Latin', rtl: false},
{code: 'id', name: 'Indonesian', speechCode: 'id-ID', script: 'Latin', rtl: false},
{code: 'ga', name: 'Irish', speechCode: 'ga-IE', script: 'Latin', rtl: false},
{code: 'it', name: 'Italian', speechCode: 'it-IT', script: 'Latin', rtl: false},
{code: 'ja', name: 'Japanese', speechCode: 'ja-JP', script: 'Japanese', rtl: false},
{code: 'kn', name: 'Kannada', speechCode: 'kn-IN', script: 'Kannada', rtl: false},
{code: 'kk', name: 'Kazakh', speechCode: 'kk-KZ', script: 'Cyrillic', rtl: false},
{code: 'rn', name: 'Kirundi', speechCode: 'rn-BI', script: 'Latin', rtl: false},
{code: 'ko', name: 'Korean', speechCode: 'ko-KR', script: 'Hangul', rtl: false},
{code: 'ky', name: 'Kyrgyz', speechCode: 'ky-KG', script: 'Cyrillic', rtl: false},
{code: 'lo', name: 'Lao', speechCode: 'lo-LA', script: 'Lao', rtl: false},
{code: 'la', name: 'Latin', speechCode: 'la', script: 'Latin', rtl: false},
{code: 'lt', name: 'Lithuanian', speechCode: 'lt-LT', script: 'Latin', rtl: false},
{code: 'mk', name: 'Macedonian', speechCode: 'mk-MK', script: 'Cyrillic', rtl: false},
{code: 'mt', name: 'Maltese', speechCode: 'mt-MT', script: 'Latin', rtl: false},
{code: 'mn', name: 'Mongolian', speechCode: 'mn-MN', script: 'Cyrillic', rtl: false},
{code: 'no', name: 'Norwegian', speechCode: 'no-NO', script: 'Latin', rtl: false},
{code: 'oc', name: 'Occitan', speechCode: 'oc-FR', script: 'Latin', rtl: false},
{code: 'fa', name: 'Persian', speechCode: 'fa-IR', script: 'Arabic', rtl: true},
{code: 'pl', name: 'Polish', speechCode: 'pl-PL', script: 'Latin', rtl: false},
{code: 'pt', name: 'Portuguese', speechCode: 'pt-PT', script: 'Latin', rtl: false},
{code: 'pa', name: 'Punjabi', speechCode: 'pa-IN', script: 'Gurmukhi', rtl: false},
{code: 'ro', name: 'Romanian', speechCode: 'ro-RO', script: 'Latin', rtl: false},
{code: 'ru', name: 'Russian', speechCode: 'ru-RU', script: 'Cyrillic', rtl: false},
{code: 'gd', name: 'Scottish Gaelic', speechCode: 'gd-GB', script: 'Latin', rtl: false},
{code: 'sr', name: 'Serbian', speechCode: 'sr-RS', script: 'Cyrillic', rtl: false},
{code: 'st', name: 'Sesotho', speechCode: 'st-ZA', script: 'Latin', rtl: false},
{code: 'si', name: 'Sinhala', speechCode: 'si-LK', script: 'Sinhala', rtl: false},
{code: 'sk', name: 'Slovak', speechCode: 'sk-SK', script: 'Latin', rtl: false},
{code: 'sl', name: 'Slovenian', speechCode: 'sl-SI', script: 'Latin', rtl: false},
{code: 'so', name: 'Somali', speechCode: 'so-SO', script: 'Latin', rtl: false},
{code: 'es', name: 'Spanish', speechCode: 'es-ES', script: 'Latin', rtl: false},
{code: 'sw', name: 'Swahili', speechCode: 'sw-KE', script: 'Latin', rtl: false},
{code: 'ss', name: 'Swati', speechCode: 'ss-ZA', script: 'Latin', rtl: false},
{code: 'sv', name: 'Swedish', speechCode: 'sv-SE', script: 'Latin', rtl: false},
{code: 'tl', name: 'Tagalog', speechCode: 'tl-PH', script: 'Latin', rtl: false},
{code: 'tg', name: 'Tajik', speechCode: 'tg-TJ', script: 'Cyrillic', rtl: false},
{code: 'ta', name: 'Tamil', speechCode: 'ta-IN', script: 'Tamil', rtl: false},
{code: 'te', name: 'Telugu', speechCode: 'te-IN', script: 'Telugu', rtl: false},
{code: 'th', name: 'Thai', speechCode: 'th-TH', script: 'Thai', rtl: false},
{code: 'ti', name: 'Tigrinya', speechCode: 'ti-ET', script: 'Ethiopic', rtl: false},
{code: 'ts', name: 'Tsonga', speechCode: 'ts-ZA', script: 'Latin', rtl: false},
{code: 'tn', name: 'Tswana', speechCode: 'tn-ZA', script: 'Latin', rtl: false},
{code: 'tr', name: 'Turkish', speechCode: 'tr-TR', script: 'Latin', rtl: false},
{code: 'tk', name: 'Turkmen', speechCode: 'tk-TM', script: 'Latin', rtl: false},
{code: 'uk', name: 'Ukrainian', speechCode: 'uk-UA', script: 'Cyrillic', rtl: false},
{code: 'ur', name: 'Urdu', speechCode: 'ur-PK', script: 'Arabic', rtl: true},
{code: 'uz', name: 'Uzbek', speechCode: 'uz-UZ', script: 'Latin', rtl: false},
{code: 'vi', name: 'Vietnamese', speechCode: 'vi-VN', script: 'Latin', rtl: false},
{code: 'cy', name: 'Welsh', speechCode: 'cy-GB', script: 'Latin', rtl: false},
{code: 'xh', name: 'Xhosa', speechCode: 'xh-ZA', script: 'Latin', rtl: false},
{code: 'yo', name: 'Yoruba', speechCode: 'yo-NG', script: 'Latin', rtl: false},
{code: 'zu', name: 'Zulu', speechCode: 'zu-ZA', script: 'Latin', rtl: false},
];

// Collect assigned letter code points in [start, end]. Unassigned slots
// (which would render as tofu) and combining marks fall through; extras are
// appended verbatim.
const assignedLetters = (start, end, extras = []) => {
  const points = [];
  for (let cp = start; cp <= end; cp++) {
    if (/\p{L}/u.test(String.fromCodePoint(cp))) {
      points.push(cp);
    }
  }
  return points.concat(extras);
};

// Character ranges for each language
const languageAlphabets = {
  'en': {
    lowercase: {start: 0x61, end: 0x7A}, // a-z
    uppercase: {start: 0x41, end: 0x5A}, // A-Z
  },
  'es': {
    lowercase: {start: 0x61, end: 0x7A}, // a-z
    uppercase: {start: 0x41, end: 0x5A}, // A-Z
    accented: [0xE1, 0xE9, 0xED, 0xF3, 0xFA, 0xFC, 0xF1], // á, é, í, ó, ú, ü, ñ
  },
  'fr': {
    lowercase: {start: 0x61, end: 0x7A}, // a-z
    uppercase: {start: 0x41, end: 0x5A}, // A-Z
    accented: [0xE0, 0xE2, 0xE4, 0xE6, 0xE7, 0xE8, 0xEA, 0xEB, 0xEF, 0xEE, 0xF4, 0xF9, 0xFF], // à, â, ä, ç, è, ê, ë, ï, î, ô, ù, ÿ
  },
  'de': {
    lowercase: {start: 0x61, end: 0x7A}, // a-z
    uppercase: {start: 0x41, end: 0x5A}, // A-Z
    accented: [0xE4, 0xF6, 0xFC, 0xDF], // ä, ö, ü, ß
  },
  'it': {
    lowercase: {start: 0x61, end: 0x7A}, // a-z
    uppercase: {start: 0x41, end: 0x5A}, // A-Z
    accented: [0xE0, 0xE8, 0xE9, 0xEC, 0xF2, 0xF9], // à, è, é, ì, ò, ù
  },
  'pt': {
    lowercase: {start: 0x61, end: 0x7A}, // a-z
    uppercase: {start: 0x41, end: 0x5A}, // A-Z
    accented: [0xE0, 0xE1, 0xE2, 0xE3, 0xE7, 0xEA, 0xED, 0xF3, 0xF5], // à, á, â, ã, ç, ê, í, ó, õ
  },
  'nl': {
    lowercase: {start: 0x61, end: 0x7A}, // a-z
    uppercase: {start: 0x41, end: 0x5A}, // A-Z
  },
  'pl': {
    lowercase: {start: 0x61, end: 0x7A}, // a-z
    uppercase: {start: 0x41, end: 0x5A}, // A-Z
    accented: [0x107, 0x118, 0xEA, 0xF3, 0x15B, 0x179, 0x141], // ą, ć, ę, ł, ń, ś, ź
  },
  'ru': {
    // Russian is Cyrillic script
    lowercase: {start: 0x0430, end: 0x044F}, // а-я
    uppercase: {start: 0x0410, end: 0x042F}, // А-Я
  },
  'zh': {
    // Chinese - common simplified characters
    characters: [
      0x4E00, 0x4E01, 0x4E02, 0x4E03, 0x4E04, 0x4E05, 0x4E06, 0x4E07,
      0x4E08, 0x4E09, 0x4E0A, 0x4E0B, 0x4E0C, 0x4E0D, 0x4E0E, 0x4E0F,
      0x4E10, 0x4E11, 0x4E12, 0x4E13, 0x4E14, 0x4E15, 0x4E16, 0x4E17,
      0x4E18, 0x4E19, 0x4E1A, 0x4E1B, 0x4E1C, 0x4E1D, 0x4E1E, 0x4E1F,
      0x4E20, 0x4E21, 0x4E22, 0x4E23, 0x4E24, 0x4E25, 0x4E26, 0x4E27,
      0x4E28, 0x4E29, 0x4E2A, 0x4E2B, 0x4E2C, 0x4E2D, 0x4E2E, 0x4E2F,
      // Common characters: 我 你 的 是 人 在 他 有 这 (不 0x4E0D already
      // appears in the sequential range above, so it's not repeated here)
      0x6211, 0x4F60, 0x7684, 0x662F, 0x4EBA, 0x5728, 0x4ED6, 0x6709, 0x8FD9,
    ],
  },
  'ja': {
    // Japanese - hiragana and katakana base letters.
    characters: assignedLetters(0x3041, 0x3096) // ぁ-ゖ
        .concat(assignedLetters(0x30A1, 0x30FA)), // ァ-ヺ
  },
  'ko': {
    // Korean - Hangul compatibility jamo (ㄱ-ㅣ). Korean text is typed by
    // composing jamo; the full syllable block (11,172 glyphs) is far too
    // large for the demo palette.
    characters: assignedLetters(0x3131, 0x3163),
  },
  'sv': {
    lowercase: {start: 0x61, end: 0x7A}, // a-z
    uppercase: {start: 0x41, end: 0x5A}, // A-Z
    accented: [0xE5, 0xE4, 0xF6], // å, ä, ö
  },
  'no': {
    lowercase: {start: 0x61, end: 0x7A}, // a-z
    uppercase: {start: 0x41, end: 0x5A}, // A-Z
    accented: [0xE6, 0xF8], // æ, ø
  },
  'da': {
    lowercase: {start: 0x61, end: 0x7A}, // a-z
    uppercase: {start: 0x41, end: 0x5A}, // A-Z
    accented: [0xE6, 0xF8], // æ, ø
  },
  'fi': {
    lowercase: {start: 0x61, end: 0x7A}, // a-z
    uppercase: {start: 0x41, end: 0x5A}, // A-Z
    accented: [0xE4, 0xF6, 0xE5], // ä, ö, å
  },
  'tr': {
    lowercase: {start: 0x61, end: 0x7A}, // a-z
    uppercase: {start: 0x41, end: 0x5A}, // A-Z
    accented: [0xE7, 0xF6, 0xFC, 0x131, 0x15F], // ç, ö, ü, ğ, ş
  },
  'cs': {
    lowercase: {start: 0x61, end: 0x7A}, // a-z
    uppercase: {start: 0x41, end: 0x5A}, // A-Z
    accented: [0xE1, 0xE9, 0xEC, 0xF9, 0xF2, 0x165, 0x161, 0x17E, 0x017D], // á, é, í, ý, ó, ř, š, č, ň
  },
  'el': {
    // Greek (flat lists skip the unassigned U+03A2 slot)
    characters: assignedLetters(0x391, 0x3A9)
        .concat(assignedLetters(0x3B1, 0x3C9)), // Α-Ω α-ω
  },
  'vi': {
    lowercase: {start: 0x61, end: 0x7A}, // a-z
    uppercase: {start: 0x41, end: 0x5A}, // A-Z
    accented: [0xE0, 0xE1, 0xE2, 0xE3, 0xE8, 0xE9, 0xEA, 0xEC, 0xF2, 0xF3, 0xF4, 0xF5, 0xF9, 0xFA], // à-á
  },
  'id': {
    lowercase: {start: 0x61, end: 0x7A}, // a-z
    uppercase: {start: 0x41, end: 0x5A}, // A-Z
  },
};


// Base letter inventories per script, used when a language has no explicit
// alphabet entry above. Word prediction still falls back to English
// frequencies (see getLexicon).
const scriptAlphabets = {
  'Latin': {
    lowercase: {start: 0x61, end: 0x7A}, // a-z
    uppercase: {start: 0x41, end: 0x5A}, // A-Z
  },
  'Cyrillic': {
    lowercase: {start: 0x430, end: 0x44F}, // а-я
    uppercase: {start: 0x410, end: 0x42F}, // А-Я
    accented: [0x451, 0x401], // ё, Ё
  },
  'Arabic': {
    // Core letters, plus the Persian/Urdu extensions پ چ ژ ک گ ی and the
    // Urdu retroflex series ٹ ڈ ڑ ھ ے. Tatweel (0x640) is a joiner, not a
    // letter, and is excluded.
    characters: assignedLetters(0x621, 0x63A, [
      0x67E, 0x686, 0x698, 0x6A9, 0x6AF, 0x6CC,
      0x679, 0x688, 0x691, 0x6BE, 0x6D2,
    ]).concat(assignedLetters(0x641, 0x64A)),
  },
  'Hebrew': {
    characters: assignedLetters(0x5D0, 0x5EA), // א-ת
  },
  'Devanagari': {
    characters: assignedLetters(0x905, 0x939), // अ-ह
  },
  'Bengali': {
    characters: assignedLetters(0x985, 0x98C) // অ-ঔ
        .concat(assignedLetters(0x993, 0x99F)) // ও-ড় base rows
        .concat(assignedLetters(0x9A1, 0x9A8))
        .concat(assignedLetters(0x9AA, 0x9B0))
        .concat([0x9B2, 0x9B6, 0x9B7, 0x9B8, 0x9B9]), // ল শ ষ স হ
  },
  'Gurmukhi': {
    characters: assignedLetters(0xA05, 0xA0A) // ਅ-ਊ
        .concat([0xA0F, 0xA10, 0xA13, 0xA14]) // ਏ ਐ ਓ ਔ
        .concat(assignedLetters(0xA15, 0xA28))
        .concat(assignedLetters(0xA2A, 0xA30))
        .concat([0xA32, 0xA33, 0xA35, 0xA36, 0xA38, 0xA39]), // ਲ਼ ਸ਼ ਹ
  },
  'Gujarati': {
    characters: assignedLetters(0xA85, 0xA8B) // અ-ઋ
        .concat([0xA8D, 0xA8F, 0xA90]) // ઍ એ ઐ
        .concat(assignedLetters(0xA93, 0xA95)) // ઓ ઔ ક
        .concat(assignedLetters(0xA96, 0xAA8))
        .concat(assignedLetters(0xAAA, 0xAB0))
        .concat([0xAB2, 0xAB3])
        .concat(assignedLetters(0xAB5, 0xAB9)), // ક-હ
  },
  'Tamil': {
    characters: assignedLetters(0xB85, 0xB8A) // அ-ஊ
        .concat([0xB8E, 0xB8F, 0xB92, 0xB93, 0xB94]) // ஏ ஐ ஒ ஓ ஔ
        .concat(assignedLetters(0xB95, 0xB95))
        .concat([0xB99, 0xB9A, 0xB9C, 0xB9E, 0xB9F]) // ங ச ஜ ஞ ட
        .concat(assignedLetters(0xBA3, 0xBA4))
        .concat([0xBA8, 0xBA9, 0xBAA, 0xBAE, 0xBAF, 0xBB0, 0xBB1, 0xBB2, 0xBB3, 0xBB4, 0xBB5])
        .concat(assignedLetters(0xBB7, 0xBB9)), // ற ல ள ழ வ ஷ ஸ ஹ
  },
  'Telugu': {
    characters: assignedLetters(0xC05, 0xC0C) // అ-ఌ
        .concat([0xC0E, 0xC0F, 0xC10, 0xC12, 0xC13, 0xC14]) // ఎ-ఔ
        .concat(assignedLetters(0xC15, 0xC28))
        .concat(assignedLetters(0xC2A, 0xC39)), // య-హ
  },
  'Kannada': {
    characters: assignedLetters(0xC85, 0xC8C) // ಅ-ಌ
        .concat([0xC8E, 0xC8F, 0xC90, 0xC92, 0xC93, 0xC94]) // ಎ-ಔ
        .concat(assignedLetters(0xC95, 0xCA8))
        .concat(assignedLetters(0xCAA, 0xCB3))
        .concat(assignedLetters(0xCB5, 0xCB9)), // ಱ-ಹ
  },
  'Malayalam': {
    characters: assignedLetters(0xD05, 0xD0C) // അ-ഌ
        .concat([0xD0E, 0xD0F, 0xD10, 0xD12, 0xD13, 0xD14]) // എ-ഔ
        .concat(assignedLetters(0xD15, 0xD28))
        .concat(assignedLetters(0xD2A, 0xD39)), // യ-ഹ
  },
  'Sinhala': {
    characters: assignedLetters(0xD85, 0xD96) // අ-ඖ
        .concat(assignedLetters(0xD9A, 0xDB1)) // ක-න
        .concat(assignedLetters(0xDB3, 0xDBB)) // ඳ-ර
        .concat([0xDBD, 0xDC0, 0xDC1, 0xDC2, 0xDC3, 0xDC4, 0xDC5, 0xDC6]), // ල ව-ෆ
  },
  'Thai': {
    characters: assignedLetters(0xE01, 0xE2E), // ก-ฮ
  },
  'Lao': {
    characters: assignedLetters(0xE81, 0xE82) // ກ-ຂ
        .concat([0xE84])
        .concat(assignedLetters(0xE87, 0xE88)) // ງ-ຈ
        .concat([0xE8A, 0xE8D])
        .concat(assignedLetters(0xE94, 0xE97)) // ດ-ທ
        .concat(assignedLetters(0xE99, 0xE9F)) // ນ-ຟ
        .concat([0xEA1, 0xEA2, 0xEA3, 0xEA5, 0xEA7])
        .concat(assignedLetters(0xEAA, 0xEAB))
        .concat([0xEAD, 0xEAE]), // ອ ຮ
  },
  'Georgian': {
    characters: assignedLetters(0x10D0, 0x10FA), // ა-ჺ
  },
  'Ethiopic': {
    characters: assignedLetters(0x1200, 0x1248), // ሀ-ቈ rows
  },
  'Cherokee': {
    characters: assignedLetters(0x13A0, 0x13F4), // Ꭰ-Ᏼ
  },
  'Myanmar': {
    characters: assignedLetters(0x1000, 0x1021), // က-ဏ
  },
};

// Common word lists for prediction (top 50 for each language)
const languageLexicons = {
  'en': [
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
    'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when',
    'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people',
    'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than',
    'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back',
    'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even',
  ],
  'es': [
    'el', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'haber',
    'con', 'su', 'por', 'para', 'como', 'estar', 'tener', 'le', 'lo', 'todo',
    'pero', 'más', 'hacer', 'o', 'año', 'este', 'ir', 'otro', 'ese',
    'tiempo', 'poder', 'ser', 'dice', 'si', 'me', 'ya', 'saber', 'qué',
    'entre', 'cuando', 'muy', 'sin', 'sobre', 'tener', 'él', 'pero', 'estar',
    'un', 'ver', 'con', 'te', 'yo', 'año', 'ir', 'estar', 'todo',
    'dar', 'hacer', 'poder', 'decir', 'ver', 'saber', 'querer', 'llegar',
    'pasar', 'deber', 'tener', 'hacer', 'dejar', 'venir', 'salir', 'o',
  ],
  'fr': [
    'le', 'de', 'un', 'être', 'et', 'à', 'il', 'avoir', 'ne', 'je',
    'son', 'que', 'se', 'qui', 'dans', 'ce', 'pas', 'pouvoir', 'plus',
    'par', 'mot', 'faire', 'tout', 'dire', 'vous', 'on', 'avec', 'comme', 'nous',
    'mais', 'si', 'leur', 'y', 'avoir', 'cela', 'mettre', 'prendre', 'sans', 'nom',
    'homme', 'temps', 'autre', 'donner', 'bien', 'où', 'aussi', 'comme', 'vouloir',
    'très', 'aller', 'nouveau', 'mon', 'que', 'etre', 'si', 'plus', 'faire', 'avec',
    'pas', 'tout', 'il', 'avoir', 'je', 'un', 'nous', 'en', 'vous', 'que', 'et',
  ],
  'de': [
    'der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich',
    'des', 'auf', 'für', 'ist', 'im', 'dem', 'nicht', 'ein', 'eine', 'als',
    'auch', 'es', 'an', 'werden', 'aus', 'er', 'hat', 'dass', 'wir', 'nach',
    'wird', 'um', 'am', 'noch', 'von', 'bei', 'wurde', 'über', 'sie', 'zum',
    'ja', 'nur', 'sein', 'können', 'muss', 'man', 'haben', 'einer', 'mir', 'wurde',
    'ich', 'mein', 'du', 'sein', 'werden', 'dass', 'mit', 'sich', 'wenn', 'nicht',
    'einem', 'es', 'kann', 'vor', 'dieser', 'so', 'durch', 'aus', 'wieder', 'um',
    'oder', 'haben', 'eine', 'mehr', 'ihr', 'unser', 'im', 'sollen', 'sollte', 'aber',
  ],
  'it': [
    'il', 'di', 'che', 'e', 'la', 'un', 'a', 'per', 'in', 'non',
    'essere', 'avere', 'da', 'si', 'con', 'essere', 'le', 'questo', 'più', 'potere',
    'questa', 'fare', 'tutto', 'su', 'per', 'in', 'ma', 'dire', 'da', 'essere',
    'anno', 'cosa', 'dire', 'nella', 'altro', 'essere', 'più', 'potere', 'fare',
    'come', 'essere', 'c', 'la', 'in', 'non', 'per', 'è', 'di', 'che', 'a', 'essere',
    'un', 'avere', 'a', 'in', 'da', 'essere', 'al', 'tra', 'uno', 'con', 'noi', 'fare',
    'potere', 'quello', 'solo', 'tutto', 'avere', 'sua', 'prim', 'essere', 'gli', 'su',
  ],
  'pt': [
    'o', 'de', 'a', 'e', 'do', 'da', 'em', 'um', 'para', 'é',
    'com', 'não', 'os', 'se', 'ser', 'ter', 'está', 'que', 'quem', 'mas',
    'como', 'est', 'uma', 'estar', 'na', 'fazer', 'tempo', 'por', 'muito', 'mais',
    'ir', 'dizer', 'estar', 'saber', 'fazer', 'ver', 'poder', 'pessoa', 'dar',
    'est', 'a', 'em', 'para', 'est', 'não', 'com', 'o', 'e', 'um', 'estar', 'por',
    'ter', 'não', 'estar', 'ser', 'a', 'em', 'o', 'de', 'é', 'estar', 'fazer', 'tem',
    'a', 'mas', 'não', 'estar', 'o', 'est', 'com', 'de', 'não', 'ser', 'para', 'em',
    'estar', 'poder', 'um', 'não', 'como', 'do', 'ao', 'os', 'das', 'pelos', 'à',
  ],
  'nl': [
    'de', 'het', 'van', 'een', 'in', 'en', 'op', 'zijn', 'niet', 'te',
    'dat', 'ze', 'zijn', 'ook', 'al', 'maar', 'mee', 'ze', 'zullen', 'eens',
    'op', 'aan', 'uit', 'door', 'was', 'wil', 'heeft', 'zullen', 'om', 'bij',
    'nog', 'als', 'wat', 'zal', 'hoe', 'over', 'hebben', 'alle', 'met',
    'deze', 'uit', 'naar', 'uit', 'niet', 'uit', 'zullen', 'er', 'hebben',
    'hier', 'wie', 'mensen', 'om', 'uit', 'bij', 'nog', 'naar', 'mij', 'hem',
    'als', 'u', 'op', 'uit', 'van', 'weg', 'om', 'naar', 'eens', 'me',
  ],
  'pl': [
    'nie', 'któ', 'z', 'a', 'nie', 'w', 'i', 'z', 'do', 'na',
    'z', 'taki', 'że', 'a', 'że', 'taki', 'sam', 'dla', 'u', 'je',
    'i', 'a', 'ty', 'po', 'u', 'z', 'taki', 'jeste', 'że', 'my',
    'ale', 'taki', 'sobie', 'a', 'mnie', 'o', 'tylko', 'że', 'jak', 'nie',
    'te', 'mi', 'o', 'z', 'do', 'z', 'jak', 'się', 'to', 'ale', 'z',
    'tylko', 'o', 'taki', 'cię', 'może', 'je', 'już', 'taki', 'ale',
    'chcesz', 'taki', 'je', 'taki', 'sobie', 'tylko', 'że', 'jeszcze',
  ],
  'ru': [
    'и', 'в', 'не', 'на', 'я', 'быть', 'что', 'с', 'как', 'а',
    'же', 'это', 'ты', 'мы', 'по', 'к', 'но', 'вы', 'за', 'из',
    'или', 'уже', 'сказать', 'который', 'когда', 'быть', 'я', 'быть',
    'что', 'ты', 'делать', 'свои', 'к', 'мож', 'вы', 'из', 'ты', 'как',
    'к', 'на', 'какой', 'м', 'где', 'там', 'о', 'к', 'есть', 'его',
    'о', 'из', 'он', 'м', 'г', 'к', 'ей', 'его', 'быть', 'бы', 'у',
    'нас', 'быть', 'они', 'на', 'что', 'а', 'я', 'что', 'т', 'вы',
  ],
  'ar': [
    'في', 'أن', 'من', 'هل', 'هذا', 'إلى', 'هو', 'في', 'على',
    'ما', 'أن', 'هذا', 'هو', 'و', 'كان', 'من', 'هذا', 'أن', 'هذا',
    'أن', 'مع', 'التي', 'على', 'من', 'ك', 'كيف', 'أين', 'متى',
    'ال', 'هذا', 'أن', 'ال', 'لم', 'كن', 'لم', 'لكم', 'كم', 'لماذا',
    'ين', 'كل', 'هذا', 'هو', 'هناك', 'يكون', 'هذا', 'هي',
    'فقط', 'ال', 'أنا', 'هذا', 'هو', 'نحن', 'هذه', 'ال', 'هذا',
  ],
  'zh': [
    '我', '你', '的', '是', '了', '不', '人', '在', '他', '有',
    '我', '在', '他', '这', '说', '她', '我', '你', '他', '我', '来',
    '去', '做', '了', '我', '可', '以', '到', '好', '说', '来', '我',
    '这', '她', '我', '你', '了', '他', '有', '大', '去', '看', '里',
    '你', '我', '我', '去', '我', '去', '和', '好', '的', '我', '这',
    '她', '好', '说', '来', '他', '我', '也', '她', '他', '的', '好',
  ],
  'ja': [
    '私', 'は', 'の', 'を', 'に', 'て', 'で', 'す', 'る', 'な',
    'た', 'て', 'ま', 'す', 'か', 'な', 'が', 'ら', 'で', 'も', 'し',
    'し', 'を', 'さ', 'せる', 'れ', 'て', 'に', 'て', 'て', 'も',
    'る', 'な', 'れ', 'て', 'る', 'な', 'で', 'さ', 'れ', 'と', 'や',
    'て', 'に', 'を', 'る', 'ら', 'な', 'い', 'て', 'て', 'の', 'を',
  ],
  'ko': [
    '나', '는', '의', '가', '에', '다', '를', '은', '할', '수', '있습니다',
    '이', '그', '저', '것', '안', '했', '습니다', '다', '면', '다',
    '저', '것', '생각', '했', '습니다', '을', '게', '하', '였', '습니다',
    '그', '있', '없', '하는', '있', '었', '습니다', '할', '수', '있',
    '그', '있', '있', '니', '그', '것', '어디', '서', '무엇', '일이',
  ],
  'hi': [
    'मैं', 'कि', 'यह', 'के', 'लिए', 'और', 'ए', 'में', 'है', 'और',
    'पर', 'थ', 'के', 'लिए', 'यह', 'और', 'कह', 'ता', 'में', 'यह',
    'मुझे', 'तुम', 'कर', 'का', 'यह', 'बात', 'से', 'मैं', 'मुझे', 'सभी',
    'तुम्हें', 'तुम', 'है', 'क्या', 'है', 'ए', 'का', 'यह', 'और',
    'यह', 'और', 'चाहिए', 'तुम', 'क्या', 'है', 'इच्छित', 'मेरे', 'साथ', 'में', 'है',
  ],
  'sv': [
    'och', 'det', 'är', 'jag', 'en', 'i', 'kan', 'du', 'inte', 'som',
    'är', 'sig', 'inte', 'min', 'med', 'du', 'är', 'hon', 'här', 'ska',
    'har', 'alla', 'också', 'inte', 'för', 'upp', 'att', 'om', 'igen',
    'mig', 'sin', 'från', 'var', 'vad', 'kan', 'nu', 'ännu', 'mer',
    'också', 'åt', 'komma', 'gera', 'kvar', 'ännu', 'du', 'också',
  ],
  'no': [
    'jeg', 'er', 'det', 'ikke', 'en', 'til', 'på', 'og', 'i', 'vi',
    'ikke', 'du', 'jeg', 'ha', 'kan', 'ikke', 'var', 'vi', 'har', 'vi',
    'meg', 'som', 'med', 'ikke', 'dette', 'en', 'til', 'ikke', 'du',
    'så', 'kan', 'de', 'er', 'ikke', 'ikke', 'å', 'andre', 'også',
    'kun', 'kan', 'når', 'som', 'ikke', 'en', 'til',
  ],
  'da': [
    'jeg', 'er', 'det', 'ikke', 'en', 'til', 'på', 'og', 'i', 'vi',
    'ikke', 'du', 'jeg', 'har', 'kan', 'ikke', 'var', 'vi', 'har', 'vi',
    'mig', 'som', 'med', 'ikke', 'dette', 'en', 'til', 'ikke', 'du',
    'så', 'kan', 'de', 'er', 'ikke', 'ikke', 'å', 'andre', 'også',
  ],
  'fi': [
    'minä', 'on', 'se', 'ja', 'olen', 'minä', 'ett', 'kun', 'ja', 'sinä',
    'minä', 'tänneen', 'mutta', 'minua', 'minä', 'kun', 'siniä', 'minä',
    'minä', 'minua', 'minä', 'minä', 'ovat', 'minun', 'sinä', 'minä',
    'minä', 'minun', 'sinä', 'voi', 'ovat', 'minulle', 'ja', 'voi',
    'en', 'olla', 'minä', 'on', 'minä', 'ole', 'minun', 'minä',
  ],
  'tr': [
    'bir', 've', 'bu', 'de', 'için', 'bir', 'bir', 'için', 'de',
    've', 'bu', 'için', 'bu', 'de', 'için', 'için', 'ben', 'de',
    've', 'için', 'bu', 'de', 'bir', 'için', 'olur', 'bazı', 'bu',
    'olsun', 'bir', 'de', 'için', 'için', 've', 'bu', 'kadar', 'olur',
    've', 'mi', 'için', 'de', 'evet', 'ben', 'bir', 'var', 'yok',
  ],
  'cs': [
    'je', 'to', 'a', 'také', 'jsem', 'ne', 'se', 've', 'svůj', 'jeho',
    'proč', 'toho', 'je', 'abych', 'jsem', 'ze', 'toto', 'nemáme', 'jest',
    'jen', 'mít', 'a', 'mít', 'tady', 'tam', 'taky', 'jako', 'co',
    'jó', 'to', 'budeme', 'mít', 'se', 'tu', 'kdy', 'byl', 'byla',
    'mít', 'ho', 'můžes', 'mi', 'se', 'ty', 'proč', 'proto', 'proto',
  ],
  'el': [
    'είμαι', 'είμαι', 'είναι', 'είσαι', 'είναι', 'είμαι', 'είμαι', 'είναι', 'είμαι',
    'είμαι', 'είναι', 'είμαι', 'είμαι', 'είμαι', 'είμαι', 'είμαι',
    'είμαι', 'είναι', 'είμαι', 'είμαι', 'είμαι', 'είμαι', 'είναι',
    'είμαι', 'είναι', 'είμαι', 'είμαι', 'είμαι', 'είμαι', 'είναι',
  ],
  'he': [
    'אני', 'אתה', 'של', 'ל', 'כל', 'ב', 'ל', 'מ', 'ש', 'ל',
    'ב', 'ל', 'ה', 'כ', 'ש', 'ש', 'ל', 'ב', 'כ', 'ל', 'כ', 'ל', 'ל', 'כ',
    'ב', 'ב', 'ה', 'ה', 'ב', 'ב', 'כ', 'ל', 'כ', 'ל', 'ה', 'כ', 'ש',
    'ב', 'ה', 'כ', 'ב', 'ב', 'ל', 'ל', 'א', 'ם', 'ל', 'אית', 'איך',
    'םל', 'של', 'אית', 'ב', 'ל', 'ות', 'אית', 'ב', 'א', 'ל', 'ה',
  ],
  'th': [
    'ผม', 'แล้ว', 'กับ', 'ที่', 'มา', 'ก็', 'ใน', 'ไม่', 'ให้', 'กับ',
    'ที่', 'มี', 'ของ', 'ผม', 'แล้ว', 'กับ', 'ที่', 'มา', 'ก็',
    'มา', 'ก็', 'ให้', 'กับ', 'ที่', 'มี', 'ผม', 'แล้ว', 'กับ',
    'ที่', 'มา', 'ของ', 'ได้้มา', 'ก็', 'ให้', 'กับ', 'ที่', 'มี',
    'ใน', 'ไม่', 'ให้', 'กับ', 'ที่', 'มา', 'ก็',
  ],
  'vi': [
    'tôi', 'là', 'đây', 'cho', 'có', 'và', 'đi', 'là', 'nhưng', 'là',
    'với', 'thì', 'có', 'là', 'đi', 'tôi', 'đó', 'đây', 'nhưng', 'một',
    'người', 'nào', 'có', 'thể', 'là', 'với', 'tôi', 'đi', 'là', 'được',
    'tôi', 'cho', 'biết', 'nhưng', 'là', 'tôi', 'muốn', 'biết', 'như',
    'thì', 'thì', 'có', 'thể', 'là', 'với', 'ta', 'đi', 'là',
  ],
  'id': [
    'saya', 'adalah', 'di', 'ke', 'dan', 'dalam', 'itu', 'ada', 'dengan',
    'saya', 'ke', 'untuk', 'di', 'ada', 'itu', 'dengan', 'saya', 'di',
    'yang', 'ingin', 'ada', 'itu', 'dengan', 'saya', 'di', 'ada',
    'itu', 'itu', 'di', 'saya', 'ingin', 'dengan', 'saya', 'ke',
    'akan', 'yang', 'di', 'itu', 'dengan', 'saya', 'di', 'itu', 'di',
  ],
};

let currentLanguage = supportedLanguages[0]; // Default to English
let languageChangeCallback = null;

/**
 * Get all supported languages
 */
export function getSupportedLanguages() {
  return supportedLanguages;
}

/**
 * Get the current language
 */
export function getCurrentLanguage() {
  return currentLanguage;
}

/**
 * Set the current language and notify listeners
 */
export async function setCurrentLanguage(languageCode) {
  const lang = supportedLanguages.find((l) => l.code === languageCode);
  if (!lang) {
    console.warn(`Language ${languageCode} not found, using current language`);
    return;
  }

  currentLanguage = lang;
  console.log(`Language changed to: ${lang.name} (${lang.code})`);

  // Notify callback if set
  if (languageChangeCallback) {
    await languageChangeCallback(lang);
  }
}

/**
 * Set a callback to be called when language changes
 */
export function onLanguageChange(callback) {
  languageChangeCallback = callback;
}

/**
 * Get alphabet for a language (lowercase and uppercase ranges or specific characters)
 */
export function getAlphabet(languageCode) {
  // Check for exact match first
  if (languageAlphabets[languageCode]) {
    return languageAlphabets[languageCode];
  }

  // Try base language code (e.g., 'pt' for 'pt-BR')
  const baseCode = languageCode.split('-')[0];
  if (languageAlphabets[baseCode]) {
    return languageAlphabets[baseCode];
  }

  // Fall back to the language's script inventory (every entry in
  // supportedLanguages carries a `script` name).
  const lang = supportedLanguages.find((l) => l.code === baseCode);
  if (lang && scriptAlphabets[lang.script]) {
    return scriptAlphabets[lang.script];
  }

  // Fall back to English alphabet
  return languageAlphabets['en'];
}

/**
 * Get lexicon for a language
 */
export async function getLexicon(languageCode, topN = 5000) {
  // Check for exact match first
  if (languageLexicons[languageCode]) {
    return languageLexicons[languageCode];
  }

  // Try base language code (e.g., 'pt' for 'pt-BR')
  const baseCode = languageCode.split('-')[0];
  if (languageLexicons[baseCode]) {
    return languageLexicons[baseCode];
  }

  // Fall back to English if language not available
  console.warn(`No lexicon available for ${languageCode}, using English`);
  return languageLexicons['en'] || [];
}

/**
 * Get speech/voice code for current language
 */
export function getSpeechCode() {
  return currentLanguage.speechCode;
}

/**
 * Get available speech/voice codes
 */
export function getSpeechCodes() {
  return supportedLanguages.map((lang) => lang.speechCode);
}

/**
 * Find a voice that matches the current language
 */
export function findMatchingVoice(voices) {
  if (!voices || voices.length === 0) {
    return null;
  }

  const targetLang = currentLanguage.speechCode;

  // First try exact match
  let match = voices.find((voice) => voice.lang === targetLang);
  if (match) {
    return match;
  }

  // Try matching language code without region
  const langPrefix = targetLang.split('-')[0];
  match = voices.find((voice) => voice.lang.startsWith(langPrefix));
  if (match) {
    return match;
  }

  // Fallback to first available voice
  return voices[0];
}

/**
 * Get language name from code
 */
export function getLanguageName(languageCode) {
  const lang = supportedLanguages.find((l) => l.code === languageCode);
  return lang ? lang.name : languageCode;
}

/**
 * Initialize language manager
 */
export async function initialize() {
  console.log(`Language Manager initialized with ${supportedLanguages.length} languages`);
}

// Auto-initialize on module load
initialize().catch(console.error);

export default {
  getSupportedLanguages,
  getCurrentLanguage,
  setCurrentLanguage,
  onLanguageChange,
  getAlphabet,
  getLexicon,
  getSpeechCode,
  getSpeechCodes,
  findMatchingVoice,
  getLanguageName,
  initialize,
};
