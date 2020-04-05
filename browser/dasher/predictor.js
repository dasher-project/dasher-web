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
    async get(points, text, prediction) {
        const boosted = prediction === null ? null : prediction.boosted;
        const only = prediction === null ? null : prediction.group;

        const returns = [];
        const returnGroups = [];
        for (const group of Predictor.characterGroups) {
            if (group.name === boosted || group.name === only) {
                const baseWeight = 2 / group.codePoints.length;
                group.codePoints.forEach(codePoint => {
                    returns.push({
                        "codePoint": codePoint,
                        "group": null,
                        "member": group.name,
                        "boosted": group.boost,
                        "weight": 1,
                        "baseWeight": baseWeight
                    });
                    returnGroups.push(null);
                });
            }
            else if (only === null) {
                returns.push({
                    "codePoint": null,
                    "group": group.name,
                    "boosted": group.name,
                    "weight": group.codePoints.length,
                    "baseWeight": group.codePoints.length / 10,
                    "predicted": false
                });
                returnGroups.push(group);
            }
        }
        let boostPredicted = false;

        // This is order n-squared which isn't good but proves the approach.
        const characterWeights = await this.get_character_weights(
            points, text, prediction);


            characterWeights.forEach((weight, codePoint) => {
            let found = false;
            for (const [index, returning] of returns.entries()) {
                const returnGroup = returnGroups[index];
                if (returnGroup === null) {
                    if (returning.codePoint === codePoint) {
                        returning.weight = weight;
                        found = true;
                        boostPredicted = true;
                        break;
                    }
                }
                else {
                    // Optimise if returnGroup has firstPoint and lastPoint
                    if (returnGroup.codePoints.includes(codePoint)) {
                        returning.weight += (weight - 1);
                        found = true;
                        returning.predicted = true;
                        break;
                    }
                }
            }

            if (!found) {
                for(const checkGroup of Predictor.characterGroups) {
                    if (checkGroup.codePoints.includes(codePoint)) {
                        found = true;
                        break;
                    }
                }
            }
            if (!found) {
                throw new Error(
                    `Code point with weight not found: ${codePoint}` +
                    ` "${String.fromCodePoint(codePoint)}".`);
            }
        });

        // Reduce weights of items that didn't appear in the prediction.
        for (const returning of returns) {
            if (returning.codePoint === null) {
                if (!returning.predicted) {
                    returning.weight = returning.baseWeight;
                }
            }
            else {
                if (!boostPredicted) {
                    returning.weight = returning.baseWeight;
                }
            }
        }

        return returns;
    }

    // Base class get... doesn't use the `text` parameter but subclass
    // implementations might.
    async get_character_weights(points, text, prediction) {
        return {
            "weights": new Map(), "defaultWeight": 1, "contexts": new Map()
        };
        // const lastIndex = points.length - 1;

        // // Check if the message ends full stop, space.
        // const stopSpace = (
        //     lastIndex >= 1 &&
        //     points[lastIndex - 1] === codePointStop &&
        //     points[lastIndex] === codePointSpace
        // );

        // if (prediction === null || stopSpace) {
        //     // Start of input, or after full stop space, favour capital letters.
        //     return capitalWeights;
        // }

        // const weightGroup = (
        //     prediction.group === null ? prediction.member : prediction.boosted);

        // return Predictor.characterGroupMap[weightGroup].weights;
    }

    static is_space(codePoint) {
        return Predictor.characterGroupMap.space.codePoints.includes(codePoint);
    }
}

const vowelTexts = ["a", "e", "i", "o", "u"];
const vowelCodePoints = vowelTexts.map(text => text.codePointAt(0));

// Compute additional attributes for groups: weights under this group.
const vowelWeight = 2;
const spaceWeight = 1;
Predictor.characterGroups.forEach(group => {
    const boosted = Predictor.characterGroupMap[group.boost];

    // Start predicting each character in the boosted group under this group.
    group.weights = new Map();
    boosted.codePoints.forEach(point => group.weights.set(point, 1));

    // Utility function.
    function adjust(codePoints, factor) {
        codePoints.forEach(adjustPoint => {
            const weighting = group.weights.get(adjustPoint);
            if (weighting !== undefined) {
                group.weights.set(adjustPoint, weighting * factor);
            }
        });
    }

    // Add weights for vowels and spaces.
    adjust(vowelCodePoints, vowelWeight);
    adjust(Predictor.characterGroupMap.space.codePoints, spaceWeight);
});

const capitalWeights = new Map();
Predictor.characterGroupMap.capital.codePoints.forEach(
    point => capitalWeights.set(point, 1)
);
capitalWeights.set(codePointSpace, spaceWeight);
