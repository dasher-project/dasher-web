// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// Copyright 2020 Google LLC
// MIT licensed, see https://opensource.org/licenses/MIT

/*

Basic predictor based on Prediction by Partial Matching (PPM) algorithm provided
by `jslm` library.

*/

import PPMLanguageModel from './third_party/jslm/ppm_language_model.js'
import {Vocabulary} from './third_party/jslm/vocabulary.js'

//
// Simple priors on the symbols are computed using a very short training text
// assembled from Enron Mobile dataset.
//
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
I want to thank everyone involved. Hey, how are you doing? Sorry about that!
Can you help me here? Can we meet? Are you feeling better? i am trying again.
I will be back Friday. and how would i be going for work. sounds good to me
and how would i be going for work? i have a favor to ask. best of luck and
stay in touch. yes I am here actually. love got it I better go. I'll confirm
nine three six five nine seven three nine zero five two one for your information
I'm fine. will call later to explain. today has been hard for me
I'm glad she likes her tree. Can I meet with you at 4:00? Next time ask Jim to
call me. Is it far? Will you come get me? I am getting lots of questions.
OK thanks. These are big storms and traffic isn't moving. What's up? I'm still
here. Thanks anyway. Not at this time. Will it be delivered? Sounds right.
It will probably be tomorrow. Thanks again for your help. Going well here.
Perhaps there was a glitch. Sorry for the delay. Is it far?
`;

// Computes vocabulary from the supplied palette and the short training text
// above.
let vocab = null

function initVocabulary(palette) {
    console.log("Initializing vocabulary ...")
    vocab = new Vocabulary()
    let paletteCodePoints = palette.codePoints;
    for (let i = 0; i < trainingText.length; ++i) {
	const codepoint = trainingText.codePointAt(i);
	if (paletteCodePoints.includes(codepoint)) {
	    const symbol = codepoint.toString();
	    vocab.addSymbol(symbol);
	}
    }
    for (let i = 0; i < paletteCodePoints.length; ++i) {
	const symbol = paletteCodePoints[i].toString();
	vocab.addSymbol(symbol);
    }
    console.log("Added " + vocab.size() + " symbols.");
    return vocab
}

//
// Boostraps PPM model using training text.
//

let model = null;
const modelMaxOrder = 5;  // History length.

function bootstrapModel(vocab) {
    console.log("Initializing LM ...")
    model = new PPMLanguageModel(vocab, modelMaxOrder);
    let context = model.createContext();
    let numSymbols = 0;
    for (let i = 0; i < trainingText.length; ++i) {
	if (trainingText[i] == "\n") {
	    continue;  // Ignore newlines.
	}
	const symbol = trainingText.codePointAt(i).toString();
	model.addSymbolAndUpdate(context, vocab.symbols_.indexOf(symbol));
	numSymbols++;
    }
    console.log("Processed " + numSymbols + " symbols.");
    return model;
}

// Returns top-N (`top_n`) candidate symbols given the probabilities (`probs`).
// This is debugging API.
function topCandidates(probs, top_n) {
    probs[0] = -1000.0;  // Ignore first element.
    let probs_and_pos = probs.map(function(prob, index) {
	return { index: index, prob: prob };
    });
    probs_and_pos.sort(function(a, b) {
	// Note: By default the sort function will treat elements as strings.
	// Following will explicitly treat them as floating point numbers.
	return b.prob - a.prob;
    });
    let cands = [];
    for (let i = 0; i < top_n; ++i) {
	const best_index = probs_and_pos[i].index;
	const best_prob = probs_and_pos[i].prob;
	const symbol = String.fromCodePoint(Number(vocab.symbols_[best_index]));
	const cand_buf = "\"" + symbol + "\" (" + best_prob + ")";
	cands.push(cand_buf);
    }
    return cands;
}

//
// Actual prediction interface:
//
// Current context specifies the context in which the prediction is to happen,
// i.e. the history.
let predictorContexts = {};
let currentContext = null;
const emptyContextKey = "<EMPTY>";

export default async function (
    codePoints, text, predictorData, palette, set_weight
) {
    console.log(`text: "${text}"`);

    // Check if we're called the first time.
    if (!vocab) {
	// Initialize vocabulary, the model, setup initial (empty) context and
	// compute initial probabilities. Cache this information.
	vocab = initVocabulary(palette);
	model = bootstrapModel(vocab);
	currentContext = model.createContext();
	const currentProbs = model.getProbs(currentContext);
	predictorContexts[emptyContextKey] = currentProbs;
    }

    // Fetch the last symbol in history and construct a silly context key. It is
    // very silly because we rely on the entire history of the input for
    // construction. Should fix this later.
    let contextKey = emptyContextKey;
    if (codePoints.length > 0) {
	const historyCodepoints = codePoints.slice(-modelMaxOrder);
	contextKey = historyCodepoints.join("");
    }

    // Check whether the context needs to be updated.
    let currentProbs = null;
    if (!(contextKey in predictorContexts)) {
	// Rebuild current context.
	//
	// We currently don't update the model, instead we simply update the
	// context (view).
	const historyCodepoints = codePoints.slice(-modelMaxOrder);
	currentContext = model.createContext();
	for (let i = 0; i < historyCodepoints.length; ++i) {
	    const symbol = historyCodepoints.toString();
	    model.addSymbolToContext(currentContext,
				     vocab.symbols_.indexOf(symbol));
	}
	currentProbs = model.getProbs(currentContext);
	predictorContexts[contextKey] = [...currentProbs];
	currentContext = null;
    } else {
	// We already have this context. Fetch the probabilities to avoid
	// recomputing them.
	currentProbs = predictorContexts[contextKey];
    }

    // Update the probabilities for the universe of symbols (as defined by vocab
    // that follow current context), e.g. provide:
    //
    //   P(c_i|c_{i-n},...,c_{i-1}), c \in C, where $n$ is the model order and
    //   C is the alphabet.
    const numVocabSymbols = currentProbs.length - 1;
    for (let i = 1; i < numVocabSymbols; ++i) {
	const codepoint = Number(vocab.symbols_[i]);
	set_weight(codepoint, currentProbs[i] * numVocabSymbols,
		   currentContext);
    }
}
