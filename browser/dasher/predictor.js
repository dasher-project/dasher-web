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

const vowelTexts = ["a", "e", "i", "o", "u"];
const vowelCodePoints = vowelTexts.map(text => text.codePointAt(0));

// Gets generated from the palette on first invocation.
let capitalCodePoints;

const vowelWeight = 5;
const capitalWeight = 5;

export default async function (
    codePoints, text, predictorData, palette, set_weight
) {
    // if (predictorData !== undefined) {
    //     console.log(`predictor "${text}" ${predictorData}`);
    // }

    if (capitalCodePoints === undefined) {
        // It isn't completely clear that JS RE can detect letters in any
        // language. For now, the test for a capital is both of these
        // conditions:
        //
        // -   Must be the same if converted to upper case.
        // -   Must be different if converted to lower case.
        //
        // The second clause filters out numerals, spaces, and the like.
        capitalCodePoints = palette.codePoints.filter(palettePoint => {
            const paletteText = String.fromCodePoint(palettePoint);
            return (
                paletteText === paletteText.toUpperCase() &&
                paletteText !== paletteText.toLowerCase()
            );
        });
        console.log(capitalCodePoints);
    }

    const lastIndex = codePoints.length - 1;

    // Check if the message ends full stop, space.
    const stopSpace = (
        lastIndex >= 1 &&
        codePoints[lastIndex - 1] === codePointStop &&
        codePoints[lastIndex] === codePointSpace
    );

    // At the start of input, or after full stop space, favour capital letters.
    const capitalReason = (
        lastIndex < 0 ? "start" : stopSpace ? "stop space" : null);
    
    if (capitalReason === null) {
        // Otherwise favour vowels.
        vowelCodePoints.forEach(
            point => set_weight(point, vowelWeight, "vowel"));    
    }
    else {
        capitalCodePoints.forEach(
            point => set_weight(point, capitalWeight, capitalReason));
    }

    return;
}
