// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

/*

Predictor that doesn't set any weighting.  
Actually, sets a weight of one into a character that advances on every call. One
is the default weight, so setting it has no effect. The weight setting is a
basic test of the caller.

*/

const firstPoint = "a".codePointAt(0);
const lastPoint = "z".codePointAt(0);

const weightPoints = [];
let lower = true;
for (let codePoint = firstPoint; codePoint <= lastPoint; codePoint++) {
    weightPoints.push(
        lower ?
        String.fromCodePoint(codePoint).toLowerCase().codePointAt(0) :
        String.fromCodePoint(codePoint).toUpperCase().codePointAt(0)
    );
    lower = !lower;
}

let index = Math.floor(weightPoints.length / 2);

export default async function (
    codePoints, text, predictorData, palette, set_weight
) {
    if (predictorData !== undefined) {
        console.log(`dummy "${text}" ${predictorData}`);
    }
    set_weight(weightPoints[index], 1, index);
    index = (index + 1) % weightPoints.length;
    return;
}
