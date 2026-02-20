// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

import Palette from './palette.js';
import * as LanguageManager from './languageManager.js';

const baseSequenceStubCSS = "sequence";

const baseDisplayTextDefinitions = [
    {leftText:" ",  rightCodePoint:0x23b5}, // Space mapped to under-bracket.
    {leftText:"\n", rightCodePoint:0xb6}    // Newline mapped to pilcrow.
];

class Template {
    constructor(codePoint, displayText, cssClass, childTemplates, palette) {
        this.codePoint = codePoint;
        this.displayText = displayText;
        this.cssClass = cssClass;
        this.childTemplates = childTemplates;
        this.palette = palette;
        this._weight = codePoint === null ? null : 1;
    }

    get weight() {return this._weight;}
}

export default class LanguagePalette extends Palette {

    constructor(languageCode = 'en') {
        super();
        this._languageCode = languageCode;
    }

    // Override to build language-specific groups
    get groupDefinitions() {
        const alphabet = LanguageManager.getAlphabet(this._languageCode);
        const definitions = [];

        // Languages with character arrays (Chinese, Japanese, Korean, etc.)
        if (alphabet.characters && alphabet.characters.length > 0) {
            definitions.push({
                name: null,  // No grouping, just characters
                texts: alphabet.characters.map(cp => String.fromCodePoint(cp))
            });
        }
        // Languages with lowercase/uppercase (Latin, Cyrillic, Greek scripts)
        else {
            // Lowercase letters
            if (alphabet.lowercase) {
                const lc = alphabet.lowercase;
                if (lc.ranges && lc.ranges.length > 0) {
                    // Multiple ranges (like for Turkish with dotted/dotless i)
                    const texts = [];
                    for (const range of lc.ranges) {
                        for (let cp = range.start; cp <= range.end; cp++) {
                            texts.push(String.fromCodePoint(cp));
                        }
                    }
                    definitions.push({
                        name: null,  // Flatten lowercase
                        texts: texts
                    });
                } else if (lc.start && lc.end) {
                    // Single contiguous range
                    definitions.push({
                        name: null,
                        firstPoint: lc.start,
                        lastPoint: lc.end
                    });
                }
            }

            // Uppercase letters
            if (alphabet.uppercase) {
                const uc = alphabet.uppercase;
                if (uc.ranges && uc.ranges.length > 0) {
                    const texts = [];
                    for (const range of uc.ranges) {
                        for (let cp = range.start; cp <= range.end; cp++) {
                            texts.push(String.fromCodePoint(cp));
                        }
                    }
                    definitions.push({
                        name: "capital",
                        texts: texts
                    });
                } else if (uc.start && uc.end) {
                    definitions.push({
                        name: "capital",
                        firstPoint: uc.start,
                        lastPoint: uc.end
                    });
                }
            }

            // Accented/extended characters
            if (alphabet.accented && alphabet.accented.length > 0) {
                definitions.push({
                    name: "accented",
                    texts: alphabet.accented.map(cp => String.fromCodePoint(cp))
                });
            }
        }

        // Common numerals (0-9 are universal)
        definitions.push({
            name: "numeral",
            firstPoint: "0".codePointAt(0),
            lastPoint: "9".codePointAt(0)
        });

        // Contractions - language specific
        if (alphabet.contractions && alphabet.contractions.length > 0) {
            definitions.push({
                name: "contraction",
                texts: alphabet.contractions
            });
        } else {
            // Default English contractions
            definitions.push({
                name: "contraction",
                texts: ["'", "-"]
            });
        }

        // Punctuation - language specific
        if (alphabet.punctuation && alphabet.punctuation.length > 0) {
            definitions.push({
                name: "punctuation",
                texts: alphabet.punctuation.map(cp => String.fromCodePoint(cp))
            });
        } else {
            // Default punctuation
            definitions.push({
                name: "punctuation",
                texts: [
                    ",", ".", "&", "!", "?", "+", "$",
                    String.fromCodePoint(162), // cent
                    String.fromCodePoint(176), // degree
                    String.fromCodePoint(163)  // pound
                ]
            });
        }

        // Space and control characters
        definitions.push({
            name: "space",
            texts: [" ", "\n"]
        });

        return definitions;
    }

    get sequenceStubCSS() {return baseSequenceStubCSS;}

    get displayTextDefinitions() {return baseDisplayTextDefinitions;}

    setLanguage(languageCode) {
        this._languageCode = languageCode;
        // Rebuild the palette with new language
        this.codePoints = [];
        this._mapPointToDisplayPoint = new Map();
        this._rootTemplate = new Template(null, null, null, [], this);
        this._indexMap = new Map();
        this.build();
    }

    get languageCode() {return this._languageCode;}
}
