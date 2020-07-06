// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// Copyright 2020 Google LLC
// MIT licensed, see https://opensource.org/licenses/MIT

/*

Basic predictor based on Prediction by Partial Matching (PPM) algorithm provided
by `jslm` library.

*/

import {bufferAlice} from './third_party/gutenberg/alice.js'
import {bufferSherlockHolmes} from './third_party/gutenberg/sherlock.js'
import PPMLanguageModel from './third_party/jslm/ppm_language_model.js'
import {Vocabulary} from './third_party/jslm/vocabulary.js'

// Simple priors on the symbols are computed using text corpora files stored as
// strings under `third_party/gutenberg` directory.
const trainingText = bufferAlice + bufferSherlockHolmes;

// Computes vocabulary from the supplied palette and the short training text
// above.
let vocab = null;

function initVocabulary(palette) {
    console.log("Initializing vocabulary ...");
    vocab = new Vocabulary();
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
    return vocab;
}

//
// Boostraps PPM model using training text.
//

let model = null;
const modelMaxOrder = 5;  // History length.

function bootstrapModel(vocab) {
    console.log("Initializing LM ...");
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
	cands.push({ symbol: symbol, prob: best_prob });
    }
    return cands;
}

// Same as above, but prepares the array for fancy debug output.
function debugTopCandidates(probs, top_n) {
    const cands = topCandidates(probs, top_n);
    let debugCands = [];
    for (let i = 0; i < top_n; ++i) {
	const cand_buf = "'" + cands[i].symbol + "' (" + cands[i].prob + ")";
	debugCands.push(cand_buf);
    }
    return debugCands;
}

//
// Actual prediction interface:
//
// Current context specifies the context in which the prediction is to happen,
// i.e. the history.
const verbose = true;
const numBest = 5;  // Number of best candidates to display in verbose mode.

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
    }

    let context = model.createContext();
    for (let i = 0; i < codePoints.length; ++i) {
	const symbol = codePoints.toString();
	model.addSymbolToContext(context, vocab.symbols_.indexOf(symbol));

    }
    const currentProbs = model.getProbs(context);
    if (verbose) {
	let contextText = "";
	if (text.length > 0) {
	    contextText = text.slice(-modelMaxOrder);
	}
	console.log("[" + contextText + "]: " +
		    debugTopCandidates(currentProbs, numBest));
    }

    // Update the probabilities for the universe of symbols (as defined by vocab
    // that follow current context), e.g. provide:
    //
    //   P(c_i|c_{i-n},...,c_{i-1}), c \in C, where $n$ is the model order and
    //   C is the alphabet.
    const numVocabSymbols = currentProbs.length - 1;
    for (let i = 1; i < numVocabSymbols; ++i) {
	const codepoint = Number(vocab.symbols_[i]);
	set_weight(codepoint, currentProbs[i] * numVocabSymbols, null);
    }
}
