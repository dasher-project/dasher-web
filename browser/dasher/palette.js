// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

const baseGroupDefinitions = [
    {
        "name": null,
        "firstPoint": "a".codePointAt(0), "lastPoint": "z".codePointAt(0)
    }, {
        "name": "capital",
        "firstPoint": "A".codePointAt(0), "lastPoint": "Z".codePointAt(0)
    }, {
        "name": "numeral",
        "firstPoint": "0".codePointAt(0), "lastPoint": "9".codePointAt(0)
    }, {
        "name": "contraction","texts": [ "'", "-" ]
    }, {
        "name": "punctuation", "texts": [
            ",", ".", "&", "!", "?", "+", "$",
            // Next values are: cents symbol, degrees symbol, pound sign.
            String.fromCodePoint(162), String.fromCodePoint(176),
            String.fromCodePoint(163),

        ]
    }, {
        "name": "space", "texts": [ " ", "\n" ]
    }
];

const baseSequenceStubCSS = "sequence";

// TOTH:
// https://ux.stackexchange.com/questions/91255/how-can-i-best-display-a-blank-space-character
//
// Some characters aren't displayed in the zooming user interface, for example
// whitespace. This array is used to build a map of those characters and their
// displayed alternates.
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

        // Default weight for any character is one. Groups don't have weights
        // though. The controller generates their weights by summing their
        // predicted child box weights.
        this._weight = codePoint === null ? null : 1;
    }

    get weight() {return this._weight;}
}

export default class Palette {

    constructor() {
        this.codePoints = [];
        this._mapPointToDisplayPoint = new Map();
        this._indexMap = new Map();
        this._build();
    }

    // This should be a private method, declared like this.
    //
    //     #build() {
    //         // Code here.
    //     }
    //
    // The syntax doesn't seem to be supported by Safari so it isn't used.
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_class_fields#browser_compatibility

    _build() {
        this._groups = this.groupDefinitions.map(definition => {
            const group = {
                definition: definition,
                name: definition.name === null ? null : definition.name.slice()
            };

            // Each group definition either has a texts array or has a code
            // point range specified by a first and last code point. Normalise
            // so that all group definitions have texts and code points.
            if ("texts" in definition) {
                group.texts = definition.texts.slice();
                group.codePoints = group.texts.map(text => text.codePointAt(0));
            }
            else {
                group.texts = [];
                group.codePoints = [];
                for (
                    let codePoint = definition.firstPoint;
                    codePoint <= definition.lastPoint;
                    codePoint++
                ) {
                    group.texts.push(String.fromCodePoint(codePoint));
                    group.codePoints.push(codePoint);
                }
            }

            // Append all the code points from this group to the palette's
            // overall code point array.
            this.codePoints.push(...group.codePoints);

            return group;
        });

        // Fill in the display text map code points.
        this.displayTextDefinitions.forEach(({leftText, rightCodePoint}) => {
            this._mapPointToDisplayPoint.set(
                leftText.codePointAt(0), rightCodePoint);
        });

        // Populate the indexMap. Given a code point, it returns the index in
        // the codePoints array. That will also be the index in a child box
        // array, if no off-palette insertions have been made.
        this.codePoints.forEach((codePoint, index) => {
            this._indexMap.set(codePoint, index);
        });

        return this;
    }

    // Getter that could be overridden in subclasses.
    get sequenceStubCSS() {return baseSequenceStubCSS;}

    // Getter to be overridden in subclasses.
    get groupDefinitions() {return baseGroupDefinitions;}

    // Getter that could be overridden in subclasses.
    get displayTextDefinitions() {return baseDisplayTextDefinitions;}

    get rootTemplate() {return this._rootTemplate;}
    get indexMap() {return this._indexMap;}

    // Get a display character from the map; used for whitespace.
    display_text(codePoint) {
        const mappedPoint = this._mapPointToDisplayPoint.get(codePoint);
        return String.fromCodePoint(
            mappedPoint === undefined ? codePoint : mappedPoint);
    }

    // Generate a CSS class name from an ordinal and index value.
    sequence_CSS(ordinal, index) {
        return [
            this.sequenceStubCSS, (ordinal % 2).toFixed(), (index % 2).toFixed()
        ].join("-");
    }

}
