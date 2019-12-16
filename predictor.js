// (c) 2019 Jim Hawkins. MIT licensed, see https://opensource.org/licenses/MIT

const _vowels = ["a", "e", "i", "o", "u"];

/*
A predictor instance must have a `get` method that returns an array of objects
each with the following properties.

-   text, the next text, like a letter.
-   weight, the visual weighting to be given to this box.
-   group, a group name like "capital" or null if this item doesn't represent a
    group.
-   Other properties that the predictor requires next time around.
*/

export default class Predictor {
    // constructor() {
    //     super();
    //     console.log(JSON.stringify(
    //         Predictor.characterGroups, undefined, 4));
    // }

    get(message, prediction) {
        const weighted = (
            (prediction === null || message.endsWith(". ")) ?
            "capital" : null);
        const boosted = prediction === null ? null : prediction.boosted;
        const only = prediction === null ? null : prediction.group;

        const returning = [];
        for (const group of Predictor.characterGroups) {
            if (group.name === boosted || group.name === only) {
                group.texts.forEach(text => returning.push({
                    "text": text,
                    "weight": _vowels.includes(text) ? 2 : 1,
                    "group": null,
                    "boosted": group.boost
                }));
            }
            else if (only === null) {
                returning.push({
                    "text": "", "group": group.name, "boosted": group.name,
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
});
