// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

/*
A predictor instance must have a `get` method that returns an array of objects
each with the following properties.

-   `codePoint`, the next text, like a letter, as a Unicode code point value.
-   `weight`, the visual weighting to be given to this box.
-   `group`, a group name like "capital" or null if this item doesn't represent
    a group.
-   Other custom properties for the use of the predictor, next time around.
    The Predictor class here adds one custom property: `boosted`.
*/

const codePointSpace = " ".codePointAt(0);
const codePointStop = ".".codePointAt(0);

export default class PredictorCompletions {

     constructor(bridge) {
         this._bridge = bridge;
     }
    
    _is_valid(str) {
      var code, i, len;

      for (i = 0, len = str.length; i < len; i++) {
        code = str.charCodeAt(i);
        if (!(code > 64 && code < 91) &&  // upper alpha (A-Z)
            !(code > 96 && code < 123)) { // lower alpha (a-z)
          return false;
        }
      }
      return true;
    }

    _generate_possible_next_letter_set(input, predictions) {
        var predictionsSet = new Set();
        if (predictions !== undefined) {
            predictions.forEach(word => {
              if (word.length >= input.length + 1) {
                  var w = word.substring(input.length, input.length + 1);
                  predictionsSet.add(w.codePointAt(0));
              }
            });
        }
        return predictionsSet;
    }

    _generate_predictions(message, input, prediction, predictions) {
        const lastIndex = message.length - 1;

        // Check if the messages ends full stop, space.
        const stopSpace = (
            lastIndex > 1 && message[lastIndex - 1] === codePointStop &&
            message[lastIndex] === codePointSpace
        );

        const weighted = (prediction === null || stopSpace) ? "capital" : null;
        const boosted = prediction === null ? null : prediction.boosted;
        const only = prediction === null ? null : prediction.group;

        const returning = [];
        const letters_set = this._generate_possible_next_letter_set(input, predictions);

        for (const group of PredictorCompletions.characterGroups) {
        
            group.codePoints.forEach(codePoint => {
                var weight = (PredictorCompletions.vowelCodePoints.includes(codePoint) ? 2 : 1);
                if (letters_set.has(codePoint)) {
                    weight = 5;
                }
                else if (group.name == "space") {
                    weight = 2;
                }
                returning.push({
                  "codePoint": codePoint,
                  "group": weight == 5 ? "highlight" : null,
                  "boosted": group.boost,
                  "weight": weight
                });
            });
        }
        
        return returning;
    }

    get(message, prediction) {
        var predictor = this;
        return new Promise(function(resolve, reject) {
            
            // message could be empty, be a word, or be a sentence.
            // in any case, take the latest possible chunk and use that for the next
            // prediction.
            var text = message.split(" ").splice(-1)[0];
            if (predictor._is_valid(text)) {
                predictor._bridge.sendObject({"command": "predict", "input" : text})
                .then(response => {
                    var predictions = response["predictions"];
                    resolve(predictor._generate_predictions(message, text, prediction, predictions));
                })
                .catch(error => reject("An error occurred whilst trying to generate predictions"));
            }
            else {
                resolve(predictor._generate_predictions(message, text, prediction, undefined));
            } 
        });
    }
}

PredictorCompletions.characterGroups = [
    {
        "name": "small", "boost": "small",
        "firstPoint": "a".codePointAt(0), "lastPoint": "z".codePointAt(0)
    }, 
    {
        "name": "capital", "boost": "small",
        "firstPoint": "A".codePointAt(0), "lastPoint": "Z".codePointAt(0)
    }, 
    {
        "name": "numeral", "boost": "numeral",
        "firstPoint": "0".codePointAt(0), "lastPoint": "9".codePointAt(0)
    }, 
    {
        "name": "punctuation", "boost": "space", "texts": [ ",", ".", "&", "!", "?" ]
    }, 
    {
        "name": "space", "boost": "small", "texts": [ " ", "\n" ]
    }
];

PredictorCompletions.characterGroups.forEach(group => {
    if (!("texts" in group)) {
        group.texts = [];
        for (
            let codePoint = group.firstPoint;
            codePoint <= group.lastPoint;
            codePoint++
        ) {
            group.texts.push(String.fromCodePoint(codePoint));
        }
    }
    group.codePoints = group.texts.map(text => text.codePointAt(0));
});


PredictorCompletions.vowelTexts = ["a", "e", "i", "o", "u"];
PredictorCompletions.vowelCodePoints = PredictorCompletions.vowelTexts.map(
    text => text.codePointAt(0));
