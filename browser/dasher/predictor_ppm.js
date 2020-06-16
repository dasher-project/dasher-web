// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// Copyright 2020 Google LLC
// MIT licensed, see https://opensource.org/licenses/MIT

/*

Basic predictor based on Prediction by Partial Matching (PPM) algorithm provided
by `jslm` library.

*/

alert("Module is evaluated!");

import {Vocabulary} from './third_party/jslm/vocabulary.js'
import PPMLanguageModel from './third_party/jslm/ppm_language_model.js'

/*
  Very small training text from Enron Mobile dataset used for bootstrapping the
  PPM model.
*/
const trainingText = `
Have a good evening. Are you going to join us for lunch?
OK to make changes, change out original. This looks fine. See you next week.
Thanks I needed that today! I'm looking forward to the long weekend!
Nice weather for it. Hi. How is it going? I better go. Hope all is well.
Best of luck and stay in touch. Just got this. Things are OK. Are you there?
Please coordinate with him. I think I'm OK. Nothing from Mom. I'm still here.
See you soon. See you later. Will you come get me? I am on my way. hi rob.
I'm going to sleep. Still waiting on decision. Are you sure? I am all over it.
Will follow up today. Nothing but good news everyday. please call. agreed.
i want to thank everyone involved
`;

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
