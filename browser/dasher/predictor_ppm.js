// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// Copyright 2020 Google LLC
// MIT licensed, see https://opensource.org/licenses/MIT

/*

Basic predictor based on Prediction by Partial Matching (PPM) algorithm provided
by `jslm` library.

*/

import PPMLanguageModel from './third_party/jslm/ppm_language_model.js'
import {Vocabulary} from './third_party/jslm/vocabulary.js'

/*
  Initialize the vocabulary from the fixed alphabet.
*/
let vocab = new Vocabulary()

const firstPoint = "a".codePointAt(0);
const lastPoint = "z".codePointAt(0);

const weightPoints = [];
let letterSymbols = new Set();
let lower = true;
for (let codePoint = firstPoint; codePoint <= lastPoint; codePoint++) {
    let str = String.fromCodePoint(codePoint);
    str = lower ? str.toLowerCase() : str.toUpperCase();
    let codepoint = str.codePointAt(0);
    let letterSymbol = codepoint.toString();
    vocab.addSymbol(letterSymbol);
    letterSymbols.add(letterSymbol);
    weightPoints.push(codepoint);
    lower = !lower;
}

/*
  Now get some very simple priors on the symbols using a very short training
  text assembled from Enron Mobile dataset.
*/
const trainingText = `
Have a good evening. Are you going to join us for lunch?
OK to make changes, change out original. This looks fine. See you next week.
Thanks I needed that today! I'm looking forward to the long weekend! I like it.
Nice weather for it. Hi. How is it going? I better go. Hope all is well.
Best of luck and stay in touch. Just got this. Things are OK. Are you there?
Please coordinate with him. I think I'm OK. Nothing from Mom. I'm still here.
See you soon. See you later. Will you come get me? I am on my way. hi rob.
I'm going to sleep. Still waiting on decision. Are you sure? I am all over it.
Will follow up today. Nothing but good news everyday. please call. agreed.
i want to thank everyone involved. Hey, how are you doing? Sorry about that!
Can you help me here? Can we meet? Are you feeling better?
I will be back Friday.
`;

for (let i = 0; i < trainingText.length; ++i) {
    const symbol = trainingText.codePointAt(i).toString();
    if (letterSymbols.has(symbol)) {
	vocab.addSymbol(symbol);
    }
}

/*
  Boostrap PPM model using training text.
*/
const maxOrder = 4;  // Model order (length of the history).
let model = new PPMLanguageModel(vocab, maxOrder);
let context = model.createContext()
for (let i = 0; i < trainingText.length; ++i) {
    const symbol = trainingText.codePointAt(i).toString();
    if (letterSymbols.has(symbol)) {
	model.addSymbolAndUpdate(context, vocab.symbols_.indexOf(symbol))
    }
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
