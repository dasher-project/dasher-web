function assert(condition, message) {
          if (!condition) {
            throw new Error(message || 'Assertion failed');
          }
        }

// Copyright 2025 The Google Research Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Simple vocabulary abstraction.
 *
 * This is used to store symbols and map them to contiguous integers.
 */

// Special symbol denoting the root node.
const rootSymbol = 0;

// Symbol name of the root symbol, also used for out-of-vocabulary symbols.
const rootSymbolName = '<R>';

// The special out-of-vocabulary (OOV) symbol.
const oovSymbol = '<OOV>';

/**
 * Vocabulary of symbols, which is a set of symbols that map one-to-one to
 * unique integers.
 * @final
 */
class Vocabulary {
  constructor() {
    this.symbols_ = [];
    this.symbols_.push(rootSymbolName);
    this.symbolToId_ = new Map();
    this.symbolToId_.set(rootSymbolName, 0);
    this.oovSymbol_ = -1;
  }

  /**
   * Adds symbol to the vocabulary returning its unique ID.
   * @param {string} symbol Symbol to be added.
   * @return {number} Symbol ID.
   * @final
   */
  addSymbol(symbol) {
    if (this.symbolToId_.has(symbol)) {
      return this.symbolToId_.get(symbol);
    }
    // The current symbol container length is used as a unique ID. Because
    // the symbol IDs are used to index the array directly, the symbol ID is
    // assigned before updating the array.
    const symbol_id = this.symbols_.length;
    this.symbols_.push(symbol);
    this.symbolToId_.set(symbol, symbol_id);
    return symbol_id;
  }

  /**
   * Returns the symbol ID if it exists, otherwise -1.
   * @param {string} symbol Symbol to be looked up.
   * @return {number} Symbol ID or -1 if missing.
   * @final
   */
  getSymbol(symbol) {
    return this.symbolToId_.has(symbol) ? this.symbolToId_.get(symbol) : -1;
  }

  /**
   * Returns the vocabulary symbol ID if it exists, otherwise maps the supplied
   * symbol to out-of-vocabulary (OOV) symbol. Note, this method is *only* used
   * for testing.
   * @param {string} symbol Symbol to be looked up.
   * @return {number} Symbol ID.
   * @final
   */
  getSymbolOrOOV(symbol) {
    if (this.symbolToId_.has(symbol)) {
      return this.symbolToId_.get(symbol);
    }
    this.oovSymbol_ = this.addSymbol(oovSymbol);
    return this.oovSymbol_;
  }

  /**
   * Returns cardinality of the vocabulary.
   * @return {number} Size.
   * @final
   */
  size() {
    return this.symbols_.length;
  }
}

// Copyright 2025 The Google Research Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


/**
 * Kneser-Ney "-like" smoothing parameters.
 *
 * These hardcoded values are copied from Dasher. Please see the documentation
 * for PPMLanguageModel.getProbs() below for more information.
 */
const defaultKnAlpha = 0.49;
const defaultKnBeta = 0.77;

/* Epsilon for sanity checks. */
const epsilon = 1E-10;

/**
 * Node in a search tree, which is implemented as a suffix trie that represents
 * every suffix of a sequence used during its construction. Please see
 *   [1] Moffat, Alistair (1990): "Implementing the PPM data compression
 *       scheme", IEEE Transactions on Communications, vol. 38, no. 11, pp.
 *       1917--1921.
 *   [2] Esko Ukknonen (1995): "On-line construction of suffix trees",
 *       Algorithmica, volume 14, pp. 249--260, Springer, 1995.
 *   [3] Kennington, C. (2011): "Application of Suffix Trees as an
 *       Implementation Technique for Varied-Length N-gram Language Models",
 *       MSc. Thesis, Saarland University.
 *
 * @final
 */
class Node {
  constructor() {
    // Leftmost child node for the current node.
    this.child_ = null;
    // Next node.
    this.next_ = null;
    // Node in the backoff structure, also known as "vine" structure (see [1]
    // above) and "suffix link" (see [2] above). The backoff for the given node
    // points at the node representing the shorter context. For example, if the
    // current node in the trie represents string "AA" (corresponding to the
    // branch "[R] -> [A] -> [*A*]" in the trie, where [R] stands for root),
    // then its backoff points at the node "A" (represented by "[R] ->
    // [*A*]"). In this case both nodes are in the same branch but they don't
    // need to be. For example, for the node "B" in the trie path for the string
    // "AB" ("[R] -> [A] -> [*B*]") the backoff points at the child node of a
    // different path "[R] -> [*B*]".
    this.backoff_ = null;
    // Frequency count for this node. Number of times the suffix symbol stored
    // in this node was observed.
    this.count_ = 1;
    // Symbol that this node stores.
    this.symbol_ = rootSymbol;
  }

  /**
   * Finds child of the current node with a specified symbol.
   * @param {number} symbol Integer symbol.
   * @return {?Node} Node with the symbol.
   * @final
   */
  findChildWithSymbol(symbol) {
    let current = this.child_;
    while (current != null) {
      if (current.symbol_ == symbol) {
        return current;
      }
      current = current.next_;
    }
    return current;
  }

  /**
   * Total number of observations for all the children of this node. This
   * counts all the events observed in this context.
   *
   * Note: This API is used at inference time. A possible alternative that will
   * speed up the inference is to store the number of children in each node as
   * originally proposed by Moffat for PPMB in
   *   Moffat, Alistair (1990): "Implementing the PPM data compression scheme",
   *   IEEE Transactions on Communications, vol. 38, no. 11, pp. 1917--1921.
   * This however will increase the memory use of the algorithm which is already
   * quite substantial.
   *
   * @param {!array} exclusionMask Boolean exclusion mask for all the symbols.
   *                 Can be 'null', in which case no exclusion happens.
   * @return {number} Total number of observations under this node.
   * @final
   */
  totalChildrenCounts(exclusionMask) {
    let childNode = this.child_;
    let count = 0;
    while (childNode != null) {
      if (!exclusionMask || !exclusionMask[childNode.symbol_]) {
        count += childNode.count_;
      }
      childNode = childNode.next_;
    }
    return count;
  }
}

/**
 * Handle encapsulating the search context.
 * @final
 */
class Context {
  /**
   * Constructor.
   * @param {?Node} head Head node of the context.
   * @param {number} order Length of the context.
   */
  constructor(head, order) {
    // Current node.
    this.head_ = head;
    // The order corresponding to length of the context.
    this.order_ = order;
  }
}

/**
 * Prediction by Partial Matching (PPM) Language Model.
 * @final
 */
class PPMLanguageModel {
  /**
   * @param {?Vocabulary} vocab Symbol vocabulary object.
   * @param {number} maxOrder Maximum length of the context.
   * @param {Object=} options Optional PPM parameters.
   * @param {number=} options.alpha Smoothing alpha (default: 0.49).
   * @param {number=} options.beta Smoothing beta (default: 0.77).
   * @param {boolean=} options.useExclusion Enable exclusion at inference time.
   * @param {boolean=} options.updateExclusion Enable "single counting" updates.
   * @param {number=} options.maxNodes Maximum number of trie nodes (0 = unlimited).
   */
  constructor(vocab, maxOrder, options = {}) {
    this.vocab_ = vocab;
    assert(this.vocab_.size() > 1,
      'Expecting at least two symbols in the vocabulary');

    this.maxOrder_ = maxOrder;
    this.root_ = new Node();
    this.rootContext_ = new Context();
    this.rootContext_.head_ = this.root_;
    this.rootContext_.order_ = 0;
    this.numNodes_ = 1;

    this.alpha_ = defaultKnAlpha;
    this.beta_ = defaultKnBeta;
    // Exclusion mechanism: On by default.
    // Mirrors the newer Dasher rewrite behavior.
    // Can be disabled if needed for backwards compatibility.
    this.useExclusion_ = true;
    // Update exclusion (single counting): On by default, mirroring Dasher.
    this.updateExclusion_ = true;
    // Maximum number of nodes in the trie. 0 means unlimited.
    this.maxNodes_ = 0;
    // Track the number of symbols skipped due to the node cap.
    this.skippedNodeAdds_ = 0;

    this.setParameters(options);
  }

  /**
   * Returns runtime statistics useful for monitoring memory pressure.
   * @return {Object} Stats object.
   * @final
   */
  getStats() {
    return {
      numNodes: this.numNodes_,
      maxNodes: this.maxNodes_,
      skippedNodeAdds: this.skippedNodeAdds_
    };
  }

  /**
   * Returns true if adding another node is currently allowed.
   * @return {boolean}
   * @final @private
   */
  canAddNode_() {
    return this.maxNodes_ <= 0 || this.numNodes_ < this.maxNodes_;
  }

  /**
   * Adds symbol to an existing shorter context when node budget is reached.
   * @param {?Node} node Current node.
   * @param {number} symbol Symbol to add.
   * @return {?Node} Added/found node in shorter context.
   * @final @private
   */
  addSymbolWithBudgetFallback_(node, symbol) {
    let backoff = node.backoff_;
    while (backoff != null) {
      const existing = backoff.findChildWithSymbol(symbol);
      if (existing != null) {
        existing.count_++;
        if (!this.updateExclusion_) {
          let vine = existing.backoff_;
          while (vine != null) {
            vine.count_++;
            vine = vine.backoff_;
          }
        }
        this.skippedNodeAdds_++;
        return existing;
      }
      if (this.canAddNode_()) {
        this.skippedNodeAdds_++;
        return this.addSymbolToNode_(backoff, symbol);
      }
      backoff = backoff.backoff_;
    }
    this.skippedNodeAdds_++;
    return null;
  }

  /**
   * Updates PPM parameters.
   * @param {Object} options PPM parameters to update.
   * @final
   */
  setParameters(options = {}) {
    if (options.alpha !== undefined) {
      assert(typeof options.alpha === 'number' && options.alpha >= 0,
        'alpha must be a non-negative number');
      this.alpha_ = options.alpha;
    }
    if (options.beta !== undefined) {
      assert(typeof options.beta === 'number' && options.beta >= 0 && options.beta < 1,
        'beta must be a number in [0, 1)');
      this.beta_ = options.beta;
    }
    if (options.useExclusion !== undefined) {
      assert(typeof options.useExclusion === 'boolean',
        'useExclusion must be boolean');
      this.useExclusion_ = options.useExclusion;
    }
    if (options.updateExclusion !== undefined) {
      assert(typeof options.updateExclusion === 'boolean',
        'updateExclusion must be boolean');
      this.updateExclusion_ = options.updateExclusion;
    }
    if (options.maxNodes !== undefined) {
      assert(Number.isInteger(options.maxNodes) && options.maxNodes >= 0,
        'maxNodes must be a non-negative integer');
      this.maxNodes_ = options.maxNodes;
    }
  }

  /**
   * Adds symbol to the supplied node.
   * @param {?Node} node Tree node which to grow.
   * @param {number} symbol Symbol.
   * @return {?Node} Node with the symbol.
   * @final @private
   */
  addSymbolToNode_(node, symbol) {
    let symbolNode = node.findChildWithSymbol(symbol);
    if (symbolNode != null) {
      // Update the counts for the given node.  Only updates the counts for
      // the highest order already existing node for the symbol ('single
      // counting' or 'update exclusion').
      symbolNode.count_++;
      if (!this.updateExclusion_) {
        // Dasher optional mode: propagate updates up shorter contexts.
        let vine = symbolNode.backoff_;
        while (vine != null) {
          vine.count_++;
          vine = vine.backoff_;
        }
      }
    } else {
      if (!this.canAddNode_()) {
        return this.addSymbolWithBudgetFallback_(node, symbol);
      }
      // Symbol does not exist under the given node. Create a new child node
      // and update the backoff structure for lower contexts.
      symbolNode = new Node();
      symbolNode.symbol_ = symbol;
      symbolNode.next_ = node.child_;
      node.child_ = symbolNode;
      this.numNodes_++;
      if (node == this.root_) {
        // Shortest possible context.
        symbolNode.backoff_ = this.root_;
      } else {
        assert(node.backoff_ != null, 'Expected valid backoff node');
        symbolNode.backoff_ = this.addSymbolToNode_(node.backoff_, symbol);
      }
    }
    return symbolNode;
  }

  /**
   * Creates new context which is initially empty.
   * @return {?Context} Context object.
   * @final
   */
  createContext() {
    return new Context(this.rootContext_.head_, this.rootContext_.order_);
  }

  /**
   * Clones existing context.
   * @param {?Context} context Existing context object.
   * @return {?Context} Cloned context object.
   * @final
   */
  cloneContext(context) {
    return new Context(context.head_, context.order_);
  }

  /**
   * Adds symbol to the supplied context. Does not update the model.
   * @param {?Context} context Context object.
   * @param {number} symbol Integer symbol.
   * @final
   */
  addSymbolToContext(context, symbol) {
    if (symbol <= rootSymbol) { // Only add valid symbols.
      return;
    }
    assert(symbol < this.vocab_.size(), 'Invalid symbol: ' + symbol);
    while (context.head_ != null) {
      if (context.order_ < this.maxOrder_) {
        // Extend the current context.
        const childNode = context.head_.findChildWithSymbol(symbol);
        if (childNode != null) {
          context.head_ = childNode;
          context.order_++;
          return;
        }
      }
      // Try to extend the shorter context.
      context.order_--;
      context.head_ = context.head_.backoff_;
    }
    if (context.head_ == null) {
      context.head_ = this.root_;
      context.order_ = 0;
    }
  }

  /**
   * Adds symbol to the supplied context and updates the model.
   * @param {?Context} context Context object.
   * @param {number} symbol Integer symbol.
   * @final
   */
  addSymbolAndUpdate(context, symbol) {
    if (symbol <= rootSymbol) { // Only add valid symbols.
      return;
    }
    assert(symbol < this.vocab_.size(), 'Invalid symbol: ' + symbol);
    const symbolNode = this.addSymbolToNode_(context.head_, symbol);
    if (symbolNode == null) {
      // Node budget prevented adding this symbol at all.
      this.addSymbolToContext(context, symbol);
      return;
    }
    assert(symbolNode == context.head_.findChildWithSymbol(symbol) ||
      context.head_.findChildWithSymbol(symbol) == null);
    context.head_ = symbolNode;
    context.order_++;
    while (context.order_ > this.maxOrder_) {
      context.head_ = context.head_.backoff_;
      context.order_--;
    }
  }

  /**
   * Returns probabilities for all the symbols in the vocabulary given the
   * context.
   *
   * Notation:
   * ---------
   *         $x_h$ : Context representing history, $x_{h-1}$ shorter context.
   *   $n(w, x_h)$ : Count of symbol $w$ in context $x_h$.
   *      $T(x_h)$ : Total count in context $x_h$.
   *      $q(x_h)$ : Number of symbols with non-zero counts seen in context
   *                 $x_h$, i.e. |{w' : c(x_h, w') > 0}|. Alternatively, this
   *                 represents the number of distinct extensions of history
   *                 $x_h$ in the training data.
   *
   * Standard Kneser-Ney method (aka Absolute Discounting):
   * ------------------------------------------------------
   * Subtracting \beta (in [0, 1)) from all counts.
   *   P_{kn}(w | x_h) = \frac{\max(n(w, x_h) - \beta, 0)}{T(x_h)} +
   *                     \beta * \frac{q(x_h)}{T(x_h)} * P_{kn}(w | x_{h-1}),
   * where the second term in summation represents escaping to lower-order
   * context.
   *
   * See: Ney, Reinhard and Kneser, Hermann (1995): “Improved backing-off for
   * M-gram language modeling”, Proc. of Acoustics, Speech, and Signal
   * Processing (ICASSP), May, pp. 181–184.
   *
   * Modified Kneser-Ney method (Dasher version [3]):
   * ------------------------------------------------
   * Introducing \alpha parameter (in [0, 1)) and estimating as
   *   P_{kn}(w | x_h) = \frac{\max(n(w, x_h) - \beta, 0)}{T(x_h) + \alpha} +
   *                     \frac{\alpha + \beta * q(x_h)}{T(x_h) + \alpha} *
   *                     P_{kn}(w | x_{h-1}) .
   *
   * Additional details on the above version are provided in Sections 3 and 4
   * of:
   *   Steinruecken, Christian and Ghahramani, Zoubin and MacKay, David (2016):
   *   "Improving PPM with dynamic parameter updates", In Proc. Data
   *   Compression Conference (DCC-2015), pp. 193--202, April, Snowbird, UT,
   *   USA. IEEE.
   *
   * @param {?Context} context Context symbols.
   * @return {?array} Array of floating point probabilities corresponding to all
   *                  the symbols in the vocabulary plus the 0th element
   *                  representing the root of the tree that should be ignored.
   * @final
   */
  getProbs(context) {
    // Initialize the initial estimates. Note, we don't use uniform
    // distribution here.
    const numSymbols = this.vocab_.size();
    let probs = new Array(numSymbols);
    for (let i = 0; i < numSymbols; ++i) {
      probs[i] = 0.0;
    }

    // Initialize the exclusion mask.
    let exclusionMask = null;
    if (this.useExclusion_) {
      exclusionMask = new Array(numSymbols);
      for (let i = 0; i < numSymbols; ++i) {
        exclusionMask[i] = false;
      }
    }

    // Estimate the probabilities for all the symbols in the supplied context.
    // This runs over all the symbols in the context and over all the suffixes
    // (orders) of the context. If the exclusion mechanism is enabled, the
    // estimate for a higher-order ngram is fully trusted and is excluded from
    // further interpolation with lower-order estimates.
    //
    // Exclusion mechanism is disabled by default. Enable it with care: it has
    // been shown to work well on large corpora, but may in theory degrade the
    // performance on smaller sets (as we observed with default Dasher English
    // training data).
    let totalMass = 1.0;
    let node = context.head_;
    let gamma = totalMass;
    while (node != null) {
      const count = node.totalChildrenCounts(exclusionMask);
      if (count > 0) {
        let childNode = node.child_;
        while (childNode != null) {
          const symbol = childNode.symbol_;
          if (!exclusionMask || !exclusionMask[symbol]) {
            const p = gamma * (childNode.count_ - this.beta_) /
              (count + this.alpha_);
            probs[symbol] += p;
            totalMass -= p;
            if (exclusionMask) {
              exclusionMask[symbol] = true;
            }
          }
          childNode = childNode.next_;
        }
      }

      // Backoff to lower-order context. The $\gamma$ factor represents the
      // total probability mass after processing the current $n$-th order before
      // backing off to $n-1$-th order. It roughly corresponds to the usual
      // interpolation parameter, as used in the literature, e.g. in
      //   Stanley F. Chen and Joshua Goodman (1999): "An empirical study of
      //   smoothing techniques for language modeling", Computer Speech and
      //   Language, vol. 13, pp. 359-–394.
      //
      // Note on computing $gamma$:
      // --------------------------
      // According to the PPM papers, and in particular the Section 4 of
      //   Steinruecken, Christian and Ghahramani, Zoubin and MacKay,
      //   David (2016): "Improving PPM with dynamic parameter updates", In
      //   Proc. Data Compression Conference (DCC-2015), pp. 193--202, April,
      //   Snowbird, UT, USA. IEEE,
      // that describes blending (i.e. interpolation), the second multiplying
      // factor in the interpolation $\lambda$ for a given suffix node $x_h$ in
      // the tree is given by
      //   \lambda(x_h) = \frac{q(x_h) * \beta + \alpha}{T(x_h) + \alpha} .
      // It can be shown that
      //   \gamma(x_h) = 1.0 - \sum_{w'}
      //      \frac{\max(n(w', x_h) - \beta, 0)}{T(x_h) + \alpha} =
      //      \lambda(x_h)
      // and, in the update below, the following is equivalent:
      //   \gamma = \gamma * \gamma(x_h) = totalMass .
      //
      // Since gamma *= (numChildren * beta + alpha) / (count + alpha) is
      // expensive, we assign the equivalent totalMass value to gamma.
      node = node.backoff_;
      gamma = totalMass;
    }
    assert(totalMass >= 0.0,
      'Invalid remaining probability mass: ' + totalMass);

    // Count the total number of symbols that should have their estimates
    // blended with the uniform distribution representing the zero context.
    // When exclusion mechanism is enabled (by enabling this.useExclusion_)
    // this number will represent the number of symbols not seen during the
    // training, otherwise, this number will be equal to total number of
    // symbols because we always interpolate with the estimates for an empty
    // context.
    let numUnseenSymbols = 0;
    for (let i = 1; i < numSymbols; ++i) {
      if (!exclusionMask || !exclusionMask[i]) {
        numUnseenSymbols++;
      }
    }

    // Adjust the probability mass for all the symbols.
    const remainingMass = totalMass;
    for (let i = 1; i < numSymbols; ++i) {
      // Following is estimated according to a uniform distribution
      // corresponding to the context length of zero.
      if (!exclusionMask || !exclusionMask[i]) {
        const p = remainingMass / numUnseenSymbols;
        probs[i] += p;
        totalMass -= p;
      }
    }
    let leftSymbols = numSymbols - 1;
    let newProbMass = 0.0;
    for (let i = 1; i < numSymbols; ++i) {
      const p = totalMass / leftSymbols;
      probs[i] += p;
      totalMass -= p;
      newProbMass += probs[i];
      --leftSymbols;
    }
    assert(totalMass == 0.0, 'Expected remaining probability mass to be zero!');
    assert(Math.abs(1.0 - newProbMass) < epsilon);
    return probs;
  }

  /**
   * Prints the trie to console.
   * @param {?Node} node Current trie node.
   * @param {string} indent Indentation prefix.
   * @final @private
   */
  printToConsole_(node, indent) {
    console.log(indent + '  ' + this.vocab_.symbols_[node.symbol_] +
                '(' + node.symbol_ + ') [' + node.count_ + ']');
    indent += '  ';
    let child = node.child_;
    while (child != null) {
      this.printToConsole_(child, indent);
      child = child.next_;
    }
  }

  /**
   * Prints the trie to console.
   * @final
   */
  printToConsole() {
    this.printToConsole_(this.root_, '');
  }
}

// Copyright 2025 Will Wade
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Fuzzy matching utilities for error-tolerant prediction.
 *
 * Provides functions for calculating string similarity and filtering
 * predictions based on edit distance and other similarity metrics.
 */

/**
 * Calculate Levenshtein distance between two strings.
 * @param {string} str1 First string.
 * @param {string} str2 Second string.
 * @return {number} Edit distance.
 */
function levenshteinDistance$1(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;

  // Create a 2D array for dynamic programming
  const dp = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  // Initialize base cases
  for (let i = 0; i <= len1; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    dp[0][j] = j;
  }

  // Fill the dp table
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }

  return dp[len1][len2];
}

/**
 * Calculate similarity score between two strings (0-1, higher is more similar).
 * @param {string} str1 First string.
 * @param {string} str2 Second string.
 * @return {number} Similarity score between 0 and 1.
 */
function similarityScore$1(str1, str2) {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) {return 1.0;}

  const distance = levenshteinDistance$1(str1, str2);
  return 1.0 - (distance / maxLen);
}

/**
 * Check if a string starts with a prefix (case-insensitive option).
 * @param {string} str The string to check.
 * @param {string} prefix The prefix to look for.
 * @param {boolean} caseSensitive Whether to do case-sensitive matching.
 * @return {boolean} True if str starts with prefix.
 */
function startsWith(str, prefix, caseSensitive = true) {
  if (!caseSensitive) {
    str = str.toLowerCase();
    prefix = prefix.toLowerCase();
  }
  return str.startsWith(prefix);
}

/**
 * Filter and rank strings by similarity to a target string.
 * @param {string} target Target string to match against.
 * @param {Array<string>} candidates Array of candidate strings.
 * @param {number} maxDistance Maximum edit distance to include.
 * @param {number} minSimilarity Minimum similarity score (0-1) to include.
 * @return {Array<{text: string, distance: number, similarity: number}>}
 *         Sorted array of matches with scores.
 */
function fuzzyMatch(target, candidates, maxDistance = 2, minSimilarity = 0.5) {
  const matches = [];
  const targetLength = target.length;

  for (const candidate of candidates) {
    if (Math.abs(candidate.length - targetLength) > maxDistance) {
      continue;
    }

    const distance = levenshteinDistance$1(target, candidate);
    const maxLen = Math.max(targetLength, candidate.length);
    const similarity = maxLen === 0 ? 1.0 : 1.0 - (distance / maxLen);

    if (distance <= maxDistance && similarity >= minSimilarity) {
      matches.push({
        text: candidate,
        distance: distance,
        similarity: similarity
      });
    }
  }

  // Sort by similarity (descending) then by distance (ascending)
  matches.sort((a, b) => {
    if (Math.abs(a.similarity - b.similarity) > 0.001) {
      return b.similarity - a.similarity;
    }
    return a.distance - b.distance;
  });

  return matches;
}

const qwertyAdjacency = {
  'q': ['w', 'a', 's'],
  'w': ['q', 'e', 'a', 's', 'd'],
  'e': ['w', 'r', 's', 'd', 'f'],
  'r': ['e', 't', 'd', 'f', 'g'],
  't': ['r', 'y', 'f', 'g', 'h'],
  'y': ['t', 'u', 'g', 'h', 'j'],
  'u': ['y', 'i', 'h', 'j', 'k'],
  'i': ['u', 'o', 'j', 'k', 'l'],
  'o': ['i', 'p', 'k', 'l'],
  'p': ['o', 'l'],
  'a': ['q', 'w', 's', 'z', 'x'],
  's': ['q', 'w', 'e', 'a', 'd', 'z', 'x', 'c'],
  'd': ['w', 'e', 'r', 's', 'f', 'x', 'c', 'v'],
  'f': ['e', 'r', 't', 'd', 'g', 'c', 'v', 'b'],
  'g': ['r', 't', 'y', 'f', 'h', 'v', 'b', 'n'],
  'h': ['t', 'y', 'u', 'g', 'j', 'b', 'n', 'm'],
  'j': ['y', 'u', 'i', 'h', 'k', 'n', 'm'],
  'k': ['u', 'i', 'o', 'j', 'l', 'm'],
  'l': ['i', 'o', 'p', 'k'],
  'z': ['a', 's', 'x'],
  'x': ['a', 's', 'd', 'z', 'c'],
  'c': ['s', 'd', 'f', 'x', 'v'],
  'v': ['d', 'f', 'g', 'c', 'b'],
  'b': ['f', 'g', 'h', 'v', 'n'],
  'n': ['g', 'h', 'j', 'b', 'm'],
  'm': ['h', 'j', 'k', 'n']
};

/**
 * Get keyboard adjacency map for QWERTY layout.
 * Used for keyboard-proximity-based error tolerance.
 * @return {Object} Map of characters to their adjacent keys.
 */
function getQwertyAdjacency() {
  return qwertyAdjacency;
}

/**
 * Check if two characters are adjacent on a QWERTY keyboard.
 * @param {string} char1 First character.
 * @param {string} char2 Second character.
 * @return {boolean} True if characters are adjacent.
 */
function areKeysAdjacent(char1, char2, adjacency = qwertyAdjacency) {
  const c1 = char1.toLowerCase();
  const c2 = char2.toLowerCase();

  return adjacency[c1] && adjacency[c1].includes(c2);
}

/**
 * Calculate keyboard-aware edit distance.
 * Substitutions between adjacent keys cost less than non-adjacent keys.
 * @param {string} str1 First string.
 * @param {string} str2 Second string.
 * @return {number} Keyboard-aware edit distance.
 */
function keyboardAwareDistance(str1, str2, adjacency = qwertyAdjacency) {
  const len1 = str1.length;
  const len2 = str2.length;

  const dp = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        // Check if keys are adjacent for substitution cost
        const substCost = areKeysAdjacent(str1[i - 1], str2[j - 1], adjacency) ? 0.5 : 1.0;

        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + substCost // substitution
        );
      }
    }
  }

  return dp[len1][len2];
}

var fuzzyMatcher = {
  levenshteinDistance: levenshteinDistance$1,
  similarityScore: similarityScore$1,
  startsWith,
  fuzzyMatch,
  getQwertyAdjacency,
  areKeysAdjacent,
  keyboardAwareDistance
};

// Copyright 2025 Will Wade
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Word tokenization utilities.
 *
 * Provides functions for splitting text into words and handling
 * word boundaries for prediction.
 */

/**
 * Tokenize text into words.
 * @param {string} text Text to tokenize.
 * @return {Array<string>} Array of words.
 */
function tokenize(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // Split on whitespace and punctuation, but keep the tokens
  return text.trim().split(/\s+/).filter(word => word.length > 0);
}

/**
 * Get the last partial word from text (for word completion).
 * @param {string} text Input text.
 * @return {string} The last partial word.
 */
function getLastPartialWord(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const trimmed = text.trimEnd();
  const words = trimmed.split(/\s+/);

  // If text ends with whitespace, there's no partial word
  if (text !== trimmed) {
    return '';
  }

  return words[words.length - 1] || '';
}

/**
 * Get the context (all words except the last partial word).
 * @param {string} text Input text.
 * @return {string} Context text.
 */
function getContext(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const trimmed = text.trimEnd();
  const words = trimmed.split(/\s+/);

  // If text ends with whitespace, all words are context
  if (text !== trimmed) {
    return trimmed;
  }

  // Otherwise, exclude the last word
  if (words.length <= 1) {
    return '';
  }

  return words.slice(0, -1).join(' ');
}

/**
 * Check if text ends with a word boundary (whitespace).
 * @param {string} text Input text.
 * @return {boolean} True if text ends with whitespace.
 */
function endsWithWordBoundary(text) {
  if (!text || typeof text !== 'string') {
    return true;
  }

  return text !== text.trimEnd();
}

/**
 * Normalize text for prediction (lowercase, trim).
 * @param {string} text Input text.
 * @param {boolean} lowercase Whether to convert to lowercase.
 * @return {string} Normalized text.
 */
function normalize(text, lowercase = true) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let normalized = text.trim();
  if (lowercase) {
    normalized = normalized.toLowerCase();
  }

  return normalized;
}

/**
 * Split text into characters, handling special cases.
 * @param {string} text Input text.
 * @return {Array<string>} Array of characters.
 */
function toCharArray(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  return Array.from(text);
}

/**
 * Join an array of characters into a string.
 * @param {Array<string>} chars Array of characters.
 * @return {string} Joined string.
 */
function fromCharArray(chars) {
  if (!Array.isArray(chars)) {
    return '';
  }

  return chars.join('');
}

/**
 * Get n-grams from text.
 * @param {string} text Input text.
 * @param {number} n Size of n-grams.
 * @return {Array<string>} Array of n-grams.
 */
function getNgrams(text, n) {
  if (!text || typeof text !== 'string' || n < 1) {
    return [];
  }

  const chars = toCharArray(text);
  const ngrams = [];

  for (let i = 0; i <= chars.length - n; i++) {
    ngrams.push(chars.slice(i, i + n).join(''));
  }

  return ngrams;
}

/**
 * Remove punctuation from text.
 * @param {string} text Input text.
 * @return {string} Text without punctuation.
 */
function removePunctuation(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text.replace(/[^\w\s]/g, '');
}

/**
 * Check if a character is alphanumeric.
 * @param {string} char Character to check.
 * @return {boolean} True if alphanumeric.
 */
function isAlphanumeric(char) {
  if (!char || typeof char !== 'string' || char.length !== 1) {
    return false;
  }

  return /^[a-zA-Z0-9]$/.test(char);
}

/**
 * Check if a character is whitespace.
 * @param {string} char Character to check.
 * @return {boolean} True if whitespace.
 */
function isWhitespace(char) {
  if (!char || typeof char !== 'string' || char.length !== 1) {
    return false;
  }

  return /^\s$/.test(char);
}

var wordTokenizer = {
  tokenize,
  getLastPartialWord,
  getContext,
  endsWithWordBoundary,
  normalize,
  toCharArray,
  fromCharArray,
  getNgrams,
  removePunctuation,
  isAlphanumeric,
  isWhitespace
};

/**
 * BK-tree implementation for approximate string matching.
 *
 * Nodes are stored using Levenshtein distance as the metric. Each node keeps a
 * map of distance -> child node, allowing near-logarithmic search when the
 * triangle inequality holds (as it does for edit distance).
 */


class BKNode {
  constructor(term) {
    this.term = term;
    this.children = new Map(); // distance => BKNode
  }
}

class BKTree {
  constructor(distanceFn = levenshteinDistance$1) {
    this.root = null;
    this.distanceFn = distanceFn;
  }

  isEmpty() {
    return this.root === null;
  }

  insert(term) {
    if (!term) {
      return;
    }

    if (!this.root) {
      this.root = new BKNode(term);
      return;
    }

    let current = this.root;
    while (true) {
      const distance = this.distanceFn(term, current.term);
      if (distance === 0) {
        return; // Term already exists
      }

      const child = current.children.get(distance);
      if (child) {
        current = child;
      } else {
        current.children.set(distance, new BKNode(term));
        return;
      }
    }
  }

  /**
   * Find all terms within maxDistance of the query.
   * @param {string} query Search term.
   * @param {number} maxDistance Inclusive distance threshold.
   * @return {Array<{ term: string, distance: number }>}
   */
  search(query, maxDistance) {
    if (!this.root || maxDistance < 0) {
      return [];
    }

    const results = [];
    const stack = [this.root];

    while (stack.length > 0) {
      const node = stack.pop();
      const distance = this.distanceFn(query, node.term);
      if (distance <= maxDistance) {
        results.push({ term: node.term, distance });
      }

      const lower = distance - maxDistance;
      const upper = distance + maxDistance;

      for (const [edgeDistance, child] of node.children.entries()) {
        if (edgeDistance >= lower && edgeDistance <= upper) {
          stack.push(child);
        }
      }
    }

    return results;
  }
}

/**
 * Simple prefix trie with depth-first traversal for prefix listings.
 */

class TrieNode {
  constructor() {
    this.children = new Map();
    this.isWord = false;
  }
}

class PrefixTrie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let node = this.root;
    for (const char of word) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char);
    }
    node.isWord = true;
  }

  /**
   * Collect words starting with a prefix up to a maximum count.
   * @param {string} prefix Prefix to search.
   * @param {number} limit Maximum number of words to return.
   * @return {Array<string>} Matching words.
   */
  collect(prefix, limit) {
    let node = this.root;
    for (const char of prefix) {
      if (!node.children.has(char)) {
        return [];
      }
      node = node.children.get(char);
    }

    const results = [];
    const stack = [[node, prefix]];

    while (stack.length > 0 && results.length < limit) {
      const [current, currentPrefix] = stack.pop();
      if (current.isWord) {
        results.push(currentPrefix);
      }

      // Push children in reverse sorted order so results come out alphabetical.
      const childrenEntries = Array.from(current.children.entries());
      childrenEntries.sort((a, b) => b[0].localeCompare(a[0]));
      for (const [char, child] of childrenEntries) {
        stack.push([child, currentPrefix + char]);
      }
    }

    return results;
  }
}

// Copyright 2025 Will Wade
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


/**
 * Configuration options for the predictor.
 * @typedef {Object} PredictorConfig
 * @property {number} maxOrder - Maximum context length for PPM (default: 5)
 * @property {boolean} errorTolerant - Enable error-tolerant mode (default: false)
 * @property {number} maxEditDistance - Maximum edit distance for fuzzy matching (default: 2)
 * @property {number} minSimilarity - Minimum similarity score 0-1 (default: 0.5)
 * @property {boolean} keyboardAware - Use keyboard-aware distance (default: false)
 * @property {boolean} caseSensitive - Case-sensitive matching (default: false)
 * @property {number} maxPredictions - Maximum number of predictions to return (default: 10)
 * @property {boolean} adaptive - Update model as text is entered (default: false)
 * @property {Array<string>} lexicon - Optional word list for word prediction
 * @property {number} ppmAlpha - PPM smoothing alpha (default: 0.49)
 * @property {number} ppmBeta - PPM smoothing beta (default: 0.77)
 * @property {boolean} ppmUseExclusion - Enable PPM exclusion at inference (default: true)
 * @property {boolean} ppmUpdateExclusion - Enable PPM single-count updates (default: true)
 * @property {number} ppmMaxNodes - Maximum trie nodes per corpus model (0 = unlimited)
 */

/**
 * Prediction result.
 * @typedef {Object} Prediction
 * @property {string} text - Predicted text
 * @property {number} probability - Probability score (0-1)
 * @property {number} [distance] - Edit distance (only in error-tolerant mode)
 * @property {number} [similarity] - Similarity score (only in error-tolerant mode)
 */

/**
 * Predictor class providing word and letter prediction.
 */
class Predictor {
  /**
   * Constructor.
   * @param {PredictorConfig} config Configuration options.
   */
  constructor(config = {}) {
    // Set default configuration
    this.config = {
      maxOrder: config.maxOrder || 5,
      errorTolerant: config.errorTolerant !== undefined ? config.errorTolerant : false,
      maxEditDistance: config.maxEditDistance || 2,
      minSimilarity: config.minSimilarity || 0.5,
      keyboardAware: config.keyboardAware !== undefined ? config.keyboardAware : false,
      keyboardAdjacencyMap: config.keyboardAdjacencyMap || null,
      caseSensitive: config.caseSensitive !== undefined ? config.caseSensitive : false,
      maxPredictions: config.maxPredictions || 10,
      adaptive: config.adaptive !== undefined ? config.adaptive : false,
      lexicon: config.lexicon || [],
      ppmAlpha: config.ppmAlpha !== undefined ? config.ppmAlpha : 0.49,
      ppmBeta: config.ppmBeta !== undefined ? config.ppmBeta : 0.77,
      ppmUseExclusion: config.ppmUseExclusion !== undefined ? config.ppmUseExclusion : true,
      ppmUpdateExclusion: config.ppmUpdateExclusion !== undefined ?
        config.ppmUpdateExclusion : true,
      ppmMaxNodes: config.ppmMaxNodes !== undefined ? config.ppmMaxNodes : 0
    };

    // Create vocabulary (shared across all corpora)
    this.vocab = new Vocabulary();

    // Add all printable ASCII characters to vocabulary
    for (let i = 32; i <= 126; i++) {
      this.vocab.addSymbol(String.fromCharCode(i));
    }

    // Add common special characters
    this.vocab.addSymbol('\n');
    this.vocab.addSymbol('\t');

    // Multi-corpus support
    // Store multiple training corpora with their own PPM models and lexicons
    this._corpora = {
      // Default corpus (backward compatibility)
      'default': {
        model: new PPMLanguageModel(
          this.vocab,
          this.config.maxOrder,
          this._getPPMOptions()
        ),
        enabled: true,
        description: 'Default training corpus',
        lexicon: this.config.lexicon || [],
        lexiconIndex: null,
        lexiconTree: null,
        lexiconTrie: null
      }
    };

    // Track which corpora are currently active
    this._activeCorpora = ['default'];

    // Create PPM language model (points to default corpus for backward compatibility)
    this.model = this._corpora['default'].model;

    // Create context
    this.context = this.model.createContext();

    // Bigram tracking for next-word prediction
    // Maps "word1 word2" -> frequency count
    this._bigrams = new Map();

    // Track total bigram count for probability calculation
    this._totalBigrams = 0;

    // Track the last word for bigram learning
    this._lastWord = null;

    // Build lexicon structures for default corpus
    this._buildCorpusLexicon('default');

    // Apply PPM settings to all corpora.
    this._applyPPMConfigToModels();
  }

  /**
   * Train the model on text.
   * Trains the default corpus for backward compatibility.
   * For multi-corpus training, use addTrainingCorpus() instead.
   *
   * This method trains both the character-level PPM model and learns
   * word-pair (bigram) frequencies for next-word prediction.
   *
   * @param {string} text Training text.
   *
   * @example
   * predictor.train('The quick brown fox jumps over the lazy dog');
   * // Learns character patterns AND word pairs like "quick brown", "brown fox", etc.
   */
  train(text) {
    if (!text || typeof text !== 'string') {
      return;
    }

    // Train character-level PPM model
    const chars = toCharArray(text);
    const context = this.model.createContext();

    for (const char of chars) {
      const symbolId = this.vocab.addSymbol(char);
      this.model.addSymbolAndUpdate(context, symbolId);
    }

    // Learn bigrams from the training text
    this._learnBigramsFromText(text);
  }

  /**
   * Add a new training corpus with a unique key.
   * Creates a new PPM model trained on the provided text.
   *
   * @param {string} corpusKey Unique identifier for this corpus (e.g., 'medical', 'personal', 'french')
   * @param {string} text Training text for this corpus
   * @param {Object} options Optional configuration
   * @param {string} options.description Human-readable description of the corpus
   * @param {boolean} options.enabled Whether this corpus should be active (default: true)
   * @param {Array<string>} options.lexicon Optional word list specific to this corpus (e.g., French words for French corpus)
   *
   * @example
   * // Add medical terminology corpus with medical lexicon
   * predictor.addTrainingCorpus('medical', medicalText, {
   *   description: 'Medical terminology and phrases',
   *   lexicon: medicalWords
   * });
   *
   * // Add French corpus with French lexicon
   * predictor.addTrainingCorpus('french', frenchText, {
   *   description: 'French language corpus',
   *   lexicon: frenchWords
   * });
   */
  addTrainingCorpus(corpusKey, text, options = {}) {
    if (!corpusKey || typeof corpusKey !== 'string') {
      throw new Error('corpusKey must be a non-empty string');
    }

    if (!text || typeof text !== 'string') {
      throw new Error('text must be a non-empty string');
    }

    // Create new PPM model for this corpus
    const corpusModel = new PPMLanguageModel(
      this.vocab,
      this.config.maxOrder,
      this._getPPMOptions()
    );

    // Train the model on the provided text
    const chars = toCharArray(text);
    const context = corpusModel.createContext();

    for (const char of chars) {
      const symbolId = this.vocab.addSymbol(char);
      corpusModel.addSymbolAndUpdate(context, symbolId);
    }

    // Store the corpus with its own lexicon
    this._corpora[corpusKey] = {
      model: corpusModel,
      enabled: options.enabled !== undefined ? options.enabled : true,
      description: options.description || `Training corpus: ${corpusKey}`,
      lexicon: options.lexicon || [],
      lexiconIndex: null,
      lexiconTree: null,
      lexiconTrie: null
    };

    // Build lexicon structures for this corpus
    this._buildCorpusLexicon(corpusKey);

    // Add to active corpora if enabled
    if (this._corpora[corpusKey].enabled && !this._activeCorpora.includes(corpusKey)) {
      this._activeCorpora.push(corpusKey);
    }
  }

  /**
   * Enable specific training corpora for predictions.
   * Disables all other corpora.
   *
   * @param {string|string[]} corpusKeys Single corpus key or array of corpus keys to use
   *
   * @example
   * // Use only medical corpus
   * predictor.useCorpora('medical');
   *
   * // Use medical and personal corpora
   * predictor.useCorpora(['medical', 'personal']);
   */
  useCorpora(corpusKeys) {
    const keys = Array.isArray(corpusKeys) ? corpusKeys : [corpusKeys];

    // Validate all keys exist
    for (const key of keys) {
      if (!this._corpora[key]) {
        throw new Error(`Corpus '${key}' does not exist. Available: ${Object.keys(this._corpora).join(', ')}`);
      }
    }

    // Disable all corpora
    Object.keys(this._corpora).forEach(key => {
      this._corpora[key].enabled = false;
    });

    // Enable specified corpora
    keys.forEach(key => {
      this._corpora[key].enabled = true;
    });

    // Update active corpora list
    this._activeCorpora = keys;

    // Update default model reference if 'default' is active
    if (keys.includes('default')) {
      this.model = this._corpora['default'].model;
    } else if (keys.length > 0) {
      // Point to first active corpus
      this.model = this._corpora[keys[0]].model;
    }
  }

  /**
   * Enable all loaded training corpora for predictions.
   *
   * @example
   * predictor.useAllCorpora();
   */
  useAllCorpora() {
    Object.keys(this._corpora).forEach(key => {
      this._corpora[key].enabled = true;
    });
    this._activeCorpora = Object.keys(this._corpora);
  }

  /**
   * Get list of available corpus keys.
   *
   * @param {boolean} onlyEnabled If true, only return enabled corpora
   * @return {string[]} Array of corpus keys
   *
   * @example
   * const allCorpora = predictor.getCorpora();
   * const activeCorpora = predictor.getCorpora(true);
   */
  getCorpora(onlyEnabled = false) {
    if (onlyEnabled) {
      return this._activeCorpora.slice();
    }
    return Object.keys(this._corpora);
  }

  /**
   * Get information about a specific corpus.
   *
   * @param {string} corpusKey Corpus identifier
   * @return {Object} Corpus information (description, enabled status)
   *
   * @example
   * const info = predictor.getCorpusInfo('medical');
   * console.log(info.description); // "Medical terminology and phrases"
   * console.log(info.enabled);     // true
   */
  getCorpusInfo(corpusKey) {
    if (!this._corpora[corpusKey]) {
      throw new Error(`Corpus '${corpusKey}' does not exist`);
    }

    return {
      key: corpusKey,
      description: this._corpora[corpusKey].description,
      enabled: this._corpora[corpusKey].enabled
    };
  }

  /**
   * Remove a training corpus.
   *
   * @param {string} corpusKey Corpus identifier to remove
   *
   * @example
   * predictor.removeCorpus('old_vocabulary');
   */
  removeCorpus(corpusKey) {
    if (corpusKey === 'default') {
      throw new Error('Cannot remove the default corpus');
    }

    if (!this._corpora[corpusKey]) {
      throw new Error(`Corpus '${corpusKey}' does not exist`);
    }

    delete this._corpora[corpusKey];
    this._activeCorpora = this._activeCorpora.filter(key => key !== corpusKey);
  }

  /**
   * Reset the prediction context.
   */
  resetContext() {
    this.context = this.model.createContext();
  }

  /**
   * Add text to the current context.
   * @param {string} text Text to add to context.
   * @param {boolean} update Whether to update the model (adaptive mode).
   */
  addToContext(text, update = null) {
    if (!text || typeof text !== 'string') {
      return;
    }

    const shouldUpdate = update !== null ? update : this.config.adaptive;
    const chars = toCharArray(text);

    for (const char of chars) {
      let symbolId = this.vocab.getSymbol(char);
      if (symbolId < 0) {
        symbolId = this.vocab.addSymbol(char);
      }

      if (shouldUpdate) {
        this.model.addSymbolAndUpdate(this.context, symbolId);
      } else {
        this.model.addSymbolToContext(this.context, symbolId);
      }
    }
  }

  /**
   * Get character/letter predictions.
   * Merges predictions from all active training corpora.
   *
   * @param {string} context Optional context string (uses current context if not provided).
   * @return {Array<Prediction>} Array of character predictions.
   */
  predictNextCharacter(context = null) {
    // If only one corpus is active, use fast path
    if (this._activeCorpora.length === 1) {
      return this._predictFromSingleCorpus(this._activeCorpora[0], context);
    }

    // Merge predictions from all active corpora
    return this._predictFromMultipleCorpora(context);
  }

  /**
   * Get predictions from a single corpus (fast path).
   * @private
   */
  _predictFromSingleCorpus(corpusKey, context = null) {
    const corpus = this._corpora[corpusKey];
    let workingContext = corpusKey === 'default' ? this.context : corpus.model.createContext();

    if (context !== null) {
      workingContext = corpus.model.createContext();
      const chars = toCharArray(context);
      for (const char of chars) {
        let symbolId = this.vocab.getSymbol(char);
        if (symbolId < 0) {
          symbolId = this.vocab.addSymbol(char);
        }
        corpus.model.addSymbolToContext(workingContext, symbolId);
      }
    }

    // Get probabilities from PPM model
    const probs = corpus.model.getProbs(workingContext);

    // Convert to predictions array
    const predictions = [];
    for (let i = 1; i < probs.length; i++) {
      if (probs[i] > 0) {
        predictions.push({
          text: this.vocab.symbols_[i],
          probability: probs[i]
        });
      }
    }

    // Sort by probability (descending)
    predictions.sort((a, b) => b.probability - a.probability);

    // Return top N predictions
    return predictions.slice(0, this.config.maxPredictions);
  }

  /**
   * Get predictions from multiple corpora and merge them.
   * Averages probabilities across all active corpora.
   * @private
   */
  _predictFromMultipleCorpora(context = null) {
    const allPredictions = new Map(); // char -> { totalProb, count }

    // Collect predictions from each active corpus
    for (const corpusKey of this._activeCorpora) {
      const corpus = this._corpora[corpusKey];
      let workingContext = corpus.model.createContext();

      // Build context if provided
      if (context !== null) {
        const chars = toCharArray(context);
        for (const char of chars) {
          let symbolId = this.vocab.getSymbol(char);
          if (symbolId < 0) {
            symbolId = this.vocab.addSymbol(char);
          }
          corpus.model.addSymbolToContext(workingContext, symbolId);
        }
      } else if (corpusKey === 'default') {
        // Use current context for default corpus
        workingContext = this.context;
      }

      // Get probabilities from this corpus
      const probs = corpus.model.getProbs(workingContext);

      // Accumulate probabilities
      for (let i = 1; i < probs.length; i++) {
        if (probs[i] > 0) {
          const char = this.vocab.symbols_[i];
          if (!allPredictions.has(char)) {
            allPredictions.set(char, { totalProb: 0, count: 0 });
          }
          const entry = allPredictions.get(char);
          entry.totalProb += probs[i];
          entry.count++;
        }
      }
    }

    // Average probabilities and create predictions array
    const predictions = [];
    for (const [char, data] of allPredictions.entries()) {
      predictions.push({
        text: char,
        probability: data.totalProb / data.count // Average across corpora
      });
    }

    // Sort by probability (descending)
    predictions.sort((a, b) => b.probability - a.probability);

    // Return top N predictions
    return predictions.slice(0, this.config.maxPredictions);
  }

  /**
   * Get word completion predictions.
   * Merges lexicons from all active corpora for multilingual support.
   * @param {string} partialWord Partial word to complete.
   * @param {string} precedingContext Optional preceding context.
   * @return {Array<Prediction>} Array of word predictions.
   */
  predictWordCompletion(partialWord, precedingContext = '') {
    if (!partialWord || typeof partialWord !== 'string') {
      return [];
    }

    const normalized = this.config.caseSensitive ? partialWord : partialWord.toLowerCase();

    // Check if any active corpus has a lexicon
    const hasLexicon = this._activeCorpora.some(key => {
      const corpus = this._corpora[key];
      return corpus && corpus.lexiconIndex && corpus.lexiconIndex.size > 0;
    });

    // If we have lexicons in active corpora, use them for word completion
    if (hasLexicon) {
      return this._predictFromLexicon(normalized, precedingContext);
    }

    // Otherwise, use character-level prediction to build word completions
    return this._predictCharacterBased(partialWord, precedingContext);
  }

  /**
   * Predict word completions from lexicons of all active corpora.
   * Merges lexicons from multiple corpora for multilingual support.
   * @param {string} partialWord Partial word (normalized).
   * @param {string} precedingContext Preceding context.
   * @return {Array<Prediction>} Array of word predictions.
   * @private
  */
  _predictFromLexicon(partialWord, precedingContext) {
    const candidates = new Map(); // Map word -> frequency rank (lower is better)
    const seen = new Set();

    // Collect candidates from all active corpora
    for (const corpusKey of this._activeCorpora) {
      const corpus = this._corpora[corpusKey];
      if (!corpus || !corpus.lexiconIndex || corpus.lexiconIndex.size === 0) {
        continue;
      }

      // Get frequency rank from lexicon array (index = rank, lower is more frequent)
      const lexiconArray = corpus.lexicon || [];

      // Use trie for efficient prefix lookup when available
      if (corpus.lexiconTrie) {
        const prefixMatches = corpus.lexiconTrie.collect(partialWord, this.config.maxPredictions * 2);
        for (const word of prefixMatches) {
          if (!seen.has(word)) {
            seen.add(word);
            // Find frequency rank (position in lexicon array)
            const rank = lexiconArray.indexOf(word);
            candidates.set(word, rank >= 0 ? rank : lexiconArray.length);
          }
        }
      } else {
        for (const word of corpus.lexiconIndex) {
          if (startsWith(word, partialWord, this.config.caseSensitive)) {
            if (!seen.has(word)) {
              seen.add(word);
              // Find frequency rank (position in lexicon array)
              const rank = lexiconArray.indexOf(word);
              candidates.set(word, rank >= 0 ? rank : lexiconArray.length);
            }
          }
        }
      }

      // In error-tolerant mode, also include fuzzy matches from this corpus
      if (this.config.errorTolerant && partialWord.length >= 2 && corpus.lexiconTree && !corpus.lexiconTree.isEmpty()) {
        const matches = corpus.lexiconTree.search(partialWord, this.config.maxEditDistance);
        for (const match of matches) {
          const maxLen = Math.max(partialWord.length, match.term.length);
          const similarity = maxLen === 0 ? 1.0 : 1.0 - (match.distance / maxLen);
          if (similarity >= this.config.minSimilarity && !seen.has(match.term)) {
            seen.add(match.term);
            // Find frequency rank (position in lexicon array)
            const rank = lexiconArray.indexOf(match.term);
            candidates.set(match.term, rank >= 0 ? rank : lexiconArray.length);
          }
        }
      }
    }

    // Score candidates using PPM model + frequency rank
    return this._scoreCandidatesWithFrequency(candidates, precedingContext);
  }

  /**
   * Predict word completions using character-level model.
   * @param {string} partialWord Partial word.
   * @param {string} precedingContext Preceding context.
   * @return {Array<Prediction>} Array of word predictions.
   * @private
   */
  _predictCharacterBased(partialWord, precedingContext) {
    const predictions = [];
    const maxLength = 20; // Maximum word length to predict

    // Create a context with the preceding text and partial word
    const fullContext = precedingContext + partialWord;
    const workingContext = this.model.createContext();

    const chars = toCharArray(fullContext);
    for (const char of chars) {
      let symbolId = this.vocab.getSymbol(char);
      if (symbolId >= 0) {
        this.model.addSymbolToContext(workingContext, symbolId);
      }
    }

    // Generate completions by predicting next characters
    const completions = this._generateCompletions(
      workingContext,
      partialWord,
      maxLength - partialWord.length,
      5 // Generate top 5 completions
    );

    for (const completion of completions) {
      predictions.push({
        text: completion.text,
        probability: completion.probability
      });
    }

    return predictions;
  }

  /**
   * Generate word completions by predicting next characters.
   * @param {Object} context PPM context.
   * @param {string} prefix Current prefix.
   * @param {number} maxChars Maximum characters to add.
   * @param {number} numCompletions Number of completions to generate.
   * @return {Array<Prediction>} Generated completions.
   * @private
   */
  _generateCompletions(context, prefix, maxChars, numCompletions) {
    const completions = [];
    const spaceId = this.vocab.getSymbol(' ');

    // Simple beam search
    let beams = [{ context: this.model.cloneContext(context), text: prefix, prob: 1.0 }];

    for (let i = 0; i < maxChars; i++) {
      const newBeams = [];

      for (const beam of beams) {
        const probs = this.model.getProbs(beam.context);
        const topChars = [];

        // Get top characters
        for (let j = 1; j < probs.length; j++) {
          if (probs[j] > 0) {
            topChars.push({ id: j, prob: probs[j] });
          }
        }

        topChars.sort((a, b) => b.prob - a.prob);

        // Expand beam with top characters
        for (let k = 0; k < Math.min(3, topChars.length); k++) {
          const charId = topChars[k].id;
          const char = this.vocab.symbols_[charId];

          // Stop at space or newline
          if (charId === spaceId || char === '\n') {
            if (beam.text.length > prefix.length) {
              completions.push({ text: beam.text, probability: beam.prob });
            }
            continue;
          }

          const newContext = this.model.cloneContext(beam.context);
          this.model.addSymbolToContext(newContext, charId);

          newBeams.push({
            context: newContext,
            text: beam.text + char,
            prob: beam.prob * topChars[k].prob
          });
        }
      }

      if (newBeams.length === 0) {break;}

      // Keep top beams
      newBeams.sort((a, b) => b.prob - a.prob);
      beams = newBeams.slice(0, numCompletions);
    }

    // Add remaining beams as completions
    for (const beam of beams) {
      if (beam.text.length > prefix.length) {
        completions.push({ text: beam.text, probability: beam.prob });
      }
    }

    completions.sort((a, b) => b.probability - a.probability);
    return completions.slice(0, numCompletions);
  }

  /**
   * Score candidate words using the PPM model.
   * @param {Array<string>} candidates Candidate words.
   * @param {string} precedingContext Preceding context.
   * @return {Array<Prediction>} Scored predictions.
   * @private
   */
  _scoreCandidates(candidates, precedingContext) {
    const predictions = [];

    for (const candidate of candidates) {
      const score = this._scoreWord(candidate, precedingContext);
      predictions.push({
        text: candidate,
        probability: score
      });
    }

    predictions.sort((a, b) => b.probability - a.probability);
    return predictions.slice(0, this.config.maxPredictions);
  }

  /**
   * Score candidate words using PPM model + frequency rank.
   * Combines character-level probability with word frequency from lexicon.
   * @param {Map<string, number>} candidates Map of word -> frequency rank.
   * @param {string} precedingContext Preceding context.
   * @return {Array<Prediction>} Scored predictions.
   * @private
   */
  _scoreCandidatesWithFrequency(candidates, precedingContext) {
    const predictions = [];
    const maxRank = Math.max(...candidates.values(), 1);

    for (const [word, rank] of candidates.entries()) {
      // Get PPM character-level score
      const ppmScore = this._scoreWord(word, precedingContext);

      // Convert rank to frequency score (0-1, higher is better)
      // More frequent words (lower rank) get higher scores
      const frequencyScore = 1.0 - (rank / maxRank);

      // Combine scores: 70% frequency, 30% PPM
      // Frequency is more important for word prediction
      const combinedScore = (0.7 * frequencyScore) + (0.3 * ppmScore);

      predictions.push({
        text: word,
        probability: combinedScore
      });
    }

    predictions.sort((a, b) => b.probability - a.probability);
    return predictions.slice(0, this.config.maxPredictions);
  }

  /**
   * Score a word using the PPM model.
   * @param {string} word Word to score.
   * @param {string} precedingContext Preceding context.
   * @return {number} Score (probability).
   * @private
   */
  _scoreWord(word, precedingContext) {
    const fullText = precedingContext + word;
    const workingContext = this.model.createContext();

    let logProb = 0;
    const chars = toCharArray(fullText);

    for (const char of chars) {
      const symbolId = this.vocab.getSymbol(char);
      if (symbolId >= 0) {
        const probs = this.model.getProbs(workingContext);
        const prob = probs[symbolId] || 1e-10;
        logProb += Math.log(prob);
        this.model.addSymbolToContext(workingContext, symbolId);
      }
    }

    // Convert log probability to probability (normalized)
    return Math.exp(logProb / chars.length);
  }

  /**
   * Learn bigrams (word pairs) from training text.
   * Extracts word pairs and tracks their frequencies for next-word prediction.
   *
   * @param {string} text Training text to learn bigrams from.
   * @private
   *
   * @example
   * // Internal use: learns "quick brown", "brown fox", etc.
   * this._learnBigramsFromText('The quick brown fox');
   */
  _learnBigramsFromText(text) {
    if (!text || typeof text !== 'string') {
      return;
    }

    // Tokenize text into words (splits on whitespace)
    const words = tokenize(text);

    // Normalize words based on case sensitivity setting
    const normalizedWords = words.map(word =>
      this.config.caseSensitive ? word : word.toLowerCase()
    );

    // Learn bigrams (consecutive word pairs)
    for (let i = 0; i < normalizedWords.length - 1; i++) {
      const word1 = normalizedWords[i];
      const word2 = normalizedWords[i + 1];

      // Skip empty words or punctuation-only words
      if (!word1 || !word2 || word1.length === 0 || word2.length === 0) {
        continue;
      }

      // Create bigram key "word1 word2"
      const bigramKey = `${word1} ${word2}`;

      // Increment frequency count
      const currentCount = this._bigrams.get(bigramKey) || 0;
      this._bigrams.set(bigramKey, currentCount + 1);
      this._totalBigrams++;
    }
  }

  /**
   * Predict next word based on bigram frequencies.
   * Uses learned word-pair patterns to suggest likely next words.
   *
   * @param {string} currentWord The current/last word typed.
   * @param {number} maxPredictions Maximum number of predictions to return (default: 10).
   * @return {Array<Prediction>} Array of next-word predictions sorted by probability.
   *
   * @example
   * predictor.train('The quick brown fox jumps over the lazy dog');
   * const predictions = predictor.predictNextWord('brown');
   * // Returns: [{ text: 'fox', probability: 1.0 }]
   *
   * @example
   * // With multiple training examples
   * predictor.train('hello world');
   * predictor.train('hello there');
   * predictor.train('hello friend');
   * const predictions = predictor.predictNextWord('hello');
   * // Returns: [
   * //   { text: 'world', probability: 0.33 },
   * //   { text: 'there', probability: 0.33 },
   * //   { text: 'friend', probability: 0.33 }
   * // ]
   */
  predictNextWord(currentWord, maxPredictions = 10) {
    if (!currentWord || typeof currentWord !== 'string') {
      return [];
    }

    // Normalize the current word
    const normalized = this.config.caseSensitive ? currentWord : currentWord.toLowerCase();

    // Find all bigrams starting with this word
    const nextWordCounts = new Map();
    let totalCount = 0;

    for (const [bigramKey, count] of this._bigrams.entries()) {
      const [word1, word2] = bigramKey.split(' ');

      if (word1 === normalized) {
        nextWordCounts.set(word2, (nextWordCounts.get(word2) || 0) + count);
        totalCount += count;
      }
    }

    // Convert counts to probabilities
    const predictions = [];
    for (const [word, count] of nextWordCounts.entries()) {
      predictions.push({
        text: word,
        probability: count / totalCount
      });
    }

    // Sort by probability (descending) and return top N
    predictions.sort((a, b) => b.probability - a.probability);
    return predictions.slice(0, maxPredictions);
  }

  /**
   * Export learned bigrams as text.
   * Returns bigrams in a simple text format that can be saved and re-imported.
   *
   * @return {string} Bigrams in text format (one per line: "word1 word2 count").
   *
   * @example
   * const bigramText = predictor.exportBigrams();
   * // Returns:
   * // "quick brown 5\n"
   * // "brown fox 5\n"
   * // "hello world 3\n"
   * // ...
   */
  exportBigrams() {
    const lines = [];

    for (const [bigramKey, count] of this._bigrams.entries()) {
      lines.push(`${bigramKey} ${count}`);
    }

    return lines.join('\n');
  }

  /**
   * Import bigrams from text.
   * Loads bigrams from a text format (one per line: "word1 word2 count").
   * This adds to existing bigrams rather than replacing them.
   *
   * @param {string} bigramText Bigrams in text format.
   *
   * @example
   * const bigramText = "quick brown 5\nbrown fox 5\nhello world 3";
   * predictor.importBigrams(bigramText);
   */
  importBigrams(bigramText) {
    if (!bigramText || typeof bigramText !== 'string') {
      return;
    }

    const lines = bigramText.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }

      // Parse "word1 word2 count"
      const parts = trimmed.split(' ');
      if (parts.length < 3) {
        continue; // Invalid format
      }

      // Last part is count, everything before is the bigram
      const count = parseInt(parts[parts.length - 1], 10);
      if (isNaN(count) || count <= 0) {
        continue; // Invalid count
      }

      // Reconstruct bigram key (handles multi-word entries)
      const bigramKey = parts.slice(0, parts.length - 1).join(' ');

      // Add to bigrams
      const currentCount = this._bigrams.get(bigramKey) || 0;
      this._bigrams.set(bigramKey, currentCount + count);
      this._totalBigrams += count;
    }
  }

  /**
   * Clear all learned bigrams.
   * Resets bigram tracking to initial state.
   *
   * @example
   * predictor.clearBigrams();
   */
  clearBigrams() {
    this._bigrams.clear();
    this._totalBigrams = 0;
    this._lastWord = null;
  }

  /**
   * Get bigram statistics.
   * Returns information about learned bigrams.
   *
   * @return {Object} Bigram statistics.
   * @return {number} return.uniqueBigrams - Number of unique bigrams learned.
   * @return {number} return.totalBigrams - Total bigram occurrences.
   *
   * @example
   * const stats = predictor.getBigramStats();
   * console.log(`Learned ${stats.uniqueBigrams} unique word pairs`);
   */
  getBigramStats() {
    return {
      uniqueBigrams: this._bigrams.size,
      totalBigrams: this._totalBigrams
    };
  }

  /**
   * Get PPM model statistics for each corpus.
   * Useful for observing memory usage when max node limits are set.
   *
   * @return {Object<string, Object>} Map of corpus key to stats.
   */
  getPPMStats() {
    const stats = {};
    for (const [key, corpus] of Object.entries(this._corpora)) {
      if (corpus && corpus.model && typeof corpus.model.getStats === 'function') {
        stats[key] = corpus.model.getStats();
      }
    }
    return stats;
  }

  /**
   * Get configuration.
   * @return {PredictorConfig} Current configuration.
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Update configuration.
   * @param {Partial<PredictorConfig>} newConfig Configuration updates.
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.ppmAlpha !== undefined ||
      newConfig.ppmBeta !== undefined ||
      newConfig.ppmUseExclusion !== undefined ||
      newConfig.ppmUpdateExclusion !== undefined ||
      newConfig.ppmMaxNodes !== undefined) {
      this._applyPPMConfigToModels();
    }

    // Rebuild lexicon structures if relevant settings changed
    if (newConfig.lexicon ||
      newConfig.caseSensitive !== undefined ||
      newConfig.keyboardAdjacencyMap ||
      newConfig.keyboardAware !== undefined) {

      // Update default corpus lexicon if lexicon changed
      if (newConfig.lexicon) {
        this._buildLexiconStructures();
      }

      // Rebuild all corpus lexicons if keyboard settings changed
      // (affects BKTree distance function)
      if (newConfig.keyboardAdjacencyMap || newConfig.keyboardAware !== undefined) {
        for (const corpusKey of Object.keys(this._corpora)) {
          this._buildCorpusLexicon(corpusKey);
        }
      }
    }
  }

  /**
   * Build auxiliary structures used for lexicon lookup for a specific corpus.
   * @param {string} corpusKey The corpus to build lexicon structures for
   * @private
   */
  _buildCorpusLexicon(corpusKey) {
    const corpus = this._corpora[corpusKey];
    if (!corpus) {
      return;
    }

    const lexicon = Array.isArray(corpus.lexicon) ? corpus.lexicon : [];
    corpus.lexiconIndex = new Set();
    corpus.lexiconTrie = new PrefixTrie();

    const adjacency = this._resolveAdjacencyMap();
    const distanceFn = this.config.keyboardAware
      ? (a, b) => keyboardAwareDistance(a, b, adjacency || getQwertyAdjacency())
      : levenshteinDistance$1;

    corpus.lexiconTree = new BKTree(distanceFn);

    for (const entry of lexicon) {
      if (typeof entry !== 'string' || entry.length === 0) {
        continue;
      }

      const normalized = this.config.caseSensitive ? entry : entry.toLowerCase();
      if (!corpus.lexiconIndex.has(normalized)) {
        corpus.lexiconIndex.add(normalized);
        corpus.lexiconTree.insert(normalized);
        corpus.lexiconTrie.insert(normalized);
      }
    }
  }

  /**
   * Build auxiliary structures used for lexicon lookup.
   * For backward compatibility - rebuilds default corpus lexicon.
   * @private
   */
  _buildLexiconStructures() {
    // Update default corpus lexicon from config
    if (this._corpora['default']) {
      this._corpora['default'].lexicon = this.config.lexicon || [];
      this._buildCorpusLexicon('default');
    }

    // Also update keyboard adjacency (shared across all corpora)
    this.keyboardAdjacency = this._resolveAdjacencyMap();
  }

  /**
   * Returns PPM parameter options from predictor config.
   * @return {Object} PPM options object.
   * @private
   */
  _getPPMOptions() {
    return {
      alpha: this.config.ppmAlpha,
      beta: this.config.ppmBeta,
      useExclusion: this.config.ppmUseExclusion,
      updateExclusion: this.config.ppmUpdateExclusion,
      maxNodes: this.config.ppmMaxNodes
    };
  }

  /**
   * Applies current PPM settings to all loaded corpus models.
   * @private
   */
  _applyPPMConfigToModels() {
    const options = this._getPPMOptions();
    for (const corpus of Object.values(this._corpora)) {
      if (corpus && corpus.model && typeof corpus.model.setParameters === 'function') {
        corpus.model.setParameters(options);
      }
    }
  }

  /**
   * Resolve the adjacency map to use for keyboard-aware distance.
   * @return {?Object} adjacency map or null.
   * @private
   */
  _resolveAdjacencyMap() {
    if (!this.config.keyboardAware) {
      return null;
    }
    if (this.config.keyboardAdjacencyMap) {
      return this._normalizeAdjacencyMap(this.config.keyboardAdjacencyMap);
    }
    return getQwertyAdjacency();
  }

  /**
   * Normalize adjacency keys to single-character lowercase entries.
   * @param {Object} adjacencyMap Raw adjacency map.
   * @return {Object} Normalized adjacency map.
   * @private
   */
  _normalizeAdjacencyMap(adjacencyMap) {
    const normalized = {};
    for (const [key, neighbours] of Object.entries(adjacencyMap)) {
      if (typeof key !== 'string' || key.length === 0) {
        continue;
      }
      const base = key.charAt(0).toLowerCase();
      if (!normalized[base]) {
        normalized[base] = [];
      }
      if (Array.isArray(neighbours)) {
        for (const neighbour of neighbours) {
          if (typeof neighbour !== 'string' || neighbour.length === 0) {
            continue;
          }
          const char = neighbour.charAt(0).toLowerCase();
          if (!normalized[base].includes(char)) {
            normalized[base].push(char);
          }
        }
      }
    }
    return normalized;
  }
}

// Copyright 2025 Will Wade
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


/**
 * Create a new predictor instance with the given configuration.
 *
 * @param {Object} config - Configuration options
 * @param {number} [config.maxOrder=5] - Maximum context length for PPM
 * @param {boolean} [config.errorTolerant=false] - Enable error-tolerant mode
 * @param {number} [config.maxEditDistance=2] - Maximum edit distance for fuzzy matching
 * @param {number} [config.minSimilarity=0.5] - Minimum similarity score (0-1)
 * @param {boolean} [config.keyboardAware=false] - Use keyboard-aware distance
 * @param {Object} [config.keyboardAdjacencyMap] - Custom adjacency map for keyboard-aware distance
 * @param {boolean} [config.caseSensitive=false] - Case-sensitive matching
 * @param {number} [config.maxPredictions=10] - Maximum number of predictions
 * @param {boolean} [config.adaptive=false] - Update model as text is entered
 * @param {Array<string>} [config.lexicon=[]] - Optional word list for word prediction
 * @param {number} [config.ppmAlpha=0.49] - PPM smoothing alpha
 * @param {number} [config.ppmBeta=0.77] - PPM smoothing beta
 * @param {boolean} [config.ppmUseExclusion=true] - Enable inference-time exclusion
 * @param {boolean} [config.ppmUpdateExclusion=true] - Enable single-count updates
 * @param {number} [config.ppmMaxNodes=0] - Maximum trie nodes per model (0 = unlimited)
 * @return {Predictor} Predictor instance
 *
 * @example
 * const { createPredictor } = require('@willwade/noisy-channel-predictor');
 *
 * // Create a basic predictor
 * const predictor = createPredictor();
 *
 * // Train on some text
 * predictor.train('The quick brown fox jumps over the lazy dog');
 *
 * // Get character predictions
 * predictor.addToContext('The qui');
 * const charPredictions = predictor.predictNextCharacter();
 * console.log(charPredictions); // [{ text: 'c', probability: 0.8 }, ...]
 *
 * @example
 * // Create an error-tolerant predictor with a lexicon
 * const predictor = createPredictor({
 *   errorTolerant: true,
 *   maxEditDistance: 2,
 *   lexicon: ['hello', 'world', 'help', 'held']
 * });
 *
 * // Get word completions (with typo tolerance)
 * const wordPredictions = predictor.predictWordCompletion('helo');
 * console.log(wordPredictions); // [{ text: 'hello', probability: 0.9 }, ...]
 */
function createPredictor(config = {}) {
  return new Predictor(config);
}

/**
 * Create a predictor with strict mode (exact matching only).
 *
 * @param {Object} config - Configuration options (errorTolerant will be set to false)
 * @return {Predictor} Predictor instance in strict mode
 *
 * @example
 * const { createStrictPredictor } = require('@willwade/noisy-channel-predictor');
 *
 * const predictor = createStrictPredictor({
 *   lexicon: ['hello', 'world']
 * });
 *
 * const predictions = predictor.predictWordCompletion('hel');
 * console.log(predictions); // Only exact prefix matches
 */
function createStrictPredictor(config = {}) {
  return new Predictor({
    ...config,
    errorTolerant: false
  });
}

/**
 * Create a predictor with error-tolerant mode enabled.
 *
 * @param {Object} config - Configuration options (errorTolerant will be set to true)
 * @return {Predictor} Predictor instance in error-tolerant mode
 *
 * @example
 * const { createErrorTolerantPredictor } = require('@willwade/noisy-channel-predictor');
 *
 * const predictor = createErrorTolerantPredictor({
 *   maxEditDistance: 2,
 *   keyboardAware: true,
 *   lexicon: ['hello', 'world', 'help']
 * });
 *
 * // Will match 'hello' even with typos
 * const predictions = predictor.predictWordCompletion('helo');
 * console.log(predictions);
 */
function createErrorTolerantPredictor(config = {}) {
  return new Predictor({
    ...config,
    errorTolerant: true
  });
}

/**
 * Utility function to calculate edit distance between two strings.
 *
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @return {number} Edit distance
 *
 * @example
 * const { levenshteinDistance } = require('@willwade/noisy-channel-predictor');
 *
 * const distance = levenshteinDistance('hello', 'helo');
 * console.log(distance); // 1
 */
function levenshteinDistance(str1, str2) {
  return fuzzyMatcher.levenshteinDistance(str1, str2);
}

/**
 * Utility function to calculate similarity score between two strings.
 *
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @return {number} Similarity score (0-1, higher is more similar)
 *
 * @example
 * const { similarityScore } = require('@willwade/noisy-channel-predictor');
 *
 * const score = similarityScore('hello', 'helo');
 * console.log(score); // 0.8
 */
function similarityScore(str1, str2) {
  return fuzzyMatcher.similarityScore(str1, str2);
}

export { PPMLanguageModel, Predictor, Vocabulary, createErrorTolerantPredictor, createPredictor, createStrictPredictor, fuzzyMatcher, levenshteinDistance, similarityScore, wordTokenizer };
//# sourceMappingURL=ppmpredictor.esm.js.map
