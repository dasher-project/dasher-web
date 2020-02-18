// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

/*
A predictor instance must have a `get` method that returns an array of objects
each with the following properties.

-   `codePoint`, the next text, like a letter, as a Unicode code point value.
-   `weight`, the visual weighting to be given to this box.
-   `group`, a group name like "capital" or null if this item doesn't represent
    a group.
-   Other custom properties for the use of the predictor, next time around.
    The Predictor class here adds one custom property: `boosted`.
*/

const codePointSpace = " ".codePointAt(0);
const codePointStop = ".".codePointAt(0);

export default class Predictor {
    // constructor() {
    //     console.log(JSON.stringify(
    //         Predictor.characterGroups, undefined, 4));
    // }

    get(message, prediction) {
        const lastIndex = message.length - 1;

        // Check if the messages ends full stop, space.
        const stopSpace = (
            lastIndex > 1 && message[lastIndex - 1] === codePointStop &&
            message[lastIndex] === codePointSpace
        );
        const weighted = (prediction === null || stopSpace) ? "capital" : null;
        const boosted = prediction === null ? null : prediction.boosted;
        const only = prediction === null ? null : prediction.group;

        const returning = [];
        for (const group of Predictor.characterGroups) {
            if (group.name === boosted || group.name === only) {
                group.codePoints.forEach(codePoint => returning.push({
                    "codePoint": codePoint,
                    "group": null,
                    "boosted": group.boost,
                    "weight":
                        (Predictor.vowelCodePoints.includes(codePoint) ? 2 : 1)
                }));
            }
            else if (only === null) {
                returning.push({
                    "codePoint": null,
                    "group": group.name,
                    "boosted": group.name,
                    "weight": group.name === weighted ? 20 : 1
                })
            }
        }
        return returning;
    }
}

Predictor.characterGroups = [
    {
        "name": "small", "boost": "small",
        "firstPoint": "a".codePointAt(0), "lastPoint": "z".codePointAt(0)
    }, {
        "name": "capital", "boost": "small",
        "firstPoint": "A".codePointAt(0), "lastPoint": "Z".codePointAt(0)
    }, {
        "name": "numeral", "boost": "numeral",
        "firstPoint": "0".codePointAt(0), "lastPoint": "9".codePointAt(0)
    }, {
        "name": "punctuation", "boost": "space", "texts": [
            ",", ".", "&", "!", "?"
        ]
    }, {
        "name": "space", "boost": "small", "texts": [
            " ", "\n"
        ]
    }
];

Predictor.characterGroups.forEach(group => {
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
});

Predictor.vowelTexts = ["a", "e", "i", "o", "u"];
Predictor.vowelCodePoints = Predictor.vowelTexts.map(
    text => text.codePointAt(0));
