// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

/*
Predictor that generates deterministic pseudo-random predictions.
*/

import predictor_basic from './predictor.js';

const maximumChoices = 4;

export default async function (
    codePoints, text, predictorData, palette, set_weight
) {
    const choices = Math.floor(codePoints.reduce(
        (accumulated, point) => (accumulated + point) % maximumChoices, 0
    ));
    if (choices <= 0) {
        return predictor_basic(
            codePoints, text, predictorData, palette, set_weight);
    }

    const paletteLength = palette.codePoints.length;
    const chosen = [Math.floor(codePoints.reduce(
        (accumulated, point) => (accumulated + point) % paletteLength,
        paletteLength * 0.15
    ))];
    for(let index = chosen.length; index < choices; index++) {
        chosen[index] = Math.floor((
            chosen[index - 1] + paletteLength * 0.3) % paletteLength);
    }

    let weighting = paletteLength / 2;
    const weights = [];
    for (const choice of chosen) {
        const codePoint = palette.codePoints[choice];
        weights.push({
            "codePoint":codePoint,
            "text": String.fromCodePoint(codePoint),
            "weight":weighting
        });
        set_weight(codePoint, weighting);
        weighting /= 2;
    }
    // console.log(`predictor test "${text}"`, weights);

    return;
}
