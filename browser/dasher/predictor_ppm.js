// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// Copyright 2020 Google LLC
// MIT licensed, see https://opensource.org/licenses/MIT

//
// Basic predictor based on Prediction by Partial Matching (PPM)
// algorithm provided by `jslm` library. Unlike other predictor
// implementations, this predictor exports two APIs:
//
//   - The actual predictor API similar to the other implementations
//     (in `ppmModelPredict`),
//   - Function for resetting and retraining the model from the static
//     data and additional text supplied by the caller
//     (`ppmModelReset`).
//
// TODO(agutkin):
//   - Expose PPM-C configuration: In particular, exposing the following will
//     be useful:
//
//       o Smoothing parameters $\alpha$ and $\beta$.
//       o Exclusion mechanism.
//
//     While $\alpha$ and $\beta$ values have been specifically tuned by the
//     original Dasher authors for the AAC scenario and probably do not require
//     further tuning, the exclusion mechanism still needs to be evaluated in
//     this version of Dasher (what we do know is that exclusion mechanism works
//     well for large training sets).
//   - Make maximum model order configurable (currently it is hardcoded to 5).
//   - Verbosity (``debugging'' mode).

import {bufferAlice} from './third_party/gutenberg/alice.js'
import {bufferSherlockHolmes} from './third_party/gutenberg/sherlock.js'
import PPMLanguageModel from './third_party/jslm/ppm_language_model.js'
import {Vocabulary} from './third_party/jslm/vocabulary.js'

// Simple priors on the symbols are computed using text corpora files stored as
// strings under `third_party/gutenberg` directory.
const staticTrainingText = bufferAlice + bufferSherlockHolmes;

// Computes vocabulary from the supplied palette and the short
// training text above. Also precomputes helper dictionaries so that
// we don't have to convert between (integer) codepoints and (integer)
// vocabulary IDs back and forth.
let vocab = null;
let codepointToVocabId = {};

function initVocabulary(palette) {
    console.log("Initializing vocabulary ...");
    vocab = new Vocabulary();
    let paletteCodePoints = palette.codePoints;
    for (let i = 0; i < staticTrainingText.length; ++i) {
	const codepoint = staticTrainingText.codePointAt(i);
	if (paletteCodePoints.includes(codepoint)) {
	    const symbol = codepoint.toString();
	    const vocab_id = vocab.addSymbol(symbol);
	    if (!(codepoint in codepointToVocabId)) {
		codepointToVocabId[codepoint] = vocab_id;
	    }
	}
    }
    for (let i = 0; i < paletteCodePoints.length; ++i) {
	const codepoint = paletteCodePoints[i];
	const symbol = codepoint.toString();
	const vocab_id = vocab.addSymbol(symbol);
	if (!(codepoint in codepointToVocabId)) {
	    codepointToVocabId[codepoint] = vocab_id;
	}
    }
    console.log("Added " + vocab.size() + " symbols.");
    return vocab;
}

//
// Boostraps PPM model from vocabulary and the supplied text.
//

let model = null;
const modelMaxOrder = 5;  // History length.

function updateModelFromText(model, vocab, trainingText) {
    let context = model.createContext();
    let numSymbols = 0;
    let numSkipped = 0;
    for (let i = 0; i < trainingText.length; ++i) {
	if (trainingText[i] == "\n") {
	    numSkipped++;
	    continue;  // Ignore newlines.
	}
	const codepoint = trainingText.codePointAt(i);
	if (!(codepoint in codepointToVocabId)) {
	    // Skip symbols not in the palette. This is not great because some
	    // of the skipped symbols may be useful for prediction, but it helps
	    // keep the model lean and mean.
	    numSkipped++;
	    continue;
	}
	model.addSymbolAndUpdate(context, codepointToVocabId[codepoint]);
	numSymbols++;
    }
    return { numSkipped: numSkipped, numSymbols: numSymbols };
}

// Boostraps PPM model given the vocabulary `vocab`, static training
// text and any other text (`otherText`) supplied by the caller.
function bootstrapModel(vocab, otherText) {
    console.log("Initializing LM ...");
    let totalNumSymbols = 0;
    let totalNumSkipped = 0;
    model = new PPMLanguageModel(vocab, modelMaxOrder);
    let counts = updateModelFromText(model, vocab, staticTrainingText);
    totalNumSymbols += counts.numSymbols;
    totalNumSkipped += counts.numSkipped;
    if (otherText && otherText.length > 0) {
	counts = updateModelFromText(model, vocab, otherText);
	totalNumSymbols += counts.numSymbols;
	totalNumSkipped += counts.numSkipped;
    }
    console.log("Processed " + totalNumSymbols + " symbols (skipped " +
		totalNumSkipped + ").");
    return model;
}

// Returns top-N (`top_n`) candidate symbols given the probabilities (`probs`).
// This is debugging API only used verbose mode.
function topCandidates(probs, top_n) {
    probs[0] = -1000.0;  // Ignore first element.
    let probsAndPos = probs.map(function(prob, index) {
	return { index: index, prob: prob };
    });
    probsAndPos.sort(function(a, b) {
	// Note: By default the sort function will treat elements as strings.
	// Following will explicitly treat them as floating point numbers.
	return b.prob - a.prob;
    });
    let cands = [];
    for (let i = 0; i < top_n; ++i) {
	const bestIndex = probsAndPos[i].index;
	const bestProb = probsAndPos[i].prob;
	const symbol = String.fromCodePoint(Number(vocab.symbols_[bestIndex]));
	cands.push({ symbol: symbol, prob: bestProb });
    }
    return cands;
}

// Same as above, but prepares the array for fancy debug output.
function debugTopCandidates(probs, top_n) {
    const cands = topCandidates(probs, top_n);
    let debugCands = [];
    for (let i = 0; i < top_n; ++i) {
	const candBuf = "'" + cands[i].symbol + "' (" + cands[i].prob + ")";
	debugCands.push(candBuf);
    }
    return debugCands;
}

// Given a text prints its most $n$ likely continuations in generative mode.
function generateText(seedText, maxLength, topN) {
    let context = model.createContext();
    for (let i = 0; i < seedText.length; ++i) {
	const codepoint = seedText.codePointAt(i);
	model.addSymbolToContext(context, codepointToVocabId[codepoint]);
    }
    let text = seedText;
    for (let i = 0; i < maxLength; ++i) {
	const probs = model.getProbs(context);
	const cands = topCandidates(probs, topN);
	const randomIndex = Math.floor(Math.random() * topN);
	const bestChar = cands[randomIndex].symbol;
	text += bestChar;
	const codepoint = bestChar.codePointAt(0);
	model.addSymbolToContext(context, codepointToVocabId[codepoint]);
    }
    return text;
}

//
// Actual prediction interface:
//
// Current context specifies the context in which the prediction is to happen,
// i.e. the history.
const verbose = false;  // Set this to `false` to remove verbose logging.
const numBest = 5;  // Number of best candidates to display in verbose mode.

export async function ppmModelPredict(
    codePoints, text, predictorData, palette, set_weight
) {
    console.log(`text: "${text}"`);

    // Check if we're called the first time.
    if (!vocab) {
	// Initialize vocabulary, the model, setup initial (empty) context and
	// compute initial probabilities. Cache this information.
	vocab = initVocabulary(palette);
	model = bootstrapModel(vocab, text);
	if (verbose) {
	    const randomText = generateText(
		/* seedText */"I", /* maxLength */300, /* topN */2);
	    console.log("Random text: \"" + randomText + "\"");
	}
    }

    // Brute-force initialization of the entire length of the context. This is
    // suboptimal because the long history prefix will eventually be ignored. To
    // optimize at a later stage.
    let context = model.createContext();
    for (let i = 0; i < codePoints.length; ++i) {
	const codepoint = codePoints[i];
	model.addSymbolToContext(context, codepointToVocabId[codepoint]);
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
    //
    // TODO(agutkin): Figure out from the calling code what is the total weight
    // mass that we need to redistribute across the palette. In other words, if
    // the weight setting is sparse, allowing weight of unity for the
    // unpredicted symbol, what weights should we set on the high probability
    // symbols. At the moment, the following logic will weight the candidates
    // according to the correct probability mass, which is probably not how the
    // caller is treating the box sizes.
    const numVocabSymbols = currentProbs.length - 1;
    for (let i = 1; i < numVocabSymbols; ++i) {
	const codepoint = Number(vocab.symbols_[i]);
	set_weight(codepoint, currentProbs[i] * numVocabSymbols, null);
    }
}

// Resets the model: reinitializes the vocabulary and retrains the model from
// static text and the text supplied by the caller (`otherText`).
export function ppmModelReset(palette, otherText) {
    vocab = initVocabulary(palette);
    model = bootstrapModel(vocab, otherText);
}
