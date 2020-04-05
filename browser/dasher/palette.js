// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

export default class Palette {

    constructor() {
        this._sequenceStubCSS = "sequence";
    }

    get sequenceStubCSS() {return this._sequenceStubCSS;}

    display_text(codePoint) {
        const displayTextIndex = (
            codePoint === null ? undefined :
            Palette.displayTextLeft.indexOf(codePoint));
        return (
            displayTextIndex === undefined ? null :
            String.fromCodePoint(
                displayTextIndex >= 0 ?
                Palette.displayTextMap[displayTextIndex][1] :
                codePoint
            )
        );
    }

    sequenceCSS(ordinal, index) {
        return [
            this.sequenceStubCSS, (ordinal % 2).toFixed(), (index % 2).toFixed()
        ].join("-");
    }

    template() {
        const returning = [];
        for (const group of Palette.characterGroups) {
            const template = {
                "cssClass": group.name, "childSpecifications": []
            };
            returning.push(template);
            group.codePoints.forEach(
                codePoint => template.childSpecifications.push({
                    "codePoint": codePoint
                }));
        }
        return returning;

        // could optimise by making a map of code points to groups, to speed up
        // the weight population later. Also, the childspecifications and
        // returning arrays could be shallow copies of a pre-gen.

    }
}


Palette.characterGroups = [
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
        "name": "punctuation", "texts": [ ",", ".", "&", "!", "?" ]
    }, {
        "name": "space", "texts": [ " ", "\n" ]
    }
];

// Create an object for easy mapping from group name to group object.
Palette.characterGroupMap = {};
Palette.characterGroups.forEach(group => {
    Palette.characterGroupMap[group.name] = group;
});

// Fill in basic attributes for groups: texts and codePoints.
const characters = [];
Palette.characterGroups.forEach(group => {
    if (!("texts" in group)) {
        group.texts = [];
        for (
            let codePoint = group.firstPoint;
            codePoint <= group.lastPoint;
            codePoint++
        ) {
            group.texts.push(String.fromCodePoint(codePoint));
        }
    }
    group.codePoints = group.texts.map(text => text.codePointAt(0));
    characters.push(...group.codePoints);
});
Palette.characters = characters;


// TOTH:
// https://ux.stackexchange.com/questions/91255/how-can-i-best-display-a-blank-space-character
Palette.displayTextMap = [
    [" ", 0x23b5], // Space mapped to under-bracket.
    ["\n", 0xb6]   // Newline mapped to pilcrow.
];
Palette.displayTextLeft = Palette.displayTextMap.map(
    pair => pair[0].codePointAt(0));
