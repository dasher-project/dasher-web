// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

/*
Predictor subclass that generates deterministic pseudo-random predictions.
*/

import Predictor from './predictor.js'

const paletteLength = Predictor.characters.length;
const maximumChoices = 4;

export default class PredictorTest extends Predictor {
    // Override.
    async get_character_weights(points, text, prediction) {
        const choices = Math.floor(points.reduce(
            (accumulated, point) => (accumulated + point) % maximumChoices, 0
        ));
        if (choices <= 0) {
            return super.get_character_weights(points, text, prediction);
        }
        const chosen = [Math.floor(points.reduce(
            (accumulated, point) => (accumulated + point) % paletteLength,
            paletteLength * 0.15
        ))];
        for(let index = chosen.length; index < choices; index++) {
            chosen[index] = Math.floor((
                chosen[index - 1] + paletteLength * 0.3) % paletteLength);
        }

        const weights = new Map();
        let weighting = paletteLength / 2;
        for (const choice of chosen) {
            weights.set(Predictor.characters[choice], weighting);
            weighting /= 2;
        }
        // console.log(`predictor test "${text}"`, chosen, weights);

        return weights;
    }
}

