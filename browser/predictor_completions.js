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
         this._currentText = null
         this._currentPrediction = null
     }

    get(message, prediction) {
        if (this._currentText !== null && this._currentText === message) {
            if (this._currentPrediction !== null) {
                return Promise.resolve(this._currentPrediction);
            }
        }
        
        var bridge = this._bridge;
        return new Promise(function(resolve, reject) {
            
            bridge.sendObject({"command": "predict", "input" : message})
            .then(response => {
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
                  
                  var predictionsSet = new Set();
                  var predictions = null;
                  if (response["predictions"] !== undefined) {
                      var p = response["predictions"];
                      p.forEach(word => {
                        if (word.length >= message.length + 1) {
                            var w = word.substring(message.length, message.length + 1);
                            predictionsSet.add(w.codePointAt(0));
                        }
                      });
                  }
                  
                  for (const group of PredictorCompletions.characterGroups) {
                      if (group.name === boosted || group.name === only) {
                        group.codePoints.forEach(codePoint => {
                            var weight = (PredictorCompletions.vowelCodePoints.includes(codePoint) ? 2 : 1);
                            if (predictionsSet.has(codePoint)) {
                                weight = 10;
                            }
                            returning.push({
                              "codePoint": codePoint,
                              "group": weight === 10 ? "highlight" : null,
                              "boosted": group.boost,
                              "weight": weight
                            });
                        });
                      }
                      else if (only === null) {
                          returning.push({
                              "codePoint": null,
                              "group": group.name,
                              "boosted": group.name,
                              "weight": group.name === weighted ? 20 : 1
                          })
                      }
                  }
                  
                  resolve(returning);
            })
            .catch(error => reject("An error occurred whilst trying to generate predictions"));
        });
    }
}

PredictorCompletions.characterGroups = [
    {
        "name": "small", "boost": "small",
        "firstPoint": "a".codePointAt(0), "lastPoint": "z".codePointAt(0)
    }, {
        "name": "capital", "boost": "small",
        "firstPoint": "A".codePointAt(0), "lastPoint": "Z".codePointAt(0)
    }, {
        "name": "numeral", "boost": "numeral",
        "firstPoint": "0".codePointAt(0), "lastPoint": "9".codePointAt(0)
    }, {
        "name": "punctuation", "boost": "space", "texts": [
            ",", ".", "&", "!", "?"
        ]
    }, {
        "name": "space", "boost": "small", "texts": [
            " ", "\n"
        ]
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
