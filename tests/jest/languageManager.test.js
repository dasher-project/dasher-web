// Tests for the 90-language expansion: every language must resolve to a
// palette-consumable alphabet of assigned letters, and the v0.1.0 saved
// language names must migrate instead of restoring a stale index.

import * as LanguageManager from '../../browser/dasher/languageManager.js';

const supportedLanguages = LanguageManager.getSupportedLanguages();

// Mirrors how languagePalette.js reads an alphabet: the forms it consumes
// are `characters` (flat array) and `lowercase`/`uppercase`/`accented`
// (ranges and arrays). Any other shape yields no letters.
const collectPaletteLetters = (alphabet) => {
  const points = [];
  if (alphabet.characters) {
    points.push(...alphabet.characters);
  }
  for (const key of ['lowercase', 'uppercase', 'accented']) {
    const part = alphabet[key];
    if (!part) {
      continue;
    }
    if (part.start !== undefined && part.end !== undefined) {
      for (let cp = part.start; cp <= part.end; cp++) {
        points.push(cp);
      }
    } else if (Array.isArray(part)) {
      points.push(...part);
    }
  }
  return points;
};

describe('Language catalogue', () => {
  it('has 90 languages, unique codes and names', () => {
    expect(supportedLanguages.length).toBe(90);
    const codes = new Set(supportedLanguages.map((l) => l.code));
    const names = new Set(supportedLanguages.map((l) => l.name));
    expect(codes.size).toBe(90);
    expect(names.size).toBe(90);
  });

  it('defaults to English and keeps the rest alphabetical', () => {
    expect(supportedLanguages[0].code).toBe('en');
    const names = supportedLanguages.slice(1).map((l) => l.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  it('retains Chinese and Hindi with real palette letters', () => {
    for (const code of ['zh', 'hi']) {
      const letters = collectPaletteLetters(LanguageManager.getAlphabet(code));
      expect(letters.length).toBeGreaterThan(10);
    }
  });

  it('gives every language an alphabet the palette can consume', () => {
    for (const lang of supportedLanguages) {
      const letters = collectPaletteLetters(
          LanguageManager.getAlphabet(lang.code));
      expect(letters.length).toBeGreaterThan(
          20, `${lang.code} resolved to ${letters.length} palette letters`);
    }
  });

  it('uses only assigned letters (no tofu) in script alphabets', () => {
    const nonLatin = supportedLanguages.filter(
        (l) => l.script !== 'Latin' && l.code !== 'en');
    for (const lang of nonLatin) {
      const letters = collectPaletteLetters(
          LanguageManager.getAlphabet(lang.code));
      for (const cp of letters) {
        expect(/\p{L}/u.test(String.fromCodePoint(cp))).toBe(true);
      }
    }
  });

  it('marks exactly the RTL languages', () => {
    const rtl = supportedLanguages.filter((l) => l.rtl).map((l) => l.code);
    expect(rtl.sort()).toEqual(['ar', 'fa', 'he', 'ur']);
  });

  it('has well-formed BCP-47 speech codes', () => {
    const re = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;
    for (const lang of supportedLanguages) {
      expect(re.test(lang.speechCode)).toBe(true);
    }
  });
});

describe('Saved-language migration (v0.1.0 names)', () => {
  // Same remap the language control applies in userinterface.js: exact
  // name match, else strip a parenthesised qualifier and retry.
  const remap = (savedName) => {
    let lang = supportedLanguages.find((l) => l.name === savedName);
    if (lang === undefined) {
      const base = savedName.replace(/\s*\(.*\)$/, '');
      lang = supportedLanguages.find((l) => l.name === base);
    }
    return lang;
  };

  it('maps legacy English (UK) to English, not a stale index', () => {
    expect(remap('English (UK)')).toBe(supportedLanguages[0]);
  });

  it('maps legacy Portuguese (Brazil) to Portuguese', () => {
    const lang = remap('Portuguese (Brazil)');
    expect(lang.code).toBe('pt');
  });

  it('keeps current names as exact matches', () => {
    for (const lang of supportedLanguages) {
      expect(remap(lang.name)).toBe(lang);
    }
  });
});
