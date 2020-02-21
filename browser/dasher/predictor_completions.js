// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

/*
Predictor subclass that can be interfaced with the native UITextChecker via a
bridge to Captive Web View for iOS.
*/

const codePointSpace = " ".codePointAt(0);

import Predictor from './predictor.js'

export default class PredictorCompletions extends Predictor {

     constructor(bridge_send) {
         super();
         this._bridge_send = bridge_send;
     }

    // Override.
    async get_character_weights(points, text, prediction) {

        let response = await this._bridge_send({
            "command": "predict", "input" : text === undefined ? "" : text
        });

        // Following is nice if you want to see what the native predictor
        // returned, in the JS console.
        // console.log(text, response);

        if (
            response.replacements === undefined ||
            response.replacements.length <= 0
        ) {
            // No suggested replacements, fall back to the base predictor.
            return super.get_character_weights(points, text, prediction);
        }

        // In the response:
        //
        // -   `replacedLength` is the number of characters at the end of the
        //     input that were parsed as a word that could be incomplete.
        // -   `replacements` is an array of possible replacements in order of
        //     likelihood with the most likely first.

        const suffix = response.replacedLength;

        // Next set of variables should be changed to user preferences so that
        // they can be tuned.
        //
        // Weight to be assigned to the most likely replacement.
        const mostWeight = 15;
        //
        // Subsequent replacements will have their weight decremented. This is
        // zero now because the decrementing seems like it wouldn't add much.
        const weightDecrement = 0;
        //
        // Only the `heed` most likely replacements are considered.
        const heed = 5;

        const weights = new Map();
        let weight = mostWeight;
        for (const [index, replacement] of response.replacements.entries()) {
            if (index >= heed) {
                break;
            }
            const point = (
                replacement.length <= suffix ?
                codePointSpace :
                replacement.codePointAt(suffix)
            );
            const weighting = weights.get(point);
            if (weighting === undefined) {
                weights.set(point, weight);
            }
            weight -= weightDecrement;
            if (weight <= 0) {
                console.log("Weight exhausted", points, text, prediction);
                break;
            }
        }

        // Following is nice if you want to see the weights Map, in the JS
        // console.
        // console.log(weights);

        return weights;
    }

}
