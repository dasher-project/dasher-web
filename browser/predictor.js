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
    // Next line uses the Promise constructor with an arrow function. This is to
    // make it a useful template for other Predictor classes.  
    // The code here would be better as a Promise.resolve(returns).
    get(points, text, prediction) { return new Promise((resolve, reject) => {
        const boosted = prediction === null ? null : prediction.boosted;
        const only = prediction === null ? null : prediction.group;

        const returns = [];
        const returnGroups = [];
        for (const group of Predictor.characterGroups) {
            if (group.name === boosted || group.name === only) {
                group.codePoints.forEach(codePoint => {
                    returns.push({
                        "codePoint": codePoint,
                        "group": null,
                        "member": group.name,
                        "boosted": group.boost,
                        "weight": 1
                    });
                    returnGroups.push(null);
                });
            }
            else if (only === null) {
                returns.push({
                    "codePoint": null,
                    "group": group.name,
                    "boosted": group.name,
                    "weight": group.codePoints.length
                });
                returnGroups.push(group);
            }
        }

        // This is order n-squared which isn't good but proves the approach.
        const characterWeights = this.get_character_weights(
            points, text, prediction);
        for (const {codePoint, weight} of characterWeights) {
            for (const [index, returning] of returns.entries()) {
                const returnGroup = returnGroups[index];
                if (returnGroup === null) {
                    if (returning.codePoint === codePoint) {
                        returning.weight = weight;
                        break;
                    }
                }
                else {
                    // Optimise if returnGroup has firstPoint and lastPoint
                    if (returnGroup.codePoints.includes(codePoint)) {
                        returning.weight += (weight - 1);
                        break;
                    }
                }
            }
        }

        resolve(returns);
    });}

    // Base class get... doesn't use the `text` parameter but subclass
    // implementations might.
    get_character_weights(points, text, prediction) {
        const lastIndex = points.length - 1;

        // Check if the message ends full stop, space.
        const stopSpace = (
            lastIndex >= 1 &&
            points[lastIndex - 1] === codePointStop &&
            points[lastIndex] === codePointSpace
        );

        if (prediction === null || stopSpace) {
            // Start of input, or after full stop space, favour capital letters.
            return capitalWeights;
        }

        const weightGroup = (
            prediction.group === null ? prediction.member : prediction.boosted);

        return Predictor.characterGroupMap[weightGroup].weights;
    }
}

const vowelTexts = ["a", "e", "i", "o", "u"];
const vowelCodePoints = vowelTexts.map(text => text.codePointAt(0));

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

// Create an object for easy mapping from group name to group object.
Predictor.characterGroupMap = {};
Predictor.characterGroups.forEach(group => {
    Predictor.characterGroupMap[group.name] = group;
});

// Fill in basic attributes for groups: texts and codePoints.
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

// Compute additional attributes for groups: weights under this group.
const boostWeight = 25;
const vowelWeight = 2;
const spaceWeight = 25;
Predictor.characterGroups.forEach(group => {
    const boosted = Predictor.characterGroupMap[group.boost];

    // Start with a big weight for anything in the boosted group under this
    // group.
    group.weights = boosted.codePoints.map(point => {return {
        "codePoint": point, "weight": boostWeight
    }});

    // Utility function.
    function adjust(codePoints, factor) {
        codePoints.forEach(adjustPoint => {
            let found = false;
            for(const weighting of group.weights) {
                if (weighting.codePoint === adjustPoint) {
                    found = true;
                    weighting.weight *= factor;
                    break;
                }
            }
            if (!found) {
                group.weights.push({
                    "codePoint": adjustPoint, "weight": factor
                });
            }
        });
    }

    // Add weights for vowels and spaces.
    adjust(vowelCodePoints, vowelWeight);
    adjust(Predictor.characterGroupMap["space"].codePoints, spaceWeight);
});

const capitalWeights = Predictor.characterGroupMap[
    "capital"
].codePoints.map(
    point => {return {"codePoint": point, "weight": 15};}
);
capitalWeights.push({
    "codePoint": codePointSpace, "weight": spaceWeight
});
