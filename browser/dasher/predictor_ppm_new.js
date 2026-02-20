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

import { createPredictor } from '@willwade/ppmpredictor';

// Training texts from Gutenberg (same as original predictor_ppm.js)
import {bufferAlice} from './third_party/gutenberg/alice.js'
import {bufferSherlockHolmes} from './third_party/gutenberg/sherlock.js'

const staticTrainingText = bufferAlice + bufferSherlockHolmes;

// Configuration options
const config = {
  maxOrder: 5,              // Maximum context length for PPM
  maxPredictions: 50,       // Maximum predictions to return (for full alphabet)
  adaptive: false,          // Don't update model as user types (for performance)
  lexicon: [],              // No lexicon by default (can be added via updateConfig)
  errorTolerant: false,     // Strict mode by default
  caseSensitive: false      // Case-insensitive matching
};

// Create the predictor instance
let predictor = null;
let isInitialized = false;
let initializationPromise = null;
let learningEnabled = false;
let learnedText = "";

// Simple training text for fast initial startup
const quickTrainingText = "The quick brown fox jumps over the lazy dog. " +
  "Hello world. How are you today? I am fine thank you. " +
  "This is a test. The cat sat on the mat. " +
  "A B C D E F G H I J K L M N O P Q R S T U V W X Y Z. " +
  "the and for are but not you all any can had has him his how man new now old see two way who boy did its let put say she too use dad mom car dog eat fun get go good hi hot job key law lay lie low mad off out own pay red run set sit top try win yes ";

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
    console.log("Initializing @willwade/ppmpredictor (fast mode)...");

    predictor = createPredictor(config);

    // Fast initial training with common text
    predictor.train(quickTrainingText);

    isInitialized = true;
    console.log("@willwade/ppmpredictor ready (background training in progress...");

    // Train on full corpus in background without blocking UI
    setTimeout(() => {
      console.log("Background training on Alice in Wonderland...");
      predictor.train(bufferAlice);
      console.log("Background training on Sherlock Holmes...");
      predictor.train(bufferSherlockHolmes);
      console.log("Background training complete.");
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
  codePoints, text, predictorData, palette, set_weight
) {
  // Initialize on first use (fast, non-blocking)
  await initialize();

  const currentText = (typeof text === "string" ? text : "");

  // Learn only the newly appended text while learning mode is enabled.
  if (learningEnabled) {
    if (currentText.startsWith(learnedText)) {
      const appended = currentText.slice(learnedText.length);
      if (appended.length > 0) {
        predictor.train(appended);
      }
      learnedText = currentText;
    }
    else {
      learnedText = currentText;
    }
  }
  else {
    learnedText = currentText;
  }

  // Reset context and set current message as context
  predictor.resetContext();
  if (currentText.length > 0) {
    predictor.addToContext(currentText, false);
  }

  // Get character predictions from PPM model
  const predictions = predictor.predictNextCharacter();

  // Get set of all valid codepoints from palette
  const validCodePoints = new Set(palette.codePoints);

  // Set weights for predicted characters
  // Use gentler scaling for smoother zooming
  for (const prediction of predictions) {
    const char = prediction.text;
    const codePoint = char.codePointAt(0);

    // Only set weights for characters in the palette
    if (validCodePoints.has(codePoint)) {
      // Convert probability (0-1) to weight
      // Use gentler scaling (10 instead of 100) for smoother transitions
      const weight = Math.max(1, Math.round(1 + prediction.probability * 10));
      set_weight(codePoint, weight, null);
    }
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
    predictor = createPredictor(config);

    // Quick initial training
    predictor.train(quickTrainingText);
    isInitialized = true;

    // Train on full corpus in background
    setTimeout(() => {
      predictor.train(bufferAlice);
      predictor.train(bufferSherlockHolmes);
      // Train on additional text if provided
      if (otherText && otherText.length > 0) {
        predictor.train(otherText);
      }
    }, 100);
  }

  learnedText = "";
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
    learnedText = "";
  }
}

export function ppmNewGetLearningEnabled() {
  return learningEnabled;
}
