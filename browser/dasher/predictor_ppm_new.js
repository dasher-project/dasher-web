// (c) 2025 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

/*
Dasher predictor adapter for @willwade/ppmpredictor.

This predictor uses the @willwade/ppmpredictor package which provides:
- Character-level prediction using PPM (Prediction by Partial Matching)
- Word completion with lexicon support
- Next word prediction using bigrams
- Error-tolerant mode with fuzzy matching
- Multi-corpus support for domain-specific vocabularies

The package is based on Google Research's JavaScript PPM implementation.
*/

// Training texts from Gutenberg (same as original predictor_ppm.js)
import {bufferAlice} from './third_party/gutenberg/alice.js';
import {bufferSherlockHolmes} from './third_party/gutenberg/sherlock.js';

// Configuration options
const config = {
  maxOrder: 5, // Maximum context length for PPM
  maxPredictions: 50, // Maximum predictions to return (for full alphabet)
  adaptive: false, // Don't update model as user types (for performance)
  lexicon: [], // No lexicon by default (can be added via updateConfig)
  errorTolerant: false, // Strict mode by default
  caseSensitive: false, // Case-insensitive matching
};
const characterWeightRange = 90;
const wordCompletionBoost = 1.8;
const nextWordBoost = 1.2;

// Create the predictor instance
let predictor = null;
let isInitialized = false;
let initializationPromise = null;
let learningEnabled = false;
let learnedText = '';
let createPredictorFunction = null;
let predictorModuleLoadAttempted = false;
const gutenbergStartMarker = /\*\*\*\s*START OF THIS PROJECT GUTENBERG EBOOK[\s\S]*?\*\*\*/i;
const gutenbergEndMarker = /\*\*\*\s*END OF THIS PROJECT GUTENBERG EBOOK[\s\S]*?\*\*\*/i;

// Simple training text for fast initial startup
const quickTrainingText = 'The quick brown fox jumps over the lazy dog. ' +
  'Hello world. How are you today? I am fine thank you. ' +
  'This is a test. The cat sat on the mat. ' +
  'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z. ' +
  'the and for are but not you all any can had has him his how man new now old see two way who boy did its let put say she too use dad mom car dog eat fun get go good hi hot job key law lay lie low mad off out own pay red run set sit top try win yes ';

function sanitiseTrainingText(text) {
  const source = typeof text === 'string' ? text : '';
  const startMatch = source.match(gutenbergStartMarker);

  let body = source;
  if (startMatch !== null) {
    body = body.slice(startMatch.index + startMatch[0].length);
  }
  const endMatch = body.match(gutenbergEndMarker);
  if (endMatch !== null) {
    body = body.slice(0, endMatch.index);
  }

  return body
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
}

const aliceTrainingText = sanitiseTrainingText(bufferAlice);
const sherlockTrainingText = sanitiseTrainingText(bufferSherlockHolmes);

function splitWordContext(text) {
  const source = typeof text === 'string' ? text : '';
  const trailingWhitespace = /\s$/u.test(source);
  const trimmedRight = source.trimEnd();
  const lastWordMatch = trimmedRight.match(/([\p{L}\p{N}'-]+)\s*$/u);
  const lastWord = lastWordMatch ? lastWordMatch[1] : '';
  const partialWordMatch = source.match(/([\p{L}\p{N}'-]+)$/u);
  const partialWord = partialWordMatch ? partialWordMatch[1] : '';

  if (trailingWhitespace || partialWord.length === 0) {
    return {
      atWordBoundary: true,
      partialWord: '',
      precedingContext: source,
      lastWord: lastWord,
    };
  }

  const partialWordIndex = (partialWordMatch.index === undefined ?
    source.length - partialWord.length : partialWordMatch.index);
  const precedingContext = source.slice(0, partialWordIndex);
  return {
    atWordBoundary: false,
    partialWord,
    precedingContext,
    lastWord: lastWord,
  };
}

/**
 * Initialize the predictor with training data.
 * Uses fast initialization with minimal training, then trains on full corpus in background.
 */
async function initialize() {
  if (isInitialized) {
    return;
  }
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    console.log('Initializing @willwade/ppmpredictor (fast mode)...');

    if (!predictorModuleLoadAttempted) {
      predictorModuleLoadAttempted = true;
      try {
        const ppmPredictor = await import('@willwade/ppmpredictor');
        createPredictorFunction = ppmPredictor.createPredictor;
      } catch (error) {
        console.warn(
            '@willwade/ppmpredictor unavailable, using fallback predictor.',
            error,
        );
      }
    }

    if (!createPredictorFunction) {
      isInitialized = true;
      return null;
    }

    predictor = createPredictorFunction(config);

    // Fast initial training with common text
    predictor.train(quickTrainingText);

    isInitialized = true;
    console.log('@willwade/ppmpredictor ready (background training in progress)...');

    // Train on full corpus in background without blocking UI
    setTimeout(() => {
      console.log('Background training on Alice in Wonderland...');
      predictor.train(aliceTrainingText);
      console.log('Background training on Sherlock Holmes...');
      predictor.train(sherlockTrainingText);
      console.log('Background training complete.');
    }, 100);

    return predictor;
  })();

  return initializationPromise;
}

/**
 * Dasher predictor function using @willwade/ppmpredictor.
 *
 * @param {Array<number>} codePoints - Unicode code points of current message
 * @param {string} text - Current message text
 * @param {*} predictorData - User data from previous prediction
 * @param {Palette} palette - Current palette (contains available characters)
 * @param {Function} set_weight - Callback to set weight for a character
 */
export default async function predictor_ppm_new(
    codePoints, text, predictorData, palette, set_weight,
) {
  // Initialize on first use (fast, non-blocking)
  await initialize();

  if (!predictor) {
    return;
  }

  const currentText = (typeof text === 'string' ? text : '');

  // Learn only the newly appended text while learning mode is enabled.
  if (learningEnabled) {
    if (currentText.startsWith(learnedText)) {
      const appended = currentText.slice(learnedText.length);
      if (appended.length > 0) {
        predictor.train(appended);
      }
      learnedText = currentText;
    } else {
      learnedText = currentText;
    }
  } else {
    learnedText = currentText;
  }

  // Reset context and set current message as context
  predictor.resetContext();
  if (currentText.length > 0) {
    predictor.addToContext(currentText, false);
  }

  // Get character predictions from PPM model
  const predictions = predictor.predictNextCharacter();

  const combinedScores = new Map();
  const addScore = (char, probability, boost = 1) => {
    if (typeof char !== 'string' || char.length === 0) {
      return;
    }
    const score = Math.max(0, probability) * boost;
    if (score <= 0) {
      return;
    }
    const previous = combinedScores.get(char) || 0;
    combinedScores.set(char, previous + score);
  };

  // Base character probabilities.
  for (const prediction of predictions) {
    addScore(prediction.text, prediction.probability, 1);
  }

  // Add word-level hints so the rightward multi-letter chains are clearer.
  const wordContext = splitWordContext(currentText);
  if (!wordContext.atWordBoundary && wordContext.partialWord.length > 0) {
    const completions = predictor.predictWordCompletion(
        wordContext.partialWord,
        wordContext.precedingContext,
    );
    for (const completion of completions) {
      if (
        typeof completion.text === 'string' &&
        completion.text.startsWith(wordContext.partialWord) &&
        completion.text.length > wordContext.partialWord.length
      ) {
        const nextChar = completion.text[wordContext.partialWord.length];
        addScore(nextChar, completion.probability, wordCompletionBoost);
      }
    }
  } else if (wordContext.lastWord.length > 0) {
    const nextWords = predictor.predictNextWord(wordContext.lastWord, 10);
    for (const prediction of nextWords) {
      if (typeof prediction.text === 'string' && prediction.text.length > 0) {
        addScore(prediction.text[0], prediction.probability, nextWordBoost);
      }
    }
  }

  // Get set of all valid codepoints from palette.
  const validCodePoints = new Set(palette.codePoints);
  let maxScore = 0;
  for (const [char, score] of combinedScores.entries()) {
    const codePoint = char.codePointAt(0);
    if (validCodePoints.has(codePoint) && score > maxScore) {
      maxScore = score;
    }
  }

  if (maxScore <= 0) {
    return;
  }

  // Apply a non-linear mapping to widen contrast between high/low candidates.
  for (const [char, score] of combinedScores.entries()) {
    const codePoint = char.codePointAt(0);
    if (!validCodePoints.has(codePoint)) {
      continue;
    }
    const normalised = Math.min(1, score / maxScore);
    const weight = 1 + Math.round(Math.pow(normalised, 0.7) * characterWeightRange);
    set_weight(codePoint, weight, null);
  }

  // Note: Unpredicted characters get implicit weight of 1 from Dasher
}

/**
 * Reset and retrain the model.
 * Can be called if you want to reload the predictor with new settings.
 *
 * @param {Palette} palette - Current palette
 * @param {string} otherText - Additional training text
 */
export function ppmNewReset(palette, otherText) {
  isInitialized = false;
  initializationPromise = null;

  if (predictor) {
    predictor = createPredictorFunction(config);

    // Quick initial training
    predictor.train(quickTrainingText);
    isInitialized = true;

    // Train on full corpus in background
    setTimeout(() => {
      predictor.train(aliceTrainingText);
      predictor.train(sherlockTrainingText);
      // Train on additional text if provided
      if (otherText && otherText.length > 0) {
        predictor.train(otherText);
      }
    }, 100);
  }

  learnedText = '';
}

/**
 * Get the underlying predictor instance for advanced usage.
 *
 * @example
 * import { ppmNewGetPredictor } from './predictor_ppm_new.js';
 * const p = ppmNewGetPredictor();
 *
 * // Add domain-specific corpus
 * p.addTrainingCorpus('medical', medicalText, {
 *   description: 'Medical terminology',
 *   lexicon: medicalWords
 * });
 *
 * // Use medical corpus
 * p.useCorpora(['medical', 'default']);
 *
 * // Enable error-tolerant mode
 * p.updateConfig({ errorTolerant: true, maxEditDistance: 2 });
 */
export function ppmNewGetPredictor() {
  if (!isInitialized) {
    initialize();
  }
  return predictor;
}

export async function ppmNewGetPredictorAsync() {
  await initialize();
  return predictor;
}

/**
 * Update the predictor configuration.
 *
 * @param {Object} newConfig - Configuration options to update
 *
 * @example
 * import { ppmNewUpdateConfig } from './predictor_ppm_new.js';
 *
 * // Add a lexicon for better word completion
 * ppmNewUpdateConfig({
 *   lexicon: ['hello', 'world', 'help', 'held']
 * });
 *
 * // Enable error-tolerant mode
 * ppmNewUpdateConfig({
 *   errorTolerant: true,
 *   maxEditDistance: 2
 * });
 */
export function ppmNewUpdateConfig(newConfig) {
  if (!isInitialized) {
    initialize();
  }

  if (predictor) {
    predictor.updateConfig(newConfig);
  }
}

/**
 * Add a training corpus for domain-specific predictions.
 *
 * @param {string} corpusKey - Unique identifier for the corpus
 * @param {string} text - Training text
 * @param {Object} options - Options including description and lexicon
 *
 * @example
 * import { ppmNewAddCorpus } from './predictor_ppm_new.js';
 *
 * ppmNewAddCorpus('medical', medicalText, {
 *   description: 'Medical terminology',
 *   lexicon: ['prescription', 'diagnosis', 'treatment']
 * });
 *
 * // Then use the corpus
 * const p = ppmNewGetPredictor();
 * p.useCorpora(['medical', 'default']);
 */
export function ppmNewAddCorpus(corpusKey, text, options = {}) {
  if (!isInitialized) {
    initialize();
  }

  if (predictor) {
    predictor.addTrainingCorpus(corpusKey, text, options);
  }
}

export function ppmNewSetLearningEnabled(enabled) {
  learningEnabled = !!enabled;
  if (!learningEnabled) {
    learnedText = '';
  }
}

export function ppmNewGetLearningEnabled() {
  return learningEnabled;
}
