// (c) 2025 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

/*
Language Manager for Dasher

Manages language selection and provides alphabet and lexicon data for each language.
*/

// Supported languages with their metadata
const supportedLanguages = [
  { code: 'en', name: 'English', speechCode: 'en-US', region: 'US' },
  { code: 'en-GB', name: 'English (UK)', speechCode: 'en-GB', region: 'GB' },
  { code: 'es', name: 'Spanish', speechCode: 'es-ES', region: 'ES' },
  { code: 'fr', name: 'French', speechCode: 'fr-FR', region: 'FR' },
  { code: 'de', name: 'German', speechCode: 'de-DE', region: 'DE' },
  { code: 'it', name: 'Italian', speechCode: 'it-IT', region: 'IT' },
  { code: 'pt', name: 'Portuguese', speechCode: 'pt-PT', region: 'PT' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', speechCode: 'pt-BR', region: 'BR' },
  { code: 'nl', name: 'Dutch', speechCode: 'nl-NL', region: 'NL' },
  { code: 'pl', name: 'Polish', speechCode: 'pl-PL', region: 'PL' },
  { code: 'ru', name: 'Russian', speechCode: 'ru-RU', region: 'RU' },
  { code: 'ar', name: 'Arabic', speechCode: 'ar-SA', region: 'SA' },
  { code: 'zh', name: 'Chinese (Simplified)', speechCode: 'zh-CN', region: 'CN' },
  { code: 'ja', name: 'Japanese', speechCode: 'ja-JP', region: 'JP' },
  { code: 'ko', name: 'Korean', speechCode: 'ko-KR', region: 'KR' },
  { code: 'hi', name: 'Hindi', speechCode: 'hi-IN', region: 'IN' },
  { code: 'sv', name: 'Swedish', speechCode: 'sv-SE', region: 'SE' },
  { code: 'no', name: 'Norwegian', speechCode: 'no-NO', region: 'NO' },
  { code: 'da', name: 'Danish', speechCode: 'da-DK', region: 'DK' },
  { code: 'fi', name: 'Finnish', speechCode: 'fi-FI', region: 'FI' },
  { code: 'tr', name: 'Turkish', speechCode: 'tr-TR', region: 'TR' },
  { code: 'cs', name: 'Czech', speechCode: 'cs-CZ', region: 'CZ' },
  { code: 'el', name: 'Greek', speechCode: 'el-GR', region: 'GR' },
  { code: 'he', name: 'Hebrew', speechCode: 'he-IL', region: 'IL' },
  { code: 'th', name: 'Thai', speechCode: 'th-TH', region: 'TH' },
  { code: 'vi', name: 'Vietnamese', speechCode: 'vi-VN', region: 'VN' },
  { code: 'id', name: 'Indonesian', speechCode: 'id-ID', region: 'ID' },
];

// Character ranges for each language
const languageAlphabets = {
  'en': {
    lowercase: { start: 0x61, end: 0x7A }, // a-z
    uppercase: { start: 0x41, end: 0x5A }, // A-Z
  },
  'es': {
    lowercase: { start: 0x61, end: 0x7A }, // a-z
    uppercase: { start: 0x41, end: 0x5A }, // A-Z
    accented: [0xE1, 0xE9, 0xED, 0xF3, 0xFA, 0xFC, 0xF1], // á, é, í, ó, ú, ü, ñ
  },
  'fr': {
    lowercase: { start: 0x61, end: 0x7A }, // a-z
    uppercase: { start: 0x41, end: 0x5A }, // A-Z
    accented: [0xE0, 0xE2, 0xE4, 0xE6, 0xE7, 0xE8, 0xEA, 0xEB, 0xEF, 0xEE, 0xF4, 0xF9, 0xFF], // à, â, ä, ç, è, ê, ë, ï, î, ô, ù, ÿ
  },
  'de': {
    lowercase: { start: 0x61, end: 0x7A }, // a-z
    uppercase: { start: 0x41, end: 0x5A }, // A-Z
    accented: [0xE4, 0xF6, 0xFC, 0xDF], // ä, ö, ü, ß
  },
  'it': {
    lowercase: { start: 0x61, end: 0x7A }, // a-z
    uppercase: { start: 0x41, end: 0x5A }, // A-Z
    accented: [0xE0, 0xE8, 0xE9, 0xEC, 0xF2, 0xF9], // à, è, é, ì, ò, ù
  },
  'pt': {
    lowercase: { start: 0x61, end: 0x7A }, // a-z
    uppercase: { start: 0x41, end: 0x5A }, // A-Z
    accented: [0xE0, 0xE1, 0xE2, 0xE3, 0xE7, 0xEA, 0xED, 0xF3, 0xF5], // à, á, â, ã, ç, ê, í, ó, õ
  },
  'nl': {
    lowercase: { start: 0x61, end: 0x7A }, // a-z
    uppercase: { start: 0x41, end: 0x5A }, // A-Z
  },
  'pl': {
    lowercase: { start: 0x61, end: 0x7A }, // a-z
    uppercase: { start: 0x41, end: 0x5A }, // A-Z
    accented: [0x107, 0x118, 0xEA, 0xF3, 0x15B, 0x179, 0x141], // ą, ć, ę, ł, ń, ś, ź
  },
  'ru': {
    // Russian is Cyrillic script
    lowercase: { start: 0x0430, end: 0x044F }, // а-я
    uppercase: { start: 0x0410, end: 0x042F }, // А-Я
  },
  'ar': {
    // Arabic alphabet
    characters: [
      0x0627, 0x0628, 0x062A, 0x062B, 0x062C, 0x062F, 0x0633, 0x0647,
      0x0648, 0x0649, 0x064A, 0x064B, 0x0644, 0x0645, 0x0646, 0x0621,
      0x062E, 0x0631, 0x0634, 0x0635, 0x0636, 0x0637, 0x0638, 0x0639,
      0x063A, 0x0641, 0x642, 0x643, 0x644, 0x645, 0x646, 0x647, 0x648
    ]
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
      // Common characters: 我, 你, 的, 是, 了, 不, 人, 在, 他, 有, 这
      0x6211, 0x4F60, 0x7684, 0x662F, 0x4E0D, 0x4EBA, 0x4EBA, 0x5728, 0x4ED, 0x5728, 0x6709
    ]
  },
  'ja': {
    // Japanese - Hiragana and Katakana
    hiragana: { start: 0x3041, end: 0x309F }, // ぁ-ん
    katakana: { start: 0x30A1, end: 0x30FF }, // ア-ン
  },
  'ko': {
    // Korean - Hangul Syllables
    range: { start: 0xAC00, end: 0xD7A3 }, // 가-힣
  },
  'hi': {
    // Hindi - Devanagari
    range: { start: 0x0900, end: 0x097F }, // अ-ह
  },
  'sv': {
    lowercase: { start: 0x61, end: 0x7A }, // a-z
    uppercase: { start: 0x41, end: 0x5A }, // A-Z
    accented: [0xE5, 0xE4, 0xF6], // å, ä, ö
  },
  'no': {
    lowercase: { start: 0x61, end: 0x7A }, // a-z
    uppercase: { start: 0x41, end: 0x5A }, // A-Z
    accented: [0xE6, 0xF8], // æ, ø
  },
  'da': {
    lowercase: { start: 0x61, end: 0x7A }, // a-z
    uppercase: { start: 0x41, end: 0x5A }, // A-Z
    accented: [0xE6, 0xF8], // æ, ø
  },
  'fi': {
    lowercase: { start: 0x61, end: 0x7A }, // a-z
    uppercase: { start: 0x41, end: 0x5A }, // A-Z
    accented: [0xE4, 0xF6, 0xE5], // ä, ö, å
  },
  'tr': {
    lowercase: { start: 0x61, end: 0x7A }, // a-z
    uppercase: { start: 0x41, end: 0x5A }, // A-Z
    accented: [0xE7, 0xF6, 0xFC, 0x131, 0x15F], // ç, ö, ü, ğ, ş
  },
  'cs': {
    lowercase: { start: 0x61, end: 0x7A }, // a-z
    uppercase: { start: 0x41, end: 0x5A }, // A-Z
    accented: [0xE1, 0xE9, 0xEC, 0xF9, 0xF2, 0x165, 0x161, 0x17E, 0x017D], // á, é, í, ý, ó, ř, š, č, ň
  },
  'el': {
    // Greek
    lowercase: { start: 0x03B1, end: 0x03C9 }, // α-ω
    uppercase: { start: 0x0391, end: 0x03A9 }, // Α-Ω
  },
  'he': {
    // Hebrew - right-to-left
    characters: [
      0x05D0, 0x05D1, 0x05D2, 0x05D3, 0x05D4, 0x05D5, 0x05D6, 0x05D7, 0x05D8, 0x05D9,
      0x05DA, 0x05DB, 0x05DC, 0x05DD, 0x05DE, 0x05DF, 0x05E0, 0x05E1, 0x05E2
    ] // א-ת
  },
  'th': {
    // Thai
    range: { start: 0x0E01, end: 0x0E5B }, // ก-ฺ
  },
  'vi': {
    lowercase: { start: 0x61, end: 0x7A }, // a-z
    uppercase: { start: 0x41, end: 0x5A }, // A-Z
    accented: [0xE0, 0xE1, 0xE2, 0xE3, 0xE8, 0xE9, 0xEA, 0xEC, 0xF2, 0xF3, 0xF4, 0xF5, 0xF9, 0xFA], // à-á
  },
  'id': {
    lowercase: { start: 0x61, end: 0x7A }, // a-z
    uppercase: { start: 0x41, end: 0x5A }, // A-Z
  },
  'pt-BR': 'pt', // Shares with Portuguese
  'en-GB': 'en', // Shares with English for now
};

// Digit characters (shared across most languages)
const commonDigits = { start: 0x30, end: 0x39 }; // 0-9

// Common punctuation (can be extended per language)
const commonPunctuation = [0x2C, 0x2E, 0x21, 0x3F, 0x27, 0x22, 0x28, 0x29, 0x2D, 0x3A, 0x3B]; // , . ! ? ' " ( ) - : ;
// Space and newline
const spaceCharacters = [0x20, 0x0A]; // \n

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
    'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even'
  ],
  'es': [
    'el', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'haber',
    'con', 'su', 'por', 'para', 'como', 'estar', 'tener', 'le', 'lo', 'todo',
    'pero', 'más', 'hacer', 'o', 'año', 'este', 'ir', 'otro', 'ese',
    'tiempo', 'poder', 'ser', 'dice', 'si', 'me', 'ya', 'saber', 'qué',
    'entre', 'cuando', 'muy', 'sin', 'sobre', 'tener', 'él', 'pero', 'estar',
    'un', 'ver', 'con', 'te', 'yo', 'año', 'ir', 'estar', 'todo',
    'dar', 'hacer', 'poder', 'decir', 'ver', 'saber', 'querer', 'llegar',
    'pasar', 'deber', 'tener', 'hacer', 'dejar', 'venir', 'salir', 'o'
  ],
  'fr': [
    'le', 'de', 'un', 'être', 'et', 'à', 'il', 'avoir', 'ne', 'je',
    'son', 'que', 'se', 'qui', 'dans', 'ce', 'pas', 'pouvoir', 'plus',
    'par', 'mot', 'faire', 'tout', 'dire', 'vous', 'on', 'avec', 'comme', 'nous',
    'mais', 'si', 'leur', 'y', 'avoir', 'cela', 'mettre', 'prendre', 'sans', 'nom',
    'homme', 'temps', 'autre', 'donner', 'bien', 'où', 'aussi', 'comme', 'vouloir',
    'très', 'aller', 'nouveau', 'mon', 'que', 'etre', 'si', 'plus', 'faire', 'avec',
    'pas', 'tout', 'il', 'avoir', 'je', 'un', 'nous', 'en', 'vous', 'que', 'et'
  ],
  'de': [
    'der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich',
    'des', 'auf', 'für', 'ist', 'im', 'dem', 'nicht', 'ein', 'eine', 'als',
    'auch', 'es', 'an', 'werden', 'aus', 'er', 'hat', 'dass', 'wir', 'nach',
    'wird', 'um', 'am', 'noch', 'von', 'bei', 'wurde', 'über', 'sie', 'zum',
    'ja', 'nur', 'sein', 'können', 'muss', 'man', 'haben', 'einer', 'mir', 'wurde',
    'ich', 'mein', 'du', 'sein', 'werden', 'dass', 'mit', 'sich', 'wenn', 'nicht',
    'einem', 'es', 'kann', 'vor', 'dieser', 'so', 'durch', 'aus', 'wieder', 'um',
    'oder', 'haben', 'eine', 'mehr', 'ihr', 'unser', 'im', 'sollen', 'sollte', 'aber'
  ],
  'it': [
    'il', 'di', 'che', 'e', 'la', 'un', 'a', 'per', 'in', 'non',
    'essere', 'avere', 'da', 'si', 'con', 'essere', 'le', 'questo', 'più', 'potere',
    'questa', 'fare', 'tutto', 'su', 'per', 'in', 'ma', 'dire', 'da', 'essere',
    'anno', 'cosa', 'dire', 'nella', 'altro', 'essere', 'più', 'potere', 'fare',
    'come', 'essere', 'c', 'la', 'in', 'non', 'per', 'è', 'di', 'che', 'a', 'essere',
    'un', 'avere', 'a', 'in', 'da', 'essere', 'al', 'tra', 'uno', 'con', 'noi', 'fare',
    'potere', 'quello', 'solo', 'tutto', 'avere', 'sua', 'prim', 'essere', 'gli', 'su'
  ],
  'pt': [
    'o', 'de', 'a', 'e', 'do', 'da', 'em', 'um', 'para', 'é',
    'com', 'não', 'os', 'se', 'ser', 'ter', 'está', 'que', 'quem', 'mas',
    'como', 'est', 'uma', 'estar', 'na', 'fazer', 'tempo', 'por', 'muito', 'mais',
    'ir', 'dizer', 'estar', 'saber', 'fazer', 'ver', 'poder', 'pessoa', 'dar',
    'est', 'a', 'em', 'para', 'est', 'não', 'com', 'o', 'e', 'um', 'estar', 'por',
    'ter', 'não', 'estar', 'ser', 'a', 'em', 'o', 'de', 'é', 'estar', 'fazer', 'tem',
    'a', 'mas', 'não', 'estar', 'o', 'est', 'com', 'de', 'não', 'ser', 'para', 'em',
    'estar', 'poder', 'um', 'não', 'como', 'do', 'ao', 'os', 'das', 'pelos', 'à'
  ],
  'nl': [
    'de', 'het', 'van', 'een', 'in', 'en', 'op', 'zijn', 'niet', 'te',
    'dat', 'ze', 'zijn', 'ook', 'al', 'maar', 'mee', 'ze', 'zullen', 'eens',
    'op', 'aan', 'uit', 'door', 'was', 'wil', 'heeft', 'zullen', 'om', 'bij',
    'nog', 'als', 'wat', 'zal', 'hoe', 'over', 'hebben', 'alle', 'met',
    'deze', 'uit', 'naar', 'uit', 'niet', 'uit', 'zullen', 'er', 'hebben',
    'hier', 'wie', 'mensen', 'om', 'uit', 'bij', 'nog', 'naar', 'mij', 'hem',
    'als', 'u', 'op', 'uit', 'van', 'weg', 'om', 'naar', 'eens', 'me'
  ],
  'pl': [
    'nie', 'któ', 'z', 'a', 'nie', 'w', 'i', 'z', 'do', 'na',
    'z', 'taki', 'że', 'a', 'że', 'taki', 'sam', 'dla', 'u', 'je',
    'i', 'a', 'ty', 'po', 'u', 'z', 'taki', 'jeste', 'że', 'my',
    'ale', 'taki', 'sobie', 'a', 'mnie', 'o', 'tylko', 'że', 'jak', 'nie',
    'te', 'mi', 'o', 'z', 'do', 'z', 'jak', 'się', 'to', 'ale', 'z',
    'tylko', 'o', 'taki', 'cię', 'może', 'je', 'już', 'taki', 'ale',
    'chcesz', 'taki', 'je', 'taki', 'sobie', 'tylko', 'że', 'jeszcze'
  ],
  'ru': [
    'и', 'в', 'не', 'на', 'я', 'быть', 'что', 'с', 'как', 'а',
    'же', 'это', 'ты', 'мы', 'по', 'к', 'но', 'вы', 'за', 'из',
    'или', 'уже', 'сказать', 'который', 'когда', 'быть', 'я', 'быть',
    'что', 'ты', 'делать', 'свои', 'к', 'мож', 'вы', 'из', 'ты', 'как',
    'к', 'на', 'какой', 'м', 'где', 'там', 'о', 'к', 'есть', 'его',
    'о', 'из', 'он', 'м', 'г', 'к', 'ей', 'его', 'быть', 'бы', 'у',
    'нас', 'быть', 'они', 'на', 'что', 'а', 'я', 'что', 'т', 'вы'
  ],
  'ar': [
    'في', 'أن', 'من', 'هل', 'هذا', 'إلى', 'هو', 'في', 'على',
    'ما', 'أن', 'هذا', 'هو', 'و', 'كان', 'من', 'هذا', 'أن', 'هذا',
    'أن', 'مع', 'التي', 'على', 'من', 'ك', 'كيف', 'أين', 'متى',
    'ال', 'هذا', 'أن', 'ال', 'لم', 'كن', 'لم', 'لكم', 'كم', 'لماذا',
    'ين', 'كل', 'هذا', 'هو', 'هناك', 'يكون', 'هذا', 'هي',
    'فقط', 'ال', 'أنا', 'هذا', 'هو', 'نحن', 'هذه', 'ال', 'هذا'
  ],
  'zh': [
    '我', '你', '的', '是', '了', '不', '人', '在', '他', '有',
    '我', '在', '他', '这', '说', '她', '我', '你', '他', '我', '来',
    '去', '做', '了', '我', '可', '以', '到', '好', '说', '来', '我',
    '这', '她', '我', '你', '了', '他', '有', '大', '去', '看', '里',
    '你', '我', '我', '去', '我', '去', '和', '好', '的', '我', '这',
    '她', '好', '说', '来', '他', '我', '也', '她', '他', '的', '好'
  ],
  'ja': [
    '私', 'は', 'の', 'を', 'に', 'て', 'で', 'す', 'る', 'な',
    'た', 'て', 'ま', 'す', 'か', 'な', 'が', 'ら', 'で', 'も', 'し',
    'し', 'を', 'さ', 'せる', 'れ', 'て', 'に', 'て', 'て', 'も',
    'る', 'な', 'れ', 'て', 'る', 'な', 'で', 'さ', 'れ', 'と', 'や',
    'て', 'に', 'を', 'る', 'ら', 'な', 'い', 'て', 'て', 'の', 'を'
  ],
  'ko': [
    '나', '는', '의', '가', '에', '다', '를', '은', '할', '수', '있습니다',
    '이', '그', '저', '것', '안', '했', '습니다', '다', '면', '다',
    '저', '것', '생각', '했', '습니다', '을', '게', '하', '였', '습니다',
    '그', '있', '없', '하는', '있', '었', '습니다', '할', '수', '있',
    '그', '있', '있', '니', '그', '것', '어디', '서', '무엇', '일이'
  ],
  'hi': [
    'मैं', 'कि', 'यह', 'के', 'लिए', 'और', 'ए', 'में', 'है', 'और',
    'पर', 'थ', 'के', 'लिए', 'यह', 'और', 'कह', 'ता', 'में', 'यह',
    'मुझे', 'तुम', 'कर', 'का', 'यह', 'बात', 'से', 'मैं', 'मुझे', 'सभी',
    'तुम्हें', 'तुम', 'है', 'क्या', 'है', 'ए', 'का', 'यह', 'और',
    'यह', 'और', 'चाहिए', 'तुम', 'क्या', 'है', 'इच्छित', 'मेरे', 'साथ', 'में', 'है'
  ],
  'sv': [
    'och', 'det', 'är', 'jag', 'en', 'i', 'kan', 'du', 'inte', 'som',
    'är', 'sig', 'inte', 'min', 'med', 'du', 'är', 'hon', 'här', 'ska',
    'har', 'alla', 'också', 'inte', 'för', 'upp', 'att', 'om', 'igen',
    'mig', 'sin', 'från', 'var', 'vad', 'kan', 'nu', 'ännu', 'mer',
    'också', 'åt', 'komma', 'gera', 'kvar', 'ännu', 'du', 'också'
  ],
  'no': [
    'jeg', 'er', 'det', 'ikke', 'en', 'til', 'på', 'og', 'i', 'vi',
    'ikke', 'du', 'jeg', 'ha', 'kan', 'ikke', 'var', 'vi', 'har', 'vi',
    'meg', 'som', 'med', 'ikke', 'dette', 'en', 'til', 'ikke', 'du',
    'så', 'kan', 'de', 'er', 'ikke', 'ikke', 'å', 'andre', 'også',
    'kun', 'kan', 'når', 'som', 'ikke', 'en', 'til'
  ],
  'da': [
    'jeg', 'er', 'det', 'ikke', 'en', 'til', 'på', 'og', 'i', 'vi',
    'ikke', 'du', 'jeg', 'har', 'kan', 'ikke', 'var', 'vi', 'har', 'vi',
    'mig', 'som', 'med', 'ikke', 'dette', 'en', 'til', 'ikke', 'du',
    'så', 'kan', 'de', 'er', 'ikke', 'ikke', 'å', 'andre', 'også'
  ],
  'fi': [
    'minä', 'on', 'se', 'ja', 'olen', 'minä', 'ett', 'kun', 'ja', 'sinä',
    'minä', 'tänneen', 'mutta', 'minua', 'minä', 'kun', 'siniä', 'minä',
    'minä', 'minua', 'minä', 'minä', 'ovat', 'minun', 'sinä', 'minä',
    'minä', 'minun', 'sinä', 'voi', 'ovat', 'minulle', 'ja', 'voi',
    'en', 'olla', 'minä', 'on', 'minä', 'ole', 'minun', 'minä'
  ],
  'tr': [
    'bir', 've', 'bu', 'de', 'için', 'bir', 'bir', 'için', 'de',
    've', 'bu', 'için', 'bu', 'de', 'için', 'için', 'ben', 'de',
    've', 'için', 'bu', 'de', 'bir', 'için', 'olur', 'bazı', 'bu',
    'olsun', 'bir', 'de', 'için', 'için', 've', 'bu', 'kadar', 'olur',
    've', 'mi', 'için', 'de', 'evet', 'ben', 'bir', 'var', 'yok'
  ],
  'cs': [
    'je', 'to', 'a', 'také', 'jsem', 'ne', 'se', 've', 'svůj', 'jeho',
    'proč', 'toho', 'je', 'abych', 'jsem', 'ze', 'toto', 'nemáme', 'jest',
    'jen', 'mít', 'a', 'mít', 'tady', 'tam', 'taky', 'jako', 'co',
    'jó', 'to', 'budeme', 'mít', 'se', 'tu', 'kdy', 'byl', 'byla',
    'mít', 'ho', 'můžes', 'mi', 'se', 'ty', 'proč', 'proto', 'proto'
  ],
  'el': [
    'είμαι', 'είμαι', 'είναι', 'είσαι', 'είναι', 'είμαι', 'είμαι', 'είναι', 'είμαι',
    'είμαι', 'είναι', 'είμαι', 'είμαι', 'είμαι', 'είμαι', 'είμαι',
    'είμαι', 'είναι', 'είμαι', 'είμαι', 'είμαι', 'είμαι', 'είναι',
    'είμαι', 'είναι', 'είμαι', 'είμαι', 'είμαι', 'είμαι', 'είναι'
  ],
  'he': [
    'אני', 'אתה', 'של', 'ל', 'כל', 'ב', 'ל', 'מ', 'ש', 'ל',
    'ב', 'ל', 'ה', 'כ', 'ש', 'ש', 'ל', 'ב', 'כ', 'ל', 'כ', 'ל', 'ל', 'כ',
    'ב', 'ב', 'ה', 'ה', 'ב', 'ב', 'כ', 'ל', 'כ', 'ל', 'ה', 'כ', 'ש',
    'ב', 'ה', 'כ', 'ב', 'ב', 'ל', 'ל', 'א', 'ם', 'ל', 'אית', 'איך',
    'םל', 'של', 'אית', 'ב', 'ל', 'ות', 'אית', 'ב', 'א', 'ל', 'ה'
  ],
  'th': [
    'ผม', 'แล้ว', 'กับ', 'ที่', 'มา', 'ก็', 'ใน', 'ไม่', 'ให้', 'กับ',
    'ที่', 'มี', 'ของ', 'ผม', 'แล้ว', 'กับ', 'ที่', 'มา', 'ก็',
    'มา', 'ก็', 'ให้', 'กับ', 'ที่', 'มี', 'ผม', 'แล้ว', 'กับ',
    'ที่', 'มา', 'ของ', 'ได้้มา', 'ก็', 'ให้', 'กับ', 'ที่', 'มี',
    'ใน', 'ไม่', 'ให้', 'กับ', 'ที่', 'มา', 'ก็'
  ],
  'vi': [
    'tôi', 'là', 'đây', 'cho', 'có', 'và', 'đi', 'là', 'nhưng', 'là',
    'với', 'thì', 'có', 'là', 'đi', 'tôi', 'đó', 'đây', 'nhưng', 'một',
    'người', 'nào', 'có', 'thể', 'là', 'với', 'tôi', 'đi', 'là', 'được',
    'tôi', 'cho', 'biết', 'nhưng', 'là', 'tôi', 'muốn', 'biết', 'như',
    'thì', 'thì', 'có', 'thể', 'là', 'với', 'ta', 'đi', 'là'
  ],
  'id': [
    'saya', 'adalah', 'di', 'ke', 'dan', 'dalam', 'itu', 'ada', 'dengan',
    'saya', 'ke', 'untuk', 'di', 'ada', 'itu', 'dengan', 'saya', 'di',
    'yang', 'ingin', 'ada', 'itu', 'dengan', 'saya', 'di', 'ada',
    'itu', 'itu', 'di', 'saya', 'ingin', 'dengan', 'saya', 'ke',
    'akan', 'yang', 'di', 'itu', 'dengan', 'saya', 'di', 'itu', 'di'
  ]
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
  const lang = supportedLanguages.find(l => l.code === languageCode);
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
  return supportedLanguages.map(lang => lang.speechCode);
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
  let match = voices.find(voice => voice.lang === targetLang);
  if (match) {
    return match;
  }

  // Try matching language code without region
  const langPrefix = targetLang.split('-')[0];
  match = voices.find(voice => voice.lang.startsWith(langPrefix));
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
  const lang = supportedLanguages.find(l => l.code === languageCode);
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
  initialize
};
