// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

/*
This code could be used as a base for other predictors. The predictor
programming interface is as follows.

There is a single function by which a prediction will be requested. The function
takes the following parameters.

-   `codePoints` the message for which the next character is to be predicted, as
    an array of Unicode code point numbers.
-   `text` the same message but as a string.
-   `predictorData` user data set by the predictor function by calling
    set_weight(), see below.
-   `palette` reference to the Palette object that is in use. This could be used
    for example, to find out how many characters are in the palette by reading
    the codePoints.length property.
-   `set_weight` callback to invoke to predict weights, as follows.

        set_weight(codePoint, weight, predictorData)

    Where:

    -   `codePoint` is the code point for which a prediction is being made.
    -   `weight` to assign.
    -   `predictorData` user data object that will be stored in the ZoomBox that
        represents the predicted code point. It will be passed back to this
        function as a parameter when predictions following the predicted code
        point are requested.

Unpredicted characters each get an implicit weight of one.

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
        // console.log(capitalCodePoints);
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
