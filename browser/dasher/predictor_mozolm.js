// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

/*
This code could be used as a base for other predictors. The predictor
programming interface is as follows.

There is a single function by which a prediction will be requested. The function
takes the following parameters.

-   `codePoints` the message for which the next character is to be predicted, as
    an array of Unicode code point numbers.
-   `text` the same message but as a string.
-   `predictorData` user data set by the predictor function by calling
    set_weight(), see below.
-   `palette` reference to the Palette object that is in use. This could be used
    for example, to find out how many characters are in the palette by reading
    the codePoints.length property.
-   `set_weight` callback to invoke to predict weights, as follows.

        set_weight(codePoint, weight, predictorData)

    Where:

    -   `codePoint` is the code point for which a prediction is being made.
    -   `weight` to assign.
    -   `predictorData` user data object that will be stored in the ZoomBox that
        represents the predicted code point. It will be passed back to this
        function as a parameter when predictions following the predicted code
        point are requested.

Unpredicted characters each get an implicit weight of one.

*/

export default async function (
    codePoints, text, predictorData, palette, set_weight
) {
  //Resolves dictionary of codepoint (key), probability (value):
  //{'a':0.93,...}
  mozolm(text).then((prob_dict)=>{
    if(palette){
      palette.codePoints.forEach((codePoint, i) => {
        const numVocabSymbols = Object.keys(prob_dict).length - 1;
        const weight = prob_dict[codePoint];

        //weight is in range 0 to 1
        if(weight){
          set_weight(codePoint, //codePoint
                     weight * numVocabSymbols,                //weight
                     null);              //predictorData
        }
        else{
          var msg = "Could not determine weight for code point: '"+String.fromCodePoint(codePoint)+"'";
          //console.log(msg);
          set_weight(codePoint, //codePoint
                     1,                //weight
                     null);              //predictorData
        }
      });
      return;
    }
    else{
      console.log("No palette provided");
    }
  });
}
