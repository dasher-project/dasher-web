// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

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
    set_weight(weightPoints[index], 1);
    index = (index + 1) % weightPoints.length;
    return;
}
